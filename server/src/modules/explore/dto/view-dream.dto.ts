import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ViewDreamDto {
    @IsOptional()
    @IsString()
    source?: string; // random/filter/search

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    viewDuration?: number; // 浏览时长(秒)
}
