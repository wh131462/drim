import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 检查是否是公开接口
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('未提供认证令牌');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token);
            // 将用户信息附加到请求对象
            request['user'] = payload;
        } catch {
            throw new UnauthorizedException('认证令牌无效或已过期');
        }

        return true;
    }

    private extractToken(request: Request): string | undefined {
        // 优先从 Header 获取
        const authHeader = request.headers.authorization;
        if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type === 'Bearer' && token) {
                return token;
            }
        }

        // 其次从 query 参数获取（用于文件下载等场景）
        const queryToken = request.query.token as string | undefined;
        if (queryToken) {
            return queryToken;
        }

        return undefined;
    }
}
