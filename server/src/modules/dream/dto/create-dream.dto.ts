import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    IsIn,
    IsBoolean,
    MaxLength,
    MinLength,
    ArrayMaxSize
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 允许的情绪类型
const VALID_EMOTIONS = [
    'happy', // 开心
    'sad', // 悲伤
    'angry', // 愤怒
    'fear', // 恐惧
    'surprise', // 惊讶
    'disgust', // 厌恶
    'calm', // 平静
    'anxious', // 焦虑
    'confused', // 困惑
    'excited', // 兴奋
    'lonely', // 孤独
    'shame', // 羞愧
    'love', // 温暖
    'bored' // 无聊
] as const;

export class CreateDreamDto {
    @ApiProperty({ description: '梦境内容', minLength: 25, maxLength: 1000 })
    @IsString()
    @IsNotEmpty({ message: '梦境内容不能为空' })
    @MinLength(25, { message: '梦境内容至少需要25字' })
    @MaxLength(1000, { message: '梦境内容不能超过1000字' })
    content: string;

    @ApiPropertyOptional({
        description: '标签',
        type: [String],
        example: ['flying', 'nature']
    })
    @IsArray()
    @IsOptional()
    @ArrayMaxSize(3, { message: '最多选择3个标签' })
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({
        description: '情绪',
        enum: VALID_EMOTIONS
    })
    @IsString()
    @IsOptional()
    @IsIn(VALID_EMOTIONS, { message: '无效的情绪类型' })
    emotion?: string;

    @ApiPropertyOptional({
        description: '是否公开到探索广场',
        default: false
    })
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
