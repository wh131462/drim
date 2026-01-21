import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { PointsQueryDto } from './dto/points-query.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('积分')
@Controller('points')
@ApiBearerAuth()
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('records')
  @ApiOperation({ summary: '获取积分记录' })
  async getRecords(
    @CurrentUser() user: JwtPayload,
    @Query() query: PointsQueryDto,
  ) {
    return this.pointsService.getRecords(user.userId, query);
  }
}
