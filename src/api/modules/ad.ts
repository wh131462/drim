/**
 * 广告相关 API
 */

import { post } from '../request';

export interface AdReportParams {
    adType: 'reward_video' | 'interstitial';
    position: string;
    eventType: 'load' | 'show' | 'close' | 'error' | 'complete';
    duration?: number;
    errorMsg?: string;
}

export interface AdRewardResponse {
    token: string;
    expireAt: string;
}

export const adApi = {
    /**
     * 上报广告事件
     */
    report(params: AdReportParams): Promise<void> {
        return post<void>('/ad/report', params as Record<string, unknown>);
    },

    /**
     * 获取广告奖励凭证
     */
    getRewardToken(adType: string, position: string): Promise<AdRewardResponse> {
        return post<AdRewardResponse>('/ad/reward', { adType, position });
    },

    /**
     * 验证广告奖励
     */
    verifyReward(token: string): Promise<{ valid: boolean; points?: number }> {
        return post<{ valid: boolean; points?: number }>('/ad/verify', { token });
    }
};
