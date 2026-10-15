/**
 * 用户状态管理
 */

import { defineStore } from 'pinia';
import { userApi } from '@/api';
import type { User, UserStats } from '@/types/user';
import { isVipActive, normalizeVipStatus } from '@/utils/vip';

// 用户信息缓存有效期
const USER_INFO_TTL = 10 * 60 * 1000; // 10分钟

interface UserState {
    token: string;
    userInfo: User | null;
    userStats: UserStats | null;
    isLoggedIn: boolean;
    darkMode: boolean;
    infoFetchedAt: number;
}

// 登录锁，防止并发登录
let loginPromise: Promise<boolean> | null = null;
let vipExpiryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleVipExpiry(onExpire: () => void, user: User | null): void {
    if (vipExpiryTimer) clearTimeout(vipExpiryTimer);
    vipExpiryTimer = null;
    if (!user || !isVipActive(user)) return;

    const delay = Math.min(Math.max(Date.parse(user.vipExpireAt!) - Date.now(), 1), 2_147_483_647);
    vipExpiryTimer = setTimeout(() => {
        if (isVipActive(user)) scheduleVipExpiry(onExpire, user);
        else onExpire();
    }, delay);
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        token: uni.getStorageSync('token') || '',
        userInfo: normalizeVipStatus((uni.getStorageSync('userInfo') as User) || null),
        userStats: null,
        isLoggedIn: false,
        darkMode: uni.getStorageSync('darkMode') || false,
        infoFetchedAt: 0
    }),

    getters: {
        isVip: (state): boolean => isVipActive(state.userInfo),
        luckyPoints: (state): number => state.userInfo?.luckyPoints ?? 0,
        consecutiveDays: (state): number => state.userInfo?.consecutiveDays ?? 0,
        nickname: (state): string => state.userInfo?.nickname ?? '梦游者',
        avatar: (state): string | null => state.userInfo?.avatar ?? null,
        isDarkMode: (state): boolean => state.darkMode,
        // 判断是否需要完善资料（昵称或头像为空）
        needsProfileSetup: (state): boolean => {
            if (!state.userInfo) return false;
            return !state.userInfo.nickname || !state.userInfo.avatar;
        }
    },

    actions: {
        /**
         * 微信登录
         * @returns 是否需要完善资料
         */
        async login(): Promise<boolean> {
            // 如果已有登录请求进行中，直接返回该 Promise
            if (loginPromise) {
                console.log('登录请求进行中，复用现有请求');
                return loginPromise;
            }

            // 如果已登录，直接返回
            if (this.isLoggedIn && this.token) {
                console.log('已登录，跳过登录流程');
                return this.needsProfileSetup;
            }

            // 创建新的登录 Promise
            loginPromise = (async () => {
                try {
                    // 获取微信登录 code
                    const { code } = await new Promise<UniApp.LoginRes>((resolve, reject) => {
                        uni.login({
                            provider: 'weixin',
                            timeout: 5000,
                            success: resolve,
                            fail: reject
                        });
                    });

                    // 调用后端登录接口
                    const { token, userInfo, isNewUser } = await userApi.login({ code });

                    // 保存登录状态
                    this.token = token;
                    this.userInfo = normalizeVipStatus(userInfo);
                    this.isLoggedIn = true;
                    this.infoFetchedAt = Date.now();
                    scheduleVipExpiry(() => this.refreshVipStatus(), this.userInfo);

                    // 持久化存储
                    uni.setStorageSync('token', token);
                    uni.setStorageSync('userInfo', this.userInfo);

                    // 返回是否需要完善资料
                    return isNewUser || !userInfo.nickname || !userInfo.avatar;
                } catch (error) {
                    console.error('登录失败:', error);
                    throw error;
                } finally {
                    // 清除登录锁
                    loginPromise = null;
                }
            })();

            return loginPromise;
        },

        /**
         * 获取用户信息
         */
        async fetchUserInfo(): Promise<void> {
            if (!this.token) return;

            try {
                this.userInfo = normalizeVipStatus(await userApi.getUserInfo());
                this.isLoggedIn = true;
                this.infoFetchedAt = Date.now();
                uni.setStorageSync('userInfo', this.userInfo);
                scheduleVipExpiry(() => this.refreshVipStatus(), this.userInfo);
            } catch (error) {
                // 网络异常保留缓存；401 由请求层通知退出登录。
                this.refreshVipStatus();
                throw error;
            }
        },

        /**
         * 智能获取用户信息：有缓存则静默，过期则后台刷新
         */
        async ensureUserInfo(): Promise<void> {
            this.refreshVipStatus();
            if (!this.token) return;

            const now = Date.now();
            const isExpired = now - this.infoFetchedAt > USER_INFO_TTL;

            // 无用户信息，需要加载
            if (!this.userInfo) {
                await this.fetchUserInfo();
                return;
            }

            // 有缓存但过期，静默后台刷新
            if (isExpired) {
                void this.fetchUserInfo().catch((error) => console.error('后台刷新用户信息失败:', error));
            }
        },

        /**
         * 获取用户统计
         */
        async fetchUserStats(): Promise<void> {
            if (!this.token) return;

            try {
                this.userStats = await userApi.getUserStats();
            } catch (error) {
                console.error('获取用户统计失败:', error);
            }
        },

        /**
         * 设置用户信息
         */
        setUserInfo(userInfo: User): void {
            this.userInfo = normalizeVipStatus(userInfo);
            this.infoFetchedAt = Date.now();
            scheduleVipExpiry(() => this.refreshVipStatus(), this.userInfo);
            uni.setStorageSync('userInfo', this.userInfo);
        },

        refreshVipStatus(): void {
            if (this.userInfo?.isVip && !isVipActive(this.userInfo)) {
                this.userInfo = { ...this.userInfo, isVip: false };
                this.infoFetchedAt = 0;
            }
            if (this.userInfo) uni.setStorageSync('userInfo', this.userInfo);
            scheduleVipExpiry(() => this.refreshVipStatus(), this.userInfo);
        },

        /**
         * 更新幸运值
         */
        updateLuckyPoints(points: number): void {
            if (this.userInfo) {
                this.userInfo.luckyPoints = points;
                uni.setStorageSync('userInfo', this.userInfo);
            }
        },

        /**
         * 更新连续天数
         */
        updateConsecutiveDays(days: number): void {
            if (this.userInfo) {
                this.userInfo.consecutiveDays = days;
                uni.setStorageSync('userInfo', this.userInfo);
            }
        },

        /**
         * 退出登录
         */
        logout(): void {
            if (vipExpiryTimer) clearTimeout(vipExpiryTimer);
            vipExpiryTimer = null;
            this.token = '';
            this.userInfo = null;
            this.userStats = null;
            this.isLoggedIn = false;
            this.infoFetchedAt = 0;

            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');
        },

        /**
         * 检查登录状态
         */
        checkLogin(): boolean {
            this.refreshVipStatus();
            if (this.token && this.userInfo) {
                this.isLoggedIn = true;
                return true;
            }
            return false;
        },

        /**
         * 切换暗黑模式
         */
        toggleDarkMode(enabled: boolean): void {
            this.darkMode = enabled;
            uni.setStorageSync('darkMode', enabled);

            // 触发全局事件通知其他页面更新
            uni.$emit('darkModeChanged', enabled);
        }
    }
});
