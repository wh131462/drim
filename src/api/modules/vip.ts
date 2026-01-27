/**
 * 权益模块 API（原 VIP 模块，改为积分兑换模式）
 * 适用于个人开发者（无企业资质）场景
 */

import { get, post } from '../request';

// 权益信息
export interface PrivilegeInfo {
    hasPrivilege: boolean;
    expireAt: string | null;
    currentPoints: number;
    benefits: {
        key: string;
        name: string;
        enabled: boolean;
    }[];
    exchangeItems: {
        id: string;
        name: string;
        duration: string;
        points: number;
        originalPoints: number | null;
    }[];
    earnWays: {
        name: string;
        points: number | string;
    }[];
}

// 兑换响应
export interface ExchangeResponse {
    exchangeId: string;
    itemId: string;
    itemName: string;
    duration: string;
    pointsConsumed: number;
    remainingPoints: number;
    privilegeExpireAt: string;
}

// 兑换记录
export interface ExchangeRecord {
    exchangeId: string;
    itemId: string;
    itemName: string;
    duration: string;
    pointsConsumed: number;
    exchangedAt: string;
    expireAt: string;
}

export interface ExchangeRecordsResponse {
    list: ExchangeRecord[];
    total: number;
    page: number;
    pageSize: number;
}

export const privilegeApi = {
    /**
     * 获取权益信息
     */
    getInfo(): Promise<PrivilegeInfo> {
        return get<PrivilegeInfo>('/privilege/info');
    },

    /**
     * 积分兑换权益
     */
    exchange(itemId: string): Promise<ExchangeResponse> {
        return post<ExchangeResponse>('/privilege/exchange', { itemId });
    },

    /**
     * 获取兑换记录
     */
    getRecords(page = 1, pageSize = 20): Promise<ExchangeRecordsResponse> {
        return get<ExchangeRecordsResponse>('/privilege/records', { page, pageSize });
    }
};

// 保留旧的 vipApi 别名以兼容
export const vipApi = privilegeApi;
