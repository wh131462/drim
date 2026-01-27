import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/shared/cache/redis.service';
import { AchievementDto, UserAchievementProgressDto } from './dto/achievement.dto';

// 成就条件类型
export enum AchievementConditionType {
    DREAM_COUNT = 'dream_count', // 记梦总数
    CONSECUTIVE_DAYS = 'consecutive_days', // 连续记梦天数
    TASK_COUNT = 'task_count', // 完成任务数
    ANALYSIS_COUNT = 'analysis_count', // 解析总数
    POLISH_COUNT = 'polish_count', // 润色次数
    SHARE_COUNT = 'share_count', // 分享次数
    EXPLORE_VIEW_COUNT = 'explore_view_count', // 探索浏览次数
    LUCKY_POINTS = 'lucky_points' // 幸运值达到
}

// 等级配置
const LEVEL_CONFIG = [
    { level: 1, title: '梦境新手', exp: 0 },
    { level: 2, title: '寻梦者', exp: 100 },
    { level: 3, title: '追梦人', exp: 300 },
    { level: 4, title: '梦想家', exp: 600 },
    { level: 5, title: '梦境导师', exp: 1000 },
    { level: 6, title: '梦境大师', exp: 1500 },
    { level: 7, title: '梦境宗师', exp: 2100 },
    { level: 8, title: '梦境传说', exp: 2800 },
    { level: 9, title: '梦境神话', exp: 3600 },
    { level: 10, title: '造梦者', exp: 5000 }
];

@Injectable()
export class AchievementService {
    private readonly logger = new Logger(AchievementService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService
    ) {}

