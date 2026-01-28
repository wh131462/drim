/**
 * 积分相关 API
 */

import { get, post } from '../request';

export interface PointsInfo {
    balance: number;
    totalEarned: number;
    totalConsumed: number;
}

export interface PointRecord {
    id: string;
    type: 'earn' | 'consume';
    amount: number;
    balance: number;
    source: string;
    description: string;
    createdAt: string;
}

export interface PointRecordsResponse {
    records: PointRecord[];
    total: number;
    page: number;
    pageSize: number;
}

/** 广告奖励类型 */
export type AdRewardType = 'task_double' | 'points_gain';

/** 广告状态响应 */
export interface AdStatusResponse {
    /** 今日已观看广告次数 */
    todayAdCount: number;
    /** 每日广告上限 */
    dailyLimit: number;
    /** 剩余观看次数 */
    remainingCount: number;
    /** 是否还可以观看广告 */
    canWatch: boolean;
}

/** 广告奖励响应 */
export interface AdRewardResponse {
    /** 是否成功 */
    success: boolean;
    /** 获得的积分 */
    points: number;
    /** 当前总积分 */
    totalPoints: number;
    /** 今日剩余广告观看次数 */
    remainingAdCount: number;
}

export const pointsApi = {
    /**
     * 获取积分信息
     */
    getInfo(): Promise<PointsInfo> {
        return get<PointsInfo>('/points');
    },

    /**
     * 获取积分记录
     */
    getRecords(params?: {
        page?: number;
        pageSize?: number;
        type?: 'earn' | 'consume';
    }): Promise<PointRecordsResponse> {
        return get<PointRecordsResponse>('/points/records', params as Record<string, unknown>);
    },

    /**
     * 获取广告观看状态
     */
    getAdStatus(): Promise<AdStatusResponse> {
        return get<AdStatusResponse>('/points/ad-status');
    },

    /**
     * 领取广告奖励
     * @param type 广告类型: task_double(任务双倍) | points_gain(获取积分)
     */
    claimAdReward(type: AdRewardType): Promise<AdRewardResponse> {
        return post<AdRewardResponse>('/points/ad-reward', { type });
    }
};
