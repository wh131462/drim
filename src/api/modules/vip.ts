/**
 * VIP 相关 API
 */

import { get, post } from '../request'
import type { VipInfo, CreateOrderResponse, OrderDetail } from '@/types/vip'

export const vipApi = {
  /**
   * 获取会员信息
   */
  getInfo(): Promise<VipInfo> {
    return get<VipInfo>('/vip/info')
  },

  /**
   * 创建订单
   */
  createOrder(planId: string): Promise<CreateOrderResponse> {
    return post<CreateOrderResponse>('/vip/order', { planId })
  },

  /**
   * 查询订单状态
   */
  getOrderStatus(orderId: string): Promise<OrderDetail> {
    return get<OrderDetail>(`/vip/order/${orderId}`)
  }
}
