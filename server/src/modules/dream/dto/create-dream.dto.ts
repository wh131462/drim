import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsIn,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDreamDto {
  @ApiProperty({ description: '梦境内容', minLength: 50, maxLength: 500 })
  @IsString()
  @IsNotEmpty({ message: '梦境内容不能为空' })
  @MinLength(50, { message: '梦境内容至少需要50字' })
  @MaxLength(500, { message: '梦境内容不能超过500字' })
  content: string;

  @ApiPropertyOptional({
    description: '标签',
    type: [String],
    example: ['flying', 'nature'],
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(3, { message: '最多选择3个标签' })
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: '情绪',
    enum: ['happy', 'fear', 'confused', 'sad'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['happy', 'fear', 'confused', 'sad'], { message: '无效的情绪类型' })
  emotion?: string;
}
