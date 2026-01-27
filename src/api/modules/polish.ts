/**
 * AI 润色相关 API
 */

import { get, post } from '../request';

export interface PolishResult {
    versionId: string;
    content: string;
    versionNumber: number;
    quota?: PolishQuota | null;
}

export interface PolishQuota {
    date: string;
    total: number;
    used: number;
    remaining: number;
    isVip: boolean;
}

export interface DreamVersion {
    id: string;
    type: 'original' | 'polished';
    content: string;
    polishedFrom?: string | null;
    polishPrompt?: string | null;
    versionNumber: number;
    isCurrent: boolean;
    createdAt: string;
}

export interface VersionsResponse {
    dreamId: string;
    currentVersionId?: string | null;
    totalVersions: number;
    versions: DreamVersion[];
}

export const polishApi = {
    /**
     * 纯文本润色(不需要梦境ID)
     */
    polishText(content: string, prompt?: string): Promise<{ content: string; quota: PolishQuota | null }> {
        return post<{ content: string; quota: PolishQuota | null }>('/polish/text', {
            content,
            prompt
        });
    },

    /**
     * 润色梦境
     */
    polishDream(dreamId: string, data?: { prompt?: string; basedOnVersionId?: string }): Promise<PolishResult> {
        return post<PolishResult>(`/polish/dream/${dreamId}`, data);
    },

    /**
     * 获取润色配额
     */
    getQuota(): Promise<PolishQuota> {
        return get<PolishQuota>('/polish/quota');
    },

    /**
     * 切换梦境当前版本
     */
    switchVersion(
        dreamId: string,
        versionId: string
    ): Promise<{ success: boolean; currentVersionId: string; content: string }> {
        return post(`/polish/dream/${dreamId}/switch-version/${versionId}`);
    },

    /**
     * 获取梦境版本历史
     */
    getVersions(dreamId: string): Promise<VersionsResponse> {
        return get<VersionsResponse>(`/polish/dream/${dreamId}/versions`);
    }
};
