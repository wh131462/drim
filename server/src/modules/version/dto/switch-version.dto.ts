import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwitchVersionDto {
    @ApiProperty({ description: '版本ID' })
    @IsString()
    @IsNotEmpty()
    versionId: string;
}
