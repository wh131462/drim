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

/** 广告配额信息 */
export interface AdQuota {
    /** 每日总配额 */
    total: number;
    /** 已使用次数 */
    used: number;
    /** 剩余次数 */
    remaining: number;
}

/** 广告奖励响应 */
export interface AdRewardResponse {
    /** 是否成功 */
    success: boolean;
    /** 获得的积分 */
    points: number;
    /** 剩余次数 */
    remaining: number;
    /** 总配额 */
    total: number;
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
     * 获取广告配额信息
     */
    getAdQuota(): Promise<AdQuota> {
        return get<AdQuota>('/points/ad-quota');
    },

    /**
     * 领取广告奖励
     * @param type 广告类型: task_double(任务翻倍) | points_gain(主动看广告)
     * @param scene 观看场景，用于数据分析
     */
    claimAdReward(type?: AdRewardType, scene?: string): Promise<AdRewardResponse> {
        return post<AdRewardResponse>('/points/ad-reward', { type, scene });
    }
};
