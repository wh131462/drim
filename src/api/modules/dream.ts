/**
 * 梦境相关 API
 */

import { get, post, del } from '../request'
import type {
  Dream,
  DreamDetail,
  DreamInput,
  DreamListParams,
  DreamListResponse,
  CalendarResponse
} from '@/types/dream'

export const dreamApi = {
  /**
   * 提交梦境
   */
  create(data: DreamInput): Promise<Dream> {
    return post<Dream>('/dream', data)
  },

  /**
   * 获取梦境列表
   */
  getList(params?: DreamListParams): Promise<DreamListResponse> {
    return get<DreamListResponse>('/dream/list', params)
  },

  /**
   * 获取梦境详情
   */
  getById(dreamId: string): Promise<DreamDetail> {
    return get<DreamDetail>(`/dream/${dreamId}`)
  },

  /**
   * 获取日历数据
   */
  getCalendar(year: number, month: number): Promise<CalendarResponse> {
    return get<CalendarResponse>('/dream/calendar', { year, month })
  },

  /**
   * 删除梦境
   */
  delete(dreamId: string): Promise<void> {
    return del<void>(`/dream/${dreamId}`)
  }
}
