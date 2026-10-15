/**
 * 请求封装
 */

import type { ApiResponse, RequestConfig } from '@/types/api';

// API 基础地址 (默认本地开发地址)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/v1';

// 是否使用 Mock 数据
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// 本地服务未启动时尽快返回；线上请求保留原超时。
const TIMEOUT = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(BASE_URL) ? 5000 : 30000;

// 获取 token
export function getToken(): string {
    return uni.getStorageSync('token') || '';
}

// 获取 API 基础地址
export function getBaseUrl(): string {
    return BASE_URL;
}

// AI 服务错误友好提示映射
function formatAiError(message: string): string {
    const lowerMsg = message.toLowerCase();

    // 网络/连接错误
    if (lowerMsg.includes('timeout') || lowerMsg.includes('超时')) {
        return '服务响应超时，请稍后重试';
    }
    if (lowerMsg.includes('network') || lowerMsg.includes('econnrefused')) {
        return '服务连接失败，请稍后重试';
    }

    // HTTP 状态码错误
    if (lowerMsg.includes('status code 401') || lowerMsg.includes('unauthorized')) {
        return '服务认证失败，请联系客服';
    }
    if (lowerMsg.includes('status code 403') || lowerMsg.includes('forbidden')) {
        return '服务访问被拒绝';
    }
    if (lowerMsg.includes('status code 404')) {
        return '服务配置错误，请联系客服';
    }
    if (lowerMsg.includes('status code 429') || lowerMsg.includes('rate limit')) {
        return '服务繁忙，请稍后重试';
    }
    if (lowerMsg.includes('status code 5') || lowerMsg.includes('internal server')) {
        return '服务暂时不可用，请稍后重试';
    }

    // AI 响应格式错误
    if (lowerMsg.includes('ai响应格式异常') || lowerMsg.includes('response format')) {
        return '服务返回异常，请重试';
    }

    // 配额相关
    if (lowerMsg.includes('quota') || lowerMsg.includes('配额')) {
        return '今日润色次数已用完';
    }

    return message;
}

// 请求方法
export function request<T>(config: RequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
        const { showLoading = true, showError = true, timeout = TIMEOUT, ...restConfig } = config;
        const token = getToken();

        if (showLoading) {
            uni.showLoading({ title: '加载中...', mask: true });
        }

        uni.request({
            ...restConfig,
            url: `${BASE_URL}${config.url}`,
            timeout,
            header: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Platform': getPlatform(),
                'X-Version': getAppVersion(),
                ...config.header
            },
            success: (res) => {
                const data = res.data as ApiResponse<T>;

                if (res.statusCode === 401 || data?.code === 401) {
                    // 并发旧请求只注销它们所属的会话，避免重复跳转或误清除新 token。
                    if (token && token === getToken()) handleUnauthorized();
                    reject(new Error('登录已过期，请重新登录'));
                } else if (res.statusCode >= 200 && res.statusCode < 300 && data?.code === 0) {
                    resolve(data.data);
                } else {
                    // 处理错误消息（可能是字符串或数组）
                    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
                    let errorMsg = typeof message === 'string' && message ? message : '请求失败';

                    // AI 服务相关错误的友好提示
                    errorMsg = formatAiError(errorMsg);

                    if (showError) {
                        uni.showToast({
                            title: errorMsg,
                            icon: 'none',
                            duration: 2000
                        });
                    }
                    reject(Object.assign(new Error(errorMsg), { code: data?.code }));
                }
            },
            fail: (err) => {
                if (showError) {
                    uni.showToast({
                        title: '网络错误，请稍后重试',
                        icon: 'none',
                        duration: 2000
                    });
                }
                reject(
                    new Error(
                        err.errMsg?.includes('timeout') ? '服务连接超时，请稍后重试' : '无法连接服务，请检查网络后重试'
                    )
                );
            },
            complete: () => {
                if (showLoading) {
                    uni.hideLoading();
                }
            }
        });
    });
}

// 获取平台标识
function getPlatform(): string {
    // #ifdef MP-WEIXIN
    return 'mp-weixin';
    // #endif
    // #ifdef H5
    return 'h5';
    // #endif
    // #ifdef APP-PLUS
    return 'app';
    // #endif
    return 'unknown';
}

// 获取应用版本
function getAppVersion(): string {
    return '1.0.0';
}

// 处理未授权
function handleUnauthorized(): void {
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');

    // 通知 store 清除内存中的登录状态（避免循环依赖，使用事件通信）
    uni.$emit('unauthorized');

    // 跳转到首页，触发重新登录
    uni.reLaunch({
        url: '/pages/index/index'
    });
}

// GET 请求
export function get<T>(url: string, data?: object, options?: Partial<RequestConfig>): Promise<T> {
    // 对于 GET 请求，将参数转换为 URL 查询字符串
    let finalUrl = url;
    if (data && Object.keys(data).length > 0) {
        const params = Object.entries(data)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');

        if (params) {
            finalUrl = `${url}${url.includes('?') ? '&' : '?'}${params}`;
        }
    }

    return request<T>({
        url: finalUrl,
        method: 'GET',
        // 列表加载和后台刷新不应阻止页面切换或滑动。
        showLoading: false,
        ...options
    });
}

// POST 请求
export function post<T>(url: string, data?: RequestConfig['data'], options?: Partial<RequestConfig>): Promise<T> {
    return request<T>({
        url,
        method: 'POST',
        data,
        ...options
    });
}

// PUT 请求
export function put<T>(url: string, data?: RequestConfig['data'], options?: Partial<RequestConfig>): Promise<T> {
    return request<T>({
        url,
        method: 'PUT',
        data,
        ...options
    });
}

// DELETE 请求
export function del<T>(url: string, data?: RequestConfig['data'], options?: Partial<RequestConfig>): Promise<T> {
    return request<T>({
        url,
        method: 'DELETE',
        data,
        ...options
    });
}
