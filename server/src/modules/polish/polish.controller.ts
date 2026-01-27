import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { PolishService } from './polish.service';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { PolishDreamDto } from './dto';

@Controller('polish')
export class PolishController {
    constructor(private readonly polishService: PolishService) {}

    /**
     * 纯文本润色(不需要梦境ID)
     */
    @Post('text')
    async polishText(@CurrentUser('userId') userId: string, @Body() dto: { content: string; prompt?: string }) {
        return this.polishService.polishText(userId, dto.content, dto.prompt);
    }

    /**
     * 润色梦境
     */
    @Post('dream/:dreamId')
    async polishDream(
        @CurrentUser('userId') userId: string,
        @Param('dreamId') dreamId: string,
        @Body() dto: PolishDreamDto
    ) {
        return this.polishService.polishDream(userId, dreamId, dto);
    }

    /**
     * 获取润色配额
     */
    @Get('quota')
    async getQuota(@CurrentUser('userId') userId: string) {
        return this.polishService.getQuota(userId);
    }

    /**
     * 切换梦境当前版本
     */
    @Post('dream/:dreamId/switch-version/:versionId')
    async switchVersion(
        @CurrentUser('userId') userId: string,
        @Param('dreamId') dreamId: string,
        @Param('versionId') versionId: string
    ) {
        return this.polishService.switchVersion(userId, dreamId, versionId);
    }

    /**
     * 获取梦境版本历史
     */
    @Get('dream/:dreamId/versions')
    async getVersions(@CurrentUser('userId') userId: string, @Param('dreamId') dreamId: string) {
        return this.polishService.getVersions(userId, dreamId);
    }
}
