/**
 * 用户状态管理
 */

import { defineStore } from 'pinia'
import { userApi } from '@/api'
import type { User, UserStats } from '@/types/user'

interface UserState {
  token: string
  userInfo: User | null
  userStats: UserStats | null
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || null,
    userStats: null,
    isLoggedIn: false
  }),

  getters: {
    isVip: (state): boolean => state.userInfo?.isVip ?? false,
    luckyPoints: (state): number => state.userInfo?.luckyPoints ?? 0,
    consecutiveDays: (state): number => state.userInfo?.consecutiveDays ?? 0,
    nickname: (state): string => state.userInfo?.nickname ?? '梦游者',
    avatar: (state): string | null => state.userInfo?.avatar ?? null
  },

  actions: {
    /**
     * 微信登录
     */
    async login(): Promise<void> {
      try {
        // 获取微信登录 code
        const { code } = await new Promise<UniApp.LoginRes>((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: resolve,
            fail: reject
          })
        })

        // 调用后端登录接口
        const { token, userInfo } = await userApi.login({ code })

        // 保存登录状态
        this.token = token
        this.userInfo = userInfo
        this.isLoggedIn = true

        // 持久化存储
        uni.setStorageSync('token', token)
        uni.setStorageSync('userInfo', userInfo)
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    /**
     * 获取用户信息
     */
    async fetchUserInfo(): Promise<void> {
      if (!this.token) return

      try {
        this.userInfo = await userApi.getUserInfo()
        this.isLoggedIn = true
        uni.setStorageSync('userInfo', this.userInfo)
      } catch (error) {
        // 获取失败，清除登录状态
        this.logout()
        throw error
      }
    },

    /**
     * 获取用户统计
     */
    async fetchUserStats(): Promise<void> {
      if (!this.token) return

      try {
        this.userStats = await userApi.getUserStats()
      } catch (error) {
        console.error('获取用户统计失败:', error)
      }
    },

    /**
     * 设置用户信息
     */
    setUserInfo(userInfo: User): void {
      this.userInfo = userInfo
      uni.setStorageSync('userInfo', this.userInfo)
    },

    /**
     * 更新幸运值
     */
    updateLuckyPoints(points: number): void {
      if (this.userInfo) {
        this.userInfo.luckyPoints = points
        uni.setStorageSync('userInfo', this.userInfo)
      }
    },

    /**
     * 更新连续天数
     */
    updateConsecutiveDays(days: number): void {
      if (this.userInfo) {
        this.userInfo.consecutiveDays = days
        uni.setStorageSync('userInfo', this.userInfo)
      }
    },

    /**
     * 退出登录
     */
    logout(): void {
      this.token = ''
      this.userInfo = null
      this.userStats = null
      this.isLoggedIn = false

      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    },

    /**
     * 检查登录状态
     */
    checkLogin(): boolean {
      if (this.token && this.userInfo) {
        this.isLoggedIn = true
        return true
      }
      return false
    }
  }
})
