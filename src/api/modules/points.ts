/**
 * 积分相关 API
 */

import { get } from '../request';

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
    }
};
