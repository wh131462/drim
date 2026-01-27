import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementService } from './achievement.service';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';
import { AchievementDto, UserAchievementProgressDto } from './dto/achievement.dto';

@ApiTags('成就')
@Controller('achievement')
@ApiBearerAuth()
export class AchievementController {
    constructor(private readonly achievementService: AchievementService) {}

    @Get('list')
    @ApiOperation({ summary: '获取成就列表及进度' })
    async getAchievements(@CurrentUser() user: JwtPayload): Promise<UserAchievementProgressDto> {
        return this.achievementService.getAchievementsWithProgress(user.userId);
    }

    @Get('user')
    @ApiOperation({ summary: '获取用户已解锁的成就' })
    async getUserAchievements(@CurrentUser() user: JwtPayload): Promise<AchievementDto[]> {
        return this.achievementService.getUserAchievements(user.userId);
    }
}
