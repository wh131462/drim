import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ExploreService } from './explore.service';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { GetPublicDreamsDto, ViewDreamDto, GetUserPublicDreamsDto } from './dto';

@Controller('explore')
export class ExploreController {
    constructor(private readonly exploreService: ExploreService) {}

    /**
     * 获取所有可用标签
     */
    @Get('tags')
    async getTags() {
        return this.exploreService.getTags();
    }

    /**
     * 获取公开梦境列表
     */
    @Get('dreams')
    async getPublicDreams(@CurrentUser('userId') userId: string, @Query() query: GetPublicDreamsDto) {
        return this.exploreService.getPublicDreams(userId, query);
    }

    /**
     * 随机获取一个公开梦境
     */
    @Get('random')
    async getRandomDream(@CurrentUser('userId') userId: string) {
        return this.exploreService.getRandomDream(userId);
    }

    /**
     * 查看梦境详情（记录浏览）
     */
    @Get('dream/:dreamId')
    async viewDream(
        @CurrentUser('userId') userId: string,
        @Param('dreamId') dreamId: string,
        @Query() query: ViewDreamDto
    ) {
        return this.exploreService.viewDream(userId, dreamId, query);
    }

    /**
     * 点赞/取消点赞梦境
     */
    @Post('dream/:dreamId/like')
    async toggleLike(@CurrentUser('userId') userId: string, @Param('dreamId') dreamId: string) {
        return this.exploreService.toggleLike(userId, dreamId);
    }

    /**
     * 获取用户公开主页信息
     */
    @Get('user/:userId/profile')
    async getUserProfile(@CurrentUser('userId') currentUserId: string, @Param('userId') targetUserId: string) {
        return this.exploreService.getUserProfile(currentUserId, targetUserId);
    }

    /**
     * 获取用户公开梦境列表
     */
    @Get('user/:userId/dreams')
    async getUserPublicDreams(
        @CurrentUser('userId') currentUserId: string,
        @Param('userId') targetUserId: string,
        @Query() query: GetUserPublicDreamsDto
    ) {
        return this.exploreService.getUserPublicDreams(currentUserId, targetUserId, query);
    }
}
