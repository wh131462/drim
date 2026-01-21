/**
 * 请求封装
 */

import type { ApiResponse, RequestConfig } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 获取 token
function getToken(): string {
  return uni.getStorageSync('token') || ''
}

// 请求方法
export function request<T>(config: RequestConfig): Promise<T> {
  return new Promise((resolve, reject) => {
    const { showLoading = true, showError = true, ...restConfig } = config

    if (showLoading) {
      uni.showLoading({ title: '加载中...', mask: true })
    }

    uni.request({
      ...restConfig,
      url: `${BASE_URL}${config.url}`,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        'X-Platform': getPlatform(),
        'X-Version': getAppVersion(),
        ...config.header
      },
      success: (res) => {
        const data = res.data as ApiResponse<T>

        if (data.code === 0) {
          resolve(data.data)
        } else if (data.code === 401) {
          // Token 过期，清除登录状态
          handleUnauthorized()
          reject(new Error('登录已过期，请重新登录'))
        } else {
          if (showError) {
            uni.showToast({
              title: data.message || '请求失败',
              icon: 'none',
              duration: 2000
            })
          }
          reject(new Error(data.message))
        }
      },
      fail: (err) => {
        if (showError) {
          uni.showToast({
            title: '网络错误，请稍后重试',
            icon: 'none',
            duration: 2000
          })
        }
        reject(err)
      },
      complete: () => {
        if (showLoading) {
          uni.hideLoading()
        }
      }
    })
  })
}

// 获取平台标识
function getPlatform(): string {
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif
  // #ifdef H5
  return 'h5'
  // #endif
  // #ifdef APP-PLUS
  return 'app'
  // #endif
  return 'unknown'
}

// 获取应用版本
function getAppVersion(): string {
  return '1.0.0'
}

// 处理未授权
function handleUnauthorized(): void {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')

  // 跳转到首页
  uni.reLaunch({
    url: '/pages/index/index'
  })
}

// GET 请求
export function get<T>(url: string, data?: Record<string, unknown>, options?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'GET',
    data,
    ...options
  })
}

// POST 请求
export function post<T>(url: string, data?: Record<string, unknown>, options?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options
  })
}

// PUT 请求
export function put<T>(url: string, data?: Record<string, unknown>, options?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

// DELETE 请求
export function del<T>(url: string, data?: Record<string, unknown>, options?: Partial<RequestConfig>): Promise<T> {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}
