import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: '套餐ID', example: 'monthly' })
  @IsString()
  @IsNotEmpty({ message: '套餐ID不能为空' })
  planId: string;
}
