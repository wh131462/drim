/**
 * 梦境相关 API
 */

import { get, post, put, del } from '../request';
import type {
    Dream,
    DreamDetail,
    DreamInput,
    DreamListParams,
    DreamListResponse,
    CalendarResponse,
    CreateDreamResponse
} from '@/types/dream';

export const dreamApi = {
    /**
     * 提交梦境
     */
    create(data: DreamInput): Promise<CreateDreamResponse> {
        return post<CreateDreamResponse>('/dream', data);
    },

    /**
     * 获取梦境列表
     */
    getList(params?: DreamListParams): Promise<DreamListResponse> {
        return get<DreamListResponse>('/dream/list', params);
    },

    /**
     * 获取梦境详情
     */
    getById(dreamId: string): Promise<DreamDetail> {
        return get<DreamDetail>(`/dream/${dreamId}`);
    },

    /**
     * 获取日历数据
     */
    getCalendar(year: number, month: number): Promise<CalendarResponse> {
        return get<CalendarResponse>('/dream/calendar', { year, month });
    },

    /**
     * 更新梦境内容
     */
    update(
        dreamId: string,
        data: { content: string; reAnalyze?: boolean }
    ): Promise<Dream & { needReAnalyze: boolean; pointsConsumed: number; remainingPoints: number }> {
        return put<Dream & { needReAnalyze: boolean; pointsConsumed: number; remainingPoints: number }>(
            `/dream/${dreamId}`,
            data
        );
    },

    /**
     * 删除梦境
     */
    delete(dreamId: string): Promise<void> {
        return del<void>(`/dream/${dreamId}`);
    },

    /**
     * 批量删除梦境
     */
    batchDelete(ids: string[]): Promise<{ deletedCount: number }> {
        return post<{ deletedCount: number }>('/dream/batch-delete', { ids });
    },

    /**
     * 切换梦境隐私状态
     */
    togglePrivacy(dreamId: string): Promise<{ isPublic: boolean }> {
        return post<{ isPublic: boolean }>(`/dream/${dreamId}/toggle-privacy`);
    }
};
