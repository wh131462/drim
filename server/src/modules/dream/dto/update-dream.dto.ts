import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDreamDto {
    @ApiProperty({ description: '梦境内容', minLength: 50, maxLength: 500 })
    @IsString()
    @MinLength(50, { message: '梦境内容至少需要50字' })
    @MaxLength(1000, { message: '梦境内容不能超过1000字' })
    content: string;

    @ApiProperty({
        description: '是否需要重新解析',
        required: false,
        default: false
    })
    @IsOptional()
    reAnalyze?: boolean;
}
