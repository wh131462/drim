import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VipService } from './vip.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('会员')
@Controller('vip')
@ApiBearerAuth()
export class VipController {
  constructor(private readonly vipService: VipService) {}

  @Get('info')
  @ApiOperation({ summary: '获取会员信息' })
  async getInfo(@CurrentUser() user: JwtPayload) {
    return this.vipService.getVipInfo(user.userId);
  }

  @Post('order')
  @ApiOperation({ summary: '创建会员订单' })
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.vipService.createOrder(user.userId, dto.planId);
  }

  @Get('order/:id')
  @ApiOperation({ summary: '查询订单状态' })
  async getOrder(@CurrentUser() user: JwtPayload, @Param('id') orderId: string) {
    return this.vipService.getOrderStatus(user.userId, orderId);
  }
}
