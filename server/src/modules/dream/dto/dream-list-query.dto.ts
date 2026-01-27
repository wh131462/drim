import { IsOptional, IsInt, Min, Max, IsDateString, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// 允许的情绪类型
const VALID_EMOTIONS = [
    'happy',
    'sad',
    'angry',
    'fear',
    'surprise',
    'disgust',
    'calm',
    'anxious',
    'confused',
    'excited',
    'lonely',
    'shame',
    'love',
    'bored'
] as const;

export class DreamListQueryDto {
    @ApiPropertyOptional({ description: '页码', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: '每页数量', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 20;

    @ApiPropertyOptional({ description: '开始日期' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: '结束日期' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: '标签筛选' })
    @IsOptional()
    @IsString()
    tag?: string;

    @ApiPropertyOptional({ description: '情绪筛选', enum: VALID_EMOTIONS })
    @IsOptional()
    @IsString()
    @IsIn(VALID_EMOTIONS, { message: '无效的情绪类型' })
    emotion?: string;

    @ApiPropertyOptional({ description: '关键词搜索' })
    @IsOptional()
    @IsString()
    keyword?: string;
}
