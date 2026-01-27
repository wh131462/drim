import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrivilegeService } from './privilege.service';
import { ExchangePrivilegeDto, ExchangeRecordsQueryDto } from './dto/exchange.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('权益')
@Controller('privilege')
@ApiBearerAuth()
export class PrivilegeController {
    constructor(private readonly privilegeService: PrivilegeService) {}

    @Get('info')
    @ApiOperation({ summary: '获取权益信息' })
    async getInfo(@CurrentUser() user: JwtPayload) {
        return this.privilegeService.getInfo(user.userId);
    }

    @Post('exchange')
    @ApiOperation({ summary: '积分兑换权益' })
    async exchange(@CurrentUser() user: JwtPayload, @Body() dto: ExchangePrivilegeDto) {
        return this.privilegeService.exchange(user.userId, dto.itemId);
    }

    @Get('records')
    @ApiOperation({ summary: '获取兑换记录' })
    async getRecords(@CurrentUser() user: JwtPayload, @Query() query: ExchangeRecordsQueryDto) {
        return this.privilegeService.getRecords(user.userId, query);
    }
}
