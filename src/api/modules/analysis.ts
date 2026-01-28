/**
 * 解析相关 API
 */

import { get, post } from '../request';
import type { Analysis, AnalysisRequest, AnalysisResponse } from '@/types/analysis';

export const analysisApi = {
    /**
     * 请求解析 (轮询模式)
     */
    request(data: AnalysisRequest): Promise<AnalysisResponse> {
        return post<AnalysisResponse>('/analysis/request', data);
    },

    /**
     * 请求解析 (SSE 模式)
     */
    requestStream(data: AnalysisRequest): Promise<AnalysisResponse> {
        return post<AnalysisResponse>('/analysis/request-stream', data);
    },

    /**
     * 获取解析结果
     */
    getById(analysisId: string): Promise<Analysis> {
        return get<Analysis>(`/analysis/${analysisId}`);
    },

    /**
     * 重新解析（消耗积分）
     */
    retry(dreamId: string): Promise<{
        analysisId: string;
        pointsConsumed: number;
        remainingPoints: number;
    }> {
        return post('/analysis/retry', { dreamId });
    }
};
