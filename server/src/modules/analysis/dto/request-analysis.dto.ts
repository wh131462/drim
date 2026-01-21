import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestAnalysisDto {
  @ApiProperty({ description: '梦境ID' })
  @IsString()
  @IsNotEmpty({ message: '梦境ID不能为空' })
  dreamId: string;

  @ApiPropertyOptional({ description: '广告观看凭证' })
  @IsString()
  @IsOptional()
  adToken?: string;
}
