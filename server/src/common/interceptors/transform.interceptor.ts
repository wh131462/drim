import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
    timestamp: number;
    requestId: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T> | T> {
        const request = context.switchToHttp().getRequest<Request>();
        const requestId = (request.headers['x-request-id'] as string) || uuidv4();

        // SSE 请求不做响应转换 (Accept: text/event-stream)
        const acceptHeader = request.headers.accept || '';
        if (acceptHeader.includes('text/event-stream')) {
            return next.handle();
        }

        return next.handle().pipe(
            map((data) => ({
                code: 0,
                message: 'success',
                data,
                timestamp: Date.now(),
                requestId
            }))
        );
    }
}
