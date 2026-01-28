import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteTaskDto {
    @ApiPropertyOptional({ description: '是否观看广告获取双倍奖励' })
    @IsBoolean()
    @IsOptional()
    watchedAd?: boolean;

    @ApiPropertyOptional({ description: '广告凭证' })
    @IsString()
    @IsOptional()
    adToken?: string;
}