    /**
     * 获取所有成就及用户解锁状态
     */
    async getAchievementsWithProgress(userId: string): Promise<UserAchievementProgressDto> {
        // 1. 获取所有成就定义
        const achievements = await this.prisma.achievement.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });

        // 2. 获取用户已解锁的成就
        const userAchievements = await this.prisma.userAchievement.findMany({
            where: { userId },
            include: { achievement: true }
        });

        // 3. 获取用户统计数据
        const userStats = await this.getUserStats(userId);

        // 4. 构建成就列表，包含解锁状态和进度
        const achievementDtos: AchievementDto[] = achievements.map((achievement) => {
            const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id);

            const progress = this.calculateProgress(achievement.conditionType, achievement.conditionValue, userStats);

            return {
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                conditionType: achievement.conditionType,
                conditionValue: achievement.conditionValue,
                rewardPoints: achievement.rewardPoints,
                unlocked: !!userAchievement,
                unlockedAt: userAchievement?.unlockedAt.toISOString(),
                progress,
                progressPercent: Math.min(Math.round((progress / achievement.conditionValue) * 100), 100)
            };
        });

        // 5. 计算用户等级
        const totalExp = userAchievements.reduce((sum, ua) => sum + ua.achievement.rewardPoints, 0);
        const levelInfo = this.calculateLevel(totalExp);

        return {
            level: levelInfo.level,
            levelTitle: levelInfo.title,
            currentExp: totalExp,
            nextLevelExp: levelInfo.nextLevelExp,
            unlockedCount: userAchievements.length,
            totalCount: achievements.length,
            achievements: achievementDtos
        };
    }

    /**
     * 获取用户已解锁的成就
     */
    async getUserAchievements(userId: string): Promise<AchievementDto[]> {
        const userAchievements = await this.prisma.userAchievement.findMany({
            where: { userId },
            include: { achievement: true },
            orderBy: { unlockedAt: 'desc' }
        });

        return userAchievements.map((ua) => ({
            id: ua.achievement.id,
            name: ua.achievement.name,
            description: ua.achievement.description,
            icon: ua.achievement.icon,
            conditionType: ua.achievement.conditionType,
            conditionValue: ua.achievement.conditionValue,
            rewardPoints: ua.achievement.rewardPoints,
            unlocked: true,
            unlockedAt: ua.unlockedAt.toISOString()
        }));
    }

    /**
     * 检查并解锁成就
     */
    async checkAndUnlockAchievements(
        userId: string,
        conditionTypes?: AchievementConditionType[]
    ): Promise<AchievementDto[]> {
        // 获取用户统计数据
        const userStats = await this.getUserStats(userId);

        // 获取所有激活的成就
        let achievements = await this.prisma.achievement.findMany({
            where: { isActive: true }
        });

        // 如果指定了条件类型，则只检查相关成就
        if (conditionTypes && conditionTypes.length > 0) {
            achievements = achievements.filter((a) =>
                conditionTypes.includes(a.conditionType as AchievementConditionType)
            );
        }

        // 获取用户已解锁的成就ID
        const unlockedAchievementIds = await this.prisma.userAchievement
            .findMany({
                where: { userId },
                select: { achievementId: true }
            })
            .then((records) => records.map((r) => r.achievementId));

        // 检查未解锁的成就
        const newlyUnlocked: AchievementDto[] = [];
        for (const achievement of achievements) {
            // 跳过已解锁的成就
            if (unlockedAchievementIds.includes(achievement.id)) {
                continue;
            }

            // 检查是否满足解锁条件
            const progress = this.calculateProgress(achievement.conditionType, achievement.conditionValue, userStats);

            if (progress >= achievement.conditionValue) {
                // 解锁成就
                try {
                    const userAchievement = await this.prisma.userAchievement.create({
                        data: {
                            userId,
                            achievementId: achievement.id
                        }
                    });

                    // 发放积分奖励
                    if (achievement.rewardPoints > 0) {
                        await this.rewardPoints(
                            userId,
                            achievement.rewardPoints,
                            achievement.id,
                            `解锁成就：${achievement.name}`
                        );
                    }

                    newlyUnlocked.push({
                        id: achievement.id,
                        name: achievement.name,
                        description: achievement.description,
                        icon: achievement.icon,
                        conditionType: achievement.conditionType,
                        conditionValue: achievement.conditionValue,
                        rewardPoints: achievement.rewardPoints,
                        unlocked: true,
                        unlockedAt: userAchievement.unlockedAt.toISOString()
                    });

                    this.logger.log(`用户 ${userId} 解锁成就: ${achievement.name} (${achievement.id})`);
                } catch (error) {
                    // 忽略重复解锁错误
                    if (!error.code?.includes('P2002')) {
                        this.logger.error(`解锁成就失败: ${achievement.id}`, error.stack);
                    }
                }
            }
        }

        return newlyUnlocked;
    }

    /**
     * 获取用户统计数据
     */
    private async getUserStats(userId: string): Promise<Record<string, number>> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return {};
        }

        // 获取完成的任务数
        const completedTaskCount = await this.prisma.task.count({
            where: { userId, status: 'completed' }
        });

        // 获取解析总数
        const analysisCount = await this.prisma.analysis.count({
            where: { userId, status: 'completed' }
        });

        // 获取润色次数
        const polishCount = await this.prisma.dreamVersion.count({
            where: { userId, type: 'polished' }
        });

        // 获取探索浏览次数
        const exploreViewCount = await this.prisma.exploreView.count({
            where: { viewerId: userId }
        });

        return {
            [AchievementConditionType.DREAM_COUNT]: user.totalDreams,
            [AchievementConditionType.CONSECUTIVE_DAYS]: user.consecutiveDays,
            [AchievementConditionType.TASK_COUNT]: completedTaskCount,
            [AchievementConditionType.ANALYSIS_COUNT]: analysisCount,
            [AchievementConditionType.POLISH_COUNT]: polishCount,
            [AchievementConditionType.SHARE_COUNT]: 0, // TODO: 实现分享功能后更新
            [AchievementConditionType.EXPLORE_VIEW_COUNT]: exploreViewCount,
            [AchievementConditionType.LUCKY_POINTS]: user.luckyPoints
        };
    }

    /**
     * 计算成就进度
     */
    private calculateProgress(
        conditionType: string,
        conditionValue: number,
        userStats: Record<string, number>
    ): number {
        return userStats[conditionType] || 0;
    }

    /**
     * 计算用户等级
     */
    private calculateLevel(totalExp: number): {
        level: number;
        title: string;
        nextLevelExp: number;
    } {
        let currentLevel = LEVEL_CONFIG[0];

        for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
            if (totalExp >= LEVEL_CONFIG[i].exp) {
                currentLevel = LEVEL_CONFIG[i];
                break;
            }
        }

        const nextLevel =
            LEVEL_CONFIG.find((l) => l.level === currentLevel.level + 1) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];

        return {
            level: currentLevel.level,
            title: currentLevel.title,
            nextLevelExp: nextLevel.exp
        };
    }

    /**
     * 发放积分奖励
     */
    private async rewardPoints(
        userId: string,
        points: number,
        achievementId: string,
        description: string
    ): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return;

        const newBalance = user.luckyPoints + points;

        await this.prisma.$transaction([
            // 更新用户积分
            this.prisma.user.update({
                where: { id: userId },
                data: { luckyPoints: newBalance }
            }),
            // 记录积分变动
            this.prisma.pointRecord.create({
                data: {
                    userId,
                    type: 'earn',
                    amount: points,
                    balance: newBalance,
                    source: 'achievement',
                    sourceId: achievementId,
                    description
                }
            })
        ]);

        // 清除缓存
        await this.redisService.del(`user:info:${userId}`);
    }
}
