import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
    @ApiPropertyOptional({ description: '是否开启消息通知' })
    @IsBoolean()
    @IsOptional()
    notificationEnabled?: boolean;

    @ApiPropertyOptional({ description: '提醒时间 HH:mm 格式' })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '时间格式必须为 HH:mm' })
    reminderTime?: string;

    @ApiPropertyOptional({ description: '梦境默认公开' })
    @IsBoolean()
    @IsOptional()
    defaultDreamPublic?: boolean;

    @ApiPropertyOptional({ description: '允许他人查看主页' })
    @IsBoolean()
    @IsOptional()
    allowProfileView?: boolean;
}

export class UpdateSubscriptionDto {
    @ApiPropertyOptional({ description: '是否已授权订阅消息' })
    @IsBoolean()
    accepted: boolean;
}
