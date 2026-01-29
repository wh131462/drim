/**
 * 解析相关 API
 */

import { get, post } from '../request';
import type { Analysis, AnalysisRequest, AnalysisResponse } from '@/types/analysis';
import type { RequestConfig } from '@/types/api';

export const analysisApi = {
    /**
     * 请求解析 (轮询模式)
     */
    request(data: AnalysisRequest, options?: Partial<RequestConfig>): Promise<AnalysisResponse> {
        return post<AnalysisResponse>('/analysis/request', data, options);
    },

    /**
     * 请求解析 (SSE 模式)
     */
    requestStream(data: AnalysisRequest, options?: Partial<RequestConfig>): Promise<AnalysisResponse> {
        return post<AnalysisResponse>('/analysis/request-stream', data, options);
    },

    /**
     * 获取解析结果
     */
    getById(analysisId: string, options?: Partial<RequestConfig>): Promise<Analysis> {
        return get<Analysis>(`/analysis/${analysisId}`, undefined, options);
    },

    /**
     * 重新解析（消耗积分）
     */
    retry(
        dreamId: string,
        options?: Partial<RequestConfig>
    ): Promise<{
        analysisId: string;
        pointsConsumed: number;
        remainingPoints: number;
    }> {
        return post('/analysis/retry', { dreamId }, options);
    }
};
