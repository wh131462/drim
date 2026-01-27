import { Controller, Get, Post, Put, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync } from 'fs';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

// 确保上传目录存在
const uploadDir = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
}

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

    @Post('login/test')
    @Public()
    @ApiOperation({ summary: '测试登录（仅开发环境）' })
    async testLogin(@Body() body: { openId: string }) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('生产环境不可用');
        }
        return this.userService.loginByOpenId(body.openId);
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
    async updateUserInfo(@CurrentUser() user: JwtPayload, @Body() updateDto: UpdateUserDto) {
        return this.userService.updateUserInfo(user.userId, updateDto);
    }

    @Get('stats')
    @ApiBearerAuth()
    @ApiOperation({ summary: '获取用户统计' })
    async getUserStats(@CurrentUser() user: JwtPayload) {
        return this.userService.getUserStats(user.userId);
    }

    @Post('avatar')
    @ApiBearerAuth()
    @ApiOperation({ summary: '上传头像' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: '头像文件'
                }
            }
        }
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: uploadDir,
                filename: (req, file, callback) => {
                    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                    callback(null, uniqueName);
                }
            }),
            fileFilter: (req, file, callback) => {
                // 只允许图片文件
                if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                    return callback(new BadRequestException('只支持 JPG、PNG、GIF、WEBP 格式的图片'), false);
                }
                callback(null, true);
            },
            limits: {
                fileSize: 2 * 1024 * 1024 // 最大 2MB
            }
        })
    )
    async uploadAvatar(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('请上传头像文件');
        }

        // 生成访问 URL（根据实际部署配置调整）
        const baseUrl = process.env.BASE_URL || 'http://localhost:3333';
        const avatarUrl = `${baseUrl}/uploads/avatars/${file.filename}`;

        // 自动更新用户头像
        await this.userService.updateUserInfo(user.userId, { avatar: avatarUrl });

        return { url: avatarUrl };
    }
}
