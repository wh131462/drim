import { IsBoolean, ValidateIf } from 'class-validator';
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateDreamDto } from './create-dream.dto';

export class UpdateDreamDto extends OmitType(CreateDreamDto, ['originalContent'] as const) {
    @ApiPropertyOptional({
        description: '是否需要重新解析',
        required: false,
        default: false
    })
    @IsBoolean()
    @ValidateIf((_object, value) => value !== undefined)
    reAnalyze?: boolean;
}
