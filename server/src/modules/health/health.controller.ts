import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaHealthIndicator } from './prisma.health';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private prismaHealth: PrismaHealthIndicator,
        private memory: MemoryHealthIndicator
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    @ApiOperation({ summary: '健康检查', description: '检查服务、数据库和内存状态' })
    check() {
        return this.health.check([
            // 数据库连接检查
            () => this.prismaHealth.isHealthy('database'),
            // 内存检查：堆内存不超过 500MB
            () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024)
        ]);
    }

    @Get('liveness')
    @Public()
    @ApiOperation({ summary: '存活检查', description: '简单的存活探针' })
    liveness() {
        return { status: 'ok' };
    }

    @Get('readiness')
    @Public()
    @HealthCheck()
    @ApiOperation({ summary: '就绪检查', description: '检查服务是否准备好接收请求' })
    readiness() {
        return this.health.check([() => this.prismaHealth.isHealthy('database')]);
    }
}
