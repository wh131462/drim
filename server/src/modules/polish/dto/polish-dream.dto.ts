import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PolishDreamDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    prompt?: string; // 自定义润色提示

    @IsOptional()
    @IsString()
    basedOnVersionId?: string; // 基于哪个版本进行润色
}
