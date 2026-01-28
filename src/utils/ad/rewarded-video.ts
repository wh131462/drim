/**
 * 激励视频广告服务
 */

import { AD_CONFIG, isAdConfigured, isWeixinMiniProgram } from './config';

/** 广告类型 */
export type RewardedAdType = 'task_double' | 'points_gain';

/** 广告结果 */
export interface RewardedVideoResult {
    /** 是否成功播放 */
    success: boolean;
    /** 是否完整观看 */
    isEnded: boolean;
    /** 错误信息 */
    errMsg?: string;
}

/** 广告状态 */
export interface AdStatus {
    /** 广告是否可用 */
    available: boolean;
    /** 是否正在加载 */
    loading: boolean;
    /** 错误信息 */
    error?: string;
}

class RewardedVideoAdService {
    private adInstances: Map<RewardedAdType, WechatMiniprogram.RewardedVideoAd> = new Map();
    private loadingStatus: Map<RewardedAdType, boolean> = new Map();

    /**
     * 获取广告位 ID
     */
    private getAdUnitId(type: RewardedAdType): string {
        switch (type) {
            case 'task_double':
                return AD_CONFIG.REWARDED_VIDEO.TASK_DOUBLE;
            case 'points_gain':
                return AD_CONFIG.REWARDED_VIDEO.POINTS_GAIN;
            default:
                return '';
        }
    }

    /**
     * 获取或创建广告实例
     */
    private getAdInstance(type: RewardedAdType): WechatMiniprogram.RewardedVideoAd | null {
        if (!isWeixinMiniProgram()) {
            console.warn('[Ad] 非微信小程序环境，广告不可用');
            return null;
        }

        // 检查缓存
        if (this.adInstances.has(type)) {
            return this.adInstances.get(type)!;
        }

        const adUnitId = this.getAdUnitId(type);

        if (!isAdConfigured(adUnitId)) {
            console.warn('[Ad] 广告位ID未配置:', type);
            return null;
        }

        try {
            // #ifdef MP-WEIXIN
            const ad = wx.createRewardedVideoAd({ adUnitId });

            // 监听加载事件
            ad.onLoad(() => {
                console.log('[Ad] 广告加载成功:', type);
                this.loadingStatus.set(type, false);
            });

            // 监听错误事件（用于预加载失败的情况）
            ad.onError((err) => {
                console.error('[Ad] 广告加载失败:', type, err);
                this.loadingStatus.set(type, false);
            });

            this.adInstances.set(type, ad);
            return ad;
            // #endif
        } catch (error) {
            console.error('[Ad] 创建广告实例失败:', error);
            return null;
        }

        return null;
    }

    /**
     * 预加载广告
     */
    preload(type: RewardedAdType): void {
        // 广告功能未开启时不预加载
        if (!AD_CONFIG.ENABLED) return;

        const ad = this.getAdInstance(type);
        if (ad && !this.loadingStatus.get(type)) {
            this.loadingStatus.set(type, true);
            ad.load().catch(() => {
                this.loadingStatus.set(type, false);
            });
        }
    }

    /**
     * 检查广告是否可用
     */
    isAvailable(type: RewardedAdType): boolean {
        const adUnitId = this.getAdUnitId(type);
        return AD_CONFIG.ENABLED && isWeixinMiniProgram() && isAdConfigured(adUnitId);
    }

    /**
     * 显示激励视频广告
     * @param type 广告类型
     * @returns 广告播放结果
     */
    async show(type: RewardedAdType): Promise<RewardedVideoResult> {
        // 检查广告功能是否开启
        if (!AD_CONFIG.ENABLED) {
            return {
                success: false,
                isEnded: false,
                errMsg: '广告功能暂未开放'
            };
        }

        // 检查环境
        if (!isWeixinMiniProgram()) {
            return {
                success: false,
                isEnded: false,
                errMsg: '非微信小程序环境'
            };
        }

        const ad = this.getAdInstance(type);

        if (!ad) {
            return {
                success: false,
                isEnded: false,
                errMsg: '广告服务不可用，请稍后重试'
            };
        }

        return new Promise((resolve) => {
            let resolved = false;

            // 监听关闭事件
            const onClose = (res: { isEnded: boolean }) => {
                if (resolved) return;
                resolved = true;

                ad.offClose(onClose);
                ad.offError(onError);

                console.log('[Ad] 广告关闭:', type, '完整观看:', res.isEnded);

                resolve({
                    success: true,
                    isEnded: res.isEnded
                });

                // 预加载下一次广告
                this.preload(type);
            };

            // 监听错误事件
            const onError = (err: { errMsg: string; errCode?: number }) => {
                if (resolved) return;
                resolved = true;

                ad.offClose(onClose);
                ad.offError(onError);

                console.error('[Ad] 广告错误:', type, err);

                resolve({
                    success: false,
                    isEnded: false,
                    errMsg: this.getErrorMessage(err.errCode)
                });
            };

            ad.onClose(onClose);
            ad.onError(onError);

            // 显示加载提示
            uni.showLoading({ title: '广告加载中...', mask: true });

            // 加载并显示广告
            ad.load()
                .then(() => {
                    uni.hideLoading();
                    return ad.show();
                })
                .catch((err) => {
                    uni.hideLoading();

                    if (resolved) return;
                    resolved = true;

                    ad.offClose(onClose);
                    ad.offError(onError);

                    console.error('[Ad] 广告加载/显示失败:', type, err);

                    resolve({
                        success: false,
                        isEnded: false,
                        errMsg: this.getErrorMessage(err.errCode) || err.errMsg || '广告加载失败'
                    });
                });

            // 超时处理
            setTimeout(() => {
                if (resolved) return;
                resolved = true;

                uni.hideLoading();
                ad.offClose(onClose);
                ad.offError(onError);

                resolve({
                    success: false,
                    isEnded: false,
                    errMsg: '广告加载超时，请稍后重试'
                });
            }, 30000); // 30秒超时
        });
    }

    /**
     * 获取错误提示信息
     */
    private getErrorMessage(errCode?: number): string {
        switch (errCode) {
            case 1000:
                return '后端错误，请稍后重试';
            case 1001:
                return '参数错误';
            case 1002:
                return '广告单元无效';
            case 1003:
                return '内部错误，请稍后重试';
            case 1004:
                return '暂无适合的广告';
            case 1005:
                return '广告组件审核中';
            case 1006:
                return '广告组件被驳回';
            case 1007:
                return '广告能力被封禁';
            case 1008:
                return '广告单元已关闭';
            default:
                return '广告加载失败，请稍后重试';
        }
    }

    /**
     * 销毁指定类型的广告实例
     */
    destroyInstance(type: RewardedAdType): void {
        const ad = this.adInstances.get(type);
        if (ad) {
            // #ifdef MP-WEIXIN
            ad.destroy?.();
            // #endif
            this.adInstances.delete(type);
            this.loadingStatus.delete(type);
        }
    }

    /**
     * 销毁所有广告实例
     */
    destroy(): void {
        this.adInstances.forEach((ad, type) => {
            // #ifdef MP-WEIXIN
            ad.destroy?.();
            // #endif
        });
        this.adInstances.clear();
        this.loadingStatus.clear();
    }
}

// 导出单例
export const rewardedVideoAd = new RewardedVideoAdService();
