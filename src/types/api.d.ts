/**
 * API 相关类型定义
 */

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
  requestId: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface RequestConfig extends UniApp.RequestOptions {
  showLoading?: boolean
  showError?: boolean
}

// 错误码
export enum ErrorCode {
  SUCCESS = 0,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  SERVER_ERROR = 500,
  USER_NOT_FOUND = 10001,
  LOGIN_FAILED = 10002,
  DREAM_CONTENT_INVALID = 20001,
  DREAM_ALREADY_RECORDED = 20002,
  AI_ANALYSIS_FAILED = 20003,
  POINTS_NOT_ENOUGH = 30001,
  AD_VERIFY_FAILED = 40001
}
