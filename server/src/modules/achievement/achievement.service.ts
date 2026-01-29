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

// 成就定义接口
interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    conditionType: string;
    conditionValue: number;
    rewardPoints: number;
    sortOrder: number;
}

// 硬编码的成就列表
const ACHIEVEMENTS: AchievementDefinition[] = [
    // 记梦成就
    {
        id: 'dream_first',
        name: '初次记梦',
        description: '记录第一个梦境',
        icon: '🌙',
        conditionType: 'dream_count',
        conditionValue: 1,
        rewardPoints: 10,
        sortOrder: 1
    },
    {
        id: 'dream_beginner',
        name: '入门梦想家',
        description: '累计记录10个梦境',
        icon: '✨',
        conditionType: 'dream_count',
        conditionValue: 10,
        rewardPoints: 20,
        sortOrder: 2
    },
    {
        id: 'dream_intermediate',
        name: '资深梦想家',
        description: '累计记录50个梦境',
        icon: '🌟',
        conditionType: 'dream_count',
        conditionValue: 50,
        rewardPoints: 50,
        sortOrder: 3
    },
    {
        id: 'dream_advanced',
        name: '梦境大师',
        description: '累计记录100个梦境',
        icon: '👑',
        conditionType: 'dream_count',
        conditionValue: 100,
        rewardPoints: 100,
        sortOrder: 4
    },

    // 连续打卡成就
    {
        id: 'consecutive_3',
        name: '三日连续',
        description: '连续记梦3天',
        icon: '🔥',
        conditionType: 'consecutive_days',
        conditionValue: 3,
        rewardPoints: 15,
        sortOrder: 5
    },
    {
        id: 'consecutive_7',
        name: '周周有梦',
        description: '连续记梦7天',
        icon: '🔥🔥',
        conditionType: 'consecutive_days',
        conditionValue: 7,
        rewardPoints: 30,
        sortOrder: 6
    },
    {
        id: 'consecutive_30',
        name: '月度坚持',
        description: '连续记梦30天',
        icon: '🔥🔥🔥',
        conditionType: 'consecutive_days',
        conditionValue: 30,
        rewardPoints: 100,
        sortOrder: 7
    },
    {
        id: 'consecutive_100',
        name: '百日梦境',
        description: '连续记梦100天',
        icon: '💯',
        conditionType: 'consecutive_days',
        conditionValue: 100,
        rewardPoints: 300,
        sortOrder: 8
    },

    // 任务成就
    {
        id: 'task_first',
        name: '任务新手',
        description: '完成第一个改运任务',
        icon: '🎯',
        conditionType: 'task_count',
        conditionValue: 1,
        rewardPoints: 10,
        sortOrder: 9
    },
    {
        id: 'task_10',
        name: '任务达人',
        description: '累计完成10个改运任务',
        icon: '🏆',
        conditionType: 'task_count',
        conditionValue: 10,
        rewardPoints: 30,
        sortOrder: 10
    },
    {
        id: 'task_50',
        name: '改运专家',
        description: '累计完成50个改运任务',
        icon: '🎖️',
        conditionType: 'task_count',
        conditionValue: 50,
        rewardPoints: 100,
        sortOrder: 11
    },

    // 解析成就
    {
        id: 'analysis_10',
        name: '解梦初窥',
        description: '完成10次梦境解析',
        icon: '🔮',
        conditionType: 'analysis_count',
        conditionValue: 10,
        rewardPoints: 20,
        sortOrder: 12
    },
    {
        id: 'analysis_50',
        name: '解梦专家',
        description: '完成50次梦境解析',
        icon: '🌌',
        conditionType: 'analysis_count',
        conditionValue: 50,
        rewardPoints: 50,
        sortOrder: 13
    },

    // 润色成就
    {
        id: 'polish_first',
        name: '文采初现',
        description: '完成第一次梦境润色',
        icon: '✍️',
        conditionType: 'polish_count',
        conditionValue: 1,
        rewardPoints: 10,
        sortOrder: 14
    },
    {
        id: 'polish_10',
        name: '妙笔生花',
        description: '累计润色10次',
        icon: '🖋️',
        conditionType: 'polish_count',
        conditionValue: 10,
        rewardPoints: 30,
        sortOrder: 15
    },

    // 探索成就
    {
        id: 'explore_10',
        name: '好奇探索者',
        description: '浏览10个他人梦境',
        icon: '🔍',
        conditionType: 'explore_view_count',
        conditionValue: 10,
        rewardPoints: 20,
        sortOrder: 16
    },
    {
        id: 'explore_50',
        name: '梦境游历者',
        description: '浏览50个他人梦境',
        icon: '🗺️',
        conditionType: 'explore_view_count',
        conditionValue: 50,
        rewardPoints: 50,
        sortOrder: 17
    },

    // 积分成就
    {
        id: 'points_100',
        name: '幸运萌新',
        description: '累计获得100幸运值',
        icon: '🍀',
        conditionType: 'lucky_points',
        conditionValue: 100,
        rewardPoints: 20,
        sortOrder: 18
    },
    {
        id: 'points_500',
        name: '幸运之星',
        description: '累计获得500幸运值',
        icon: '⭐',
        conditionType: 'lucky_points',
        conditionValue: 500,
        rewardPoints: 50,
        sortOrder: 19
    },
    {
        id: 'points_1000',
        name: '幸运女神',
        description: '累计获得1000幸运值',
        icon: '💫',
        conditionType: 'lucky_points',
        conditionValue: 1000,
        rewardPoints: 100,
        sortOrder: 20
    }
];

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
     * 根据 ID 获取成就定义
     */
    private getAchievementById(id: string): AchievementDefinition | undefined {
        return ACHIEVEMENTS.find((a) => a.id === id);
    }

    /**
     * 获取所有成就定义
     */
    private getAllAchievements(): AchievementDefinition[] {
        return ACHIEVEMENTS;
    }

    /**
     * 获取所有成就及用户解锁状态
     */
    async getAchievementsWithProgress(userId: string): Promise<UserAchievementProgressDto> {
        // 1. 获取所有成就定义 (硬编码)
        const achievements = this.getAllAchievements();

        // 2. 获取用户已解锁的成就
        const userAchievements = await this.prisma.userAchievement.findMany({
            where: { userId }
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

        // 5. 计算用户等级 (基于已解锁成就的奖励积分)
        const totalExp = userAchievements.reduce((sum, ua) => {
            const achievement = this.getAchievementById(ua.achievementId);
            return sum + (achievement?.rewardPoints || 0);
        }, 0);
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
            orderBy: { unlockedAt: 'desc' }
        });

        return userAchievements
            .map((ua) => {
                const achievement = this.getAchievementById(ua.achievementId);
                if (!achievement) return null;

                return {
                    id: achievement.id,
                    name: achievement.name,
                    description: achievement.description,
                    icon: achievement.icon,
                    conditionType: achievement.conditionType,
                    conditionValue: achievement.conditionValue,
                    rewardPoints: achievement.rewardPoints,
                    unlocked: true,
                    unlockedAt: ua.unlockedAt.toISOString()
                };
            })
            .filter((a) => a !== null) as AchievementDto[];
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

        // 获取所有成就定义 (硬编码)
        let achievements = this.getAllAchievements();

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
                    // 确保成就记录存在于数据库中
                    await this.prisma.achievement.upsert({
                        where: { id: achievement.id },
                        update: {},
                        create: {
                            id: achievement.id,
                            name: achievement.name,
                            description: achievement.description,
                            icon: achievement.icon,
                            conditionType: achievement.conditionType,
                            conditionValue: achievement.conditionValue,
                            rewardPoints: achievement.rewardPoints,
                            sortOrder: achievement.sortOrder
                        }
                    });

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
