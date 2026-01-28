import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, filter, takeUntil, timeout, map } from 'rxjs';
import { catchError, of } from 'rxjs';

/**
 * SSE 事件类型定义
 */
export interface AnalysisSSEEvent {
    dreamId: string;
    type: 'start' | 'progress' | 'complete' | 'error';
    data?: any;
    message?: string;
    timestamp: number;
}

/**
 * NestJS SSE MessageEvent 格式
 */
export interface MessageEvent {
    data: string | object;
    id?: string;
    type?: string;
    retry?: number;
}

@Injectable()
export class AnalysisSSEService implements OnModuleDestroy {
    private eventSubject = new Subject<AnalysisSSEEvent>();
    private destroy$ = new Subject<void>();

    onModuleDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.eventSubject.complete();
    }

    /**
     * 发送事件
     */
    private emit(event: AnalysisSSEEvent): void {
        this.eventSubject.next(event);
    }

    /**
     * 订阅特定 dreamId 的事件流
     * @param dreamId 梦境 ID
     * @param timeoutMs 超时时间 (默认 120 秒)
     */
    subscribe(dreamId: string, timeoutMs = 120000): Observable<MessageEvent> {
        return this.eventSubject.pipe(
            filter((event) => event.dreamId === dreamId),
            takeUntil(this.destroy$),
            timeout(timeoutMs),
            map((event) => ({
                data: JSON.stringify({
                    type: event.type,
                    data: event.data,
                    message: event.message,
                    timestamp: event.timestamp
                }),
                id: `${dreamId}-${event.timestamp}`,
                type: event.type
            })),
            catchError((err) => {
                const isTimeout = err.name === 'TimeoutError';
                return of({
                    data: JSON.stringify({
                        type: 'error',
                        message: isTimeout ? '解析超时，请重试' : '连接异常',
                        timestamp: Date.now()
                    }),
                    type: 'error'
                });
            })
        );
    }

    /**
     * 发送开始事件
     */
    emitStart(dreamId: string): void {
        this.emit({
            dreamId,
            type: 'start',
            message: '开始解析梦境...',
            timestamp: Date.now()
        });
    }

    /**
     * 发送进度事件
     */
    emitProgress(dreamId: string, message: string): void {
        this.emit({
            dreamId,
            type: 'progress',
            message,
            timestamp: Date.now()
        });
    }

    /**
     * 发送完成事件
     */
    emitComplete(dreamId: string, data: any): void {
        this.emit({
            dreamId,
            type: 'complete',
            data,
            message: '解析完成',
            timestamp: Date.now()
        });
    }

    /**
     * 发送错误事件
     */
    emitError(dreamId: string, message: string): void {
        this.emit({
            dreamId,
            type: 'error',
            message,
            timestamp: Date.now()
        });
    }
}
