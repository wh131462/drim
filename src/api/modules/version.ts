/**
 * 梦境版本相关 API
 */

import { get, post } from '../request';

/**
 * 版本类型
 */
export type VersionType = 'original' | 'polished';

/**
 * 版本统计信息
 */
export interface VersionStats {
    total: number;
    original: number;
    polished: number;
}

/**
 * 梦境版本
 */
export interface DreamVersion {
    versionId: string;
    dreamId: string;
    type: VersionType;
    content: string;
    polishedFrom?: string;
    versionNumber: number;
    isCurrent: boolean;
    createdAt: string;
}

/**
 * 版本列表响应
 */
export interface VersionListResponse {
    dreamId: string;
    stats: VersionStats;
    versions: DreamVersion[];
}

/**
 * 版本详情响应
 */
export interface VersionDetailResponse extends DreamVersion {
    aiModel?: string;
    tokensUsed?: number;
}

/**
 * 切换版本请求
 */
export interface SwitchVersionParams {
    versionId: string;
}

/**
 * 切换版本响应
 */
export interface SwitchVersionResponse {
    message: string;
    currentVersion: {
        versionId: string;
        versionNumber: number;
        type: VersionType;
        content: string;
    };
}

export const versionApi = {
    /**
     * 获取梦境的所有版本列表
     */
    getVersions(dreamId: string): Promise<VersionListResponse> {
        return get<VersionListResponse>(`/version/dream/${dreamId}`);
    },

    /**
     * 切换到指定版本
     */
    switchVersion(dreamId: string, versionId: string): Promise<SwitchVersionResponse> {
        return post<SwitchVersionResponse>(`/version/dream/${dreamId}/switch`, {
            versionId
        });
    },

    /**
     * 获取版本详情
     */
    getVersionDetail(versionId: string): Promise<VersionDetailResponse> {
        return get<VersionDetailResponse>(`/version/${versionId}`);
    }
};
