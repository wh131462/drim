import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExchangePrivilegeDto {
    @ApiProperty({ description: '兑换项目ID', example: 'ad_free_7day' })
    @IsString()
    itemId: string;
}

export class ExchangeRecordsQueryDto {
    @ApiPropertyOptional({ description: '页码', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: '每页数量', default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    pageSize?: number;
}
