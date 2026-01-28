import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { PointsQueryDto } from './dto/points-query.dto';
import { ClaimAdRewardDto, AdRewardResponseDto, AdStatusResponseDto } from './dto/ad-reward.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('积分')
@Controller('points')
@ApiBearerAuth()
export class PointsController {
    constructor(private readonly pointsService: PointsService) {}

    @Get()
    @ApiOperation({ summary: '获取积分信息' })
    async getInfo(@CurrentUser() user: JwtPayload) {
        return this.pointsService.getInfo(user.userId);
    }

    @Get('records')
    @ApiOperation({ summary: '获取积分记录' })
    async getRecords(@CurrentUser() user: JwtPayload, @Query() query: PointsQueryDto) {
        return this.pointsService.getRecords(user.userId, query);
    }

    @Get('ad-status')
    @ApiOperation({ summary: '获取广告观看状态' })
    @ApiResponse({ type: AdStatusResponseDto })
    async getAdStatus(@CurrentUser() user: JwtPayload) {
        return this.pointsService.getAdStatus(user.userId);
    }

    @Post('ad-reward')
    @ApiOperation({ summary: '领取广告奖励' })
    @ApiResponse({ type: AdRewardResponseDto })
    async claimAdReward(@CurrentUser() user: JwtPayload, @Body() dto: ClaimAdRewardDto) {
        return this.pointsService.claimAdReward(user.userId, dto.type);
    }
}
