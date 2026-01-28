/**
 * SSE 客户端封装
 * 支持 H5 环境 (EventSource) 和小程序环境 (enableChunked)
 */

import { getToken, getBaseUrl } from '@/api/request';

/**
 * SSE 事件类型
 */
export interface SSEEvent {
    type: 'start' | 'progress' | 'complete' | 'error';
    data?: any;
    message?: string;
    timestamp: number;
}

/**
 * SSE 客户端配置
 */
export interface SSEClientOptions {
    onStart?: () => void;
    onProgress?: (message: string) => void;
    onComplete?: (data: any) => void;
    onError?: (error: string) => void;
    timeout?: number;
}

/**
 * 处理 SSE 事件
 */
function handleEvent(event: SSEEvent, options: SSEClientOptions): void {
    switch (event.type) {
        case 'start':
            options.onStart?.();
            break;
        case 'progress':
            options.onProgress?.(event.message || '');
            break;
        case 'complete':
            options.onComplete?.(event.data);
            break;
        case 'error':
            options.onError?.(event.message || '解析失败');
            break;
    }
}

/**
 * 版本号比较
 */
function compareVersion(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const len = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < len; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

/**
 * ArrayBuffer 转字符串
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
    // 小程序环境
    if (typeof TextDecoder === 'undefined') {
        const uint8Array = new Uint8Array(buffer);
        let result = '';
        for (let i = 0; i < uint8Array.length; i++) {
            result += String.fromCharCode(uint8Array[i]);
        }
        // 处理 UTF-8 编码
        try {
            return decodeURIComponent(escape(result));
        } catch {
            return result;
        }
    }
    // H5 环境
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
}

/**
 * H5 环境使用原生 EventSource
 */
function createH5SSEClient(url: string, options: SSEClientOptions): () => void {
    const eventSource = new EventSource(url);
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    // 设置超时
    if (options.timeout) {
        timeoutTimer = setTimeout(() => {
            eventSource.close();
            options.onError?.('连接超时');
        }, options.timeout);
    }

    const clearTimer = () => {
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }
    };

    eventSource.onmessage = (event) => {
        try {
            const data: SSEEvent = JSON.parse(event.data);
            handleEvent(data, options);

            // 完成或错误时清理
            if (data.type === 'complete' || data.type === 'error') {
                clearTimer();
                eventSource.close();
            }
        } catch (e) {
            console.error('SSE parse error:', e);
        }
    };

    eventSource.onerror = () => {
        clearTimer();
        eventSource.close();
        options.onError?.('连接异常');
    };

    return () => {
        clearTimer();
        eventSource.close();
    };
}

/**
 * 小程序环境使用 uni.request + enableChunked
 * 需要基础库 2.20.2+
 */
function createMPSSEClient(url: string, options: SSEClientOptions): () => void {
    let aborted = false;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    // 设置超时
    if (options.timeout) {
        timeoutTimer = setTimeout(() => {
            aborted = true;
            options.onError?.('连接超时');
        }, options.timeout);
    }

    const clearTimer = () => {
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }
    };

    // 检查是否支持 enableChunked
    const systemInfo = uni.getSystemInfoSync();
    const sdkVersion = systemInfo.SDKVersion || '0.0.0';
    const supportChunked = compareVersion(sdkVersion, '2.20.2') >= 0;

    if (!supportChunked) {
        console.warn('SSE not supported, SDK version:', sdkVersion);
        clearTimer();
        options.onError?.('当前版本不支持实时推送');
        return () => {};
    }

    let buffer = '';

    const requestTask = uni.request({
        url,
        method: 'GET',
        enableChunked: true,
        header: {
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache'
        },
        success: () => {
            // chunked 模式下，success 在连接关闭后触发
        },
        fail: (err) => {
            if (!aborted) {
                clearTimer();
                options.onError?.(err.errMsg || '连接失败');
            }
        }
    });

    // 监听 chunk 数据
    requestTask.onChunkReceived?.((res: { data: ArrayBuffer }) => {
        if (aborted) return;

        // 解析 ArrayBuffer 为文本
        const text = arrayBufferToString(res.data);
        buffer += text;

        // 解析 SSE 格式: data: {...}\n\n
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const dataMatch = line.match(/data:\s*(.+)/);
            if (dataMatch) {
                try {
                    const data: SSEEvent = JSON.parse(dataMatch[1]);
                    handleEvent(data, options);

                    if (data.type === 'complete' || data.type === 'error') {
                        clearTimer();
                        aborted = true;
                        requestTask.abort();
                    }
                } catch (e) {
                    console.error('SSE parse error:', e);
                }
            }
        }
    });

    return () => {
        clearTimer();
        aborted = true;
        requestTask.abort();
    };
}

/**
 * 检测当前平台
 */
function isH5(): boolean {
    // #ifdef H5
    return true;
    // #endif
    // #ifndef H5
    return false;
    // #endif
}

/**
 * 创建 SSE 客户端
 */
export function createSSEClient(endpoint: string, options: SSEClientOptions): () => void {
    const baseUrl = getBaseUrl();
    const token = getToken();
    const url = `${baseUrl}${endpoint}?token=${encodeURIComponent(token)}`;

    if (isH5()) {
        return createH5SSEClient(url, options);
    } else {
        return createMPSSEClient(url, options);
    }
}

/**
 * 连接解析 SSE 流
 */
export function connectAnalysisStream(dreamId: string, options: SSEClientOptions): () => void {
    return createSSEClient(`/analysis/stream/${dreamId}`, {
        timeout: 120000,
        ...options
    });
}
