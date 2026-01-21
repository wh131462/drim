import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('用户')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login/wechat')
  @Public()
  @ApiOperation({ summary: '微信登录' })
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto.code);
  }

  @Get('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息' })
  async getUserInfo(@CurrentUser() user: JwtPayload) {
    return this.userService.getUserInfo(user.userId);
  }

  @Put('info')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户信息' })
  async updateUserInfo(
    @CurrentUser() user: JwtPayload,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.userService.updateUserInfo(user.userId, updateDto);
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户统计' })
  async getUserStats(@CurrentUser() user: JwtPayload) {
    return this.userService.getUserStats(user.userId);
  }
}
