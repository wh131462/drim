/**
 * VIP 相关类型定义
 */

/**
 * VIP 套餐
 */
export interface VipPlan {
  id: string
  name: string
  price: number
  originalPrice: number
}

/**
 * VIP 权益
 */
export interface VipBenefit {
  key: string
  name: string
  enabled: boolean
}

/**
 * VIP 信息
 */
export interface VipInfo {
  isVip: boolean
  expireAt: string | null
  benefits: VipBenefit[]
  plans: VipPlan[]
}

/**
 * 支付参数
 */
export interface PaymentParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

/**
 * 创建订单响应
 */
export interface CreateOrderResponse {
  orderId: string
  paymentParams: PaymentParams
}

/**
 * 订单状态
 */
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

/**
 * 订单详情
 */
export interface OrderDetail {
  orderId: string
  status: OrderStatus
  planId: string
  amount: number
  paidAt: string | null
  vipExpireAt: string | null
}
