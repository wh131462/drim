import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CalendarQueryDto {
    @ApiProperty({ description: '年份', example: 2026 })
    @Type(() => Number)
    @IsInt()
    @Min(2020)
    @Max(2100)
    year: number;

    @ApiProperty({ description: '月份', example: 1, minimum: 1, maximum: 12 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month: number;
}
