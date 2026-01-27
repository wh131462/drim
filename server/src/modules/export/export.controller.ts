import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExportService, ExportPreview } from './export.service';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('数据导出')
@Controller('export')
@ApiBearerAuth()
export class ExportController {
    constructor(private readonly exportService: ExportService) {}

    @Get('dreams')
    @ApiOperation({ summary: '导出用户梦境数据（JSON文件）' })
    async exportDreams(@CurrentUser() user: JwtPayload, @Res() res: Response) {
        const data = await this.exportService.exportUserData(user.userId);

        const filename = `dreams_${user.userId}_${Date.now()}.json`;

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(data, null, 2));
    }

    @Get('dreams/preview')
    @ApiOperation({ summary: '预览导出数据' })
    async previewExport(@CurrentUser() user: JwtPayload): Promise<ExportPreview> {
        return this.exportService.previewExportData(user.userId);
    }
}
