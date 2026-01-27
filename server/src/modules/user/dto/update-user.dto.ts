import { IsString, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiPropertyOptional({ description: '昵称' })
    @IsString()
    @IsOptional()
    @MaxLength(64)
    nickname?: string;

    @ApiPropertyOptional({ description: '头像URL' })
    @IsString()
    @IsOptional()
    @MaxLength(512)
    avatar?: string;

    @ApiPropertyOptional({ description: '性别 0-未知 1-男 2-女' })
    @IsInt()
    @IsOptional()
    @Min(0)
    @Max(2)
    gender?: number;
}
