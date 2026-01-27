import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VersionService } from './version.service';
import { SwitchVersionDto } from './dto/switch-version.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('梦境版本')
@Controller('version')
@ApiBearerAuth()
export class VersionController {
    constructor(private readonly versionService: VersionService) {}

    @Get('dream/:dreamId')
    @ApiOperation({ summary: '获取梦境的所有版本列表' })
    async getVersions(@CurrentUser() user: JwtPayload, @Param('dreamId') dreamId: string) {
        return this.versionService.getVersions(dreamId, user.userId);
    }

    @Post('dream/:dreamId/switch')
    @ApiOperation({ summary: '切换到指定版本' })
    async switchVersion(
        @CurrentUser() user: JwtPayload,
        @Param('dreamId') dreamId: string,
        @Body() dto: SwitchVersionDto
    ) {
        return this.versionService.switchVersion(dreamId, user.userId, dto);
    }

    @Get(':versionId')
    @ApiOperation({ summary: '获取版本详情' })
    async getVersionDetail(@CurrentUser() user: JwtPayload, @Param('versionId') versionId: string) {
        return this.versionService.getVersionDetail(versionId, user.userId);
    }
}
