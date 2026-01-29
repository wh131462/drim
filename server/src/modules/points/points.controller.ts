import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { PointsQueryDto } from './dto/points-query.dto';
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

    @Get('ad-quota')
    @ApiOperation({ summary: '获取广告配额信息' })
    async getAdQuota(@CurrentUser() user: JwtPayload) {
        return this.pointsService.getAdQuota(user.userId);
    }

    @Post('ad-reward')
    @ApiOperation({ summary: '领取广告奖励' })
    async claimAdReward(
        @CurrentUser() user: JwtPayload,
        @Body() body: { type?: 'task_double' | 'points_gain'; scene?: string }
    ) {
        return this.pointsService.claimAdReward(user.userId, body.type, body.scene);
    }
}
