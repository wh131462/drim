import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { RequestAnalysisDto } from './dto/request-analysis.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('解析')
@Controller('analysis')
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('request')
  @ApiOperation({ summary: '请求解析' })
  async requestAnalysis(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestAnalysisDto,
  ) {
    return this.analysisService.requestAnalysis(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取解析结果' })
  async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.analysisService.getById(user.userId, id);
  }

  @Post('retry')
  @ApiOperation({ summary: '重新解析（消耗积分）' })
  async retry(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { dreamId: string },
  ) {
    return this.analysisService.retry(user.userId, dto.dreamId);
  }
}
