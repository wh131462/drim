import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, UpdateSubscriptionDto } from './dto/update-settings.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('设置')
@Controller('settings')
@ApiBearerAuth()
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get()
    @ApiOperation({ summary: '获取用户设置' })
    async getSettings(@CurrentUser() user: JwtPayload) {
        return this.settingsService.getSettings(user.userId);
    }

    @Put()
    @ApiOperation({ summary: '更新用户设置' })
    async updateSettings(@CurrentUser() user: JwtPayload, @Body() dto: UpdateSettingsDto) {
        return this.settingsService.updateSettings(user.userId, dto);
    }

    @Put('subscription')
    @ApiOperation({ summary: '更新订阅消息授权状态' })
    async updateSubscription(@CurrentUser() user: JwtPayload, @Body() dto: UpdateSubscriptionDto) {
        await this.settingsService.updateSubscriptionStatus(user.userId, dto.accepted);
        return { success: true };
    }
}
