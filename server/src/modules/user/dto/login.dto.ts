import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '微信登录code' })
  @IsString()
  @IsNotEmpty({ message: 'code不能为空' })
  code: string;
}
