import { Controller, Get, Post, Body, Param, Sse, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { AnalysisService } from './analysis.service';
import { AnalysisSSEService, MessageEvent } from './analysis-sse.service';
import { RequestAnalysisDto } from './dto/request-analysis.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('解析')
@Controller('analysis')
@ApiBearerAuth()
export class AnalysisController {
    constructor(
        private readonly analysisService: AnalysisService,
        private readonly sseService: AnalysisSSEService
    ) {}

    @Post('request')
    @ApiOperation({ summary: '请求解析' })
    async requestAnalysis(@CurrentUser() user: JwtPayload, @Body() dto: RequestAnalysisDto) {
        return this.analysisService.requestAnalysis(user.userId, dto);
    }

    /**
     * 请求解析 (SSE 模式)
     */
    @Post('request-stream')
    @ApiOperation({ summary: '请求解析 (SSE 模式)' })
    async requestAnalysisStream(@CurrentUser() user: JwtPayload, @Body() dto: RequestAnalysisDto) {
        return this.analysisService.requestAnalysisWithSSE(user.userId, dto);
    }

    /**
     * SSE 流式获取解析结果
     * 客户端通过 query 参数传递 token 进行认证
     */
    @Sse('stream/:dreamId')
    @ApiOperation({ summary: 'SSE 流式获取解析结果' })
    @ApiQuery({ name: 'token', required: true, description: 'JWT Token' })
    streamAnalysis(@Param('dreamId') dreamId: string, @Req() request: Request): Observable<MessageEvent> {
        // 用户已通过 AuthGuard 验证
        return this.sseService.subscribe(dreamId);
    }

    @Get(':id')
    @ApiOperation({ summary: '获取解析结果' })
    async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        return this.analysisService.getById(user.userId, id);
    }

    @Post('retry')
    @ApiOperation({ summary: '重新解析（消耗积分）' })
    async retry(@CurrentUser() user: JwtPayload, @Body() dto: { dreamId: string }) {
        return this.analysisService.retry(user.userId, dto.dreamId);
    }
}
