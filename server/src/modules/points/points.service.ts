import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PointsQueryDto } from './dto/points-query.dto';
import { AdRewardType } from './dto/ad-reward.dto';

/** 每日广告观看上限 */
const DAILY_AD_LIMIT = 5;

/** 广告奖励积分配置 */
const AD_REWARD_POINTS = {
    [AdRewardType.TASK_DOUBLE]: 10, // 任务双倍是额外 +10
    [AdRewardType.POINTS_GAIN]: 20 // 直接看广告 +20
};

@Injectable()
export class PointsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 获取积分信息
     */
    async getInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { luckyPoints: true }
        });

        // 获取总获取和总消耗
        const [earnResult, consumeResult] = await Promise.all([
            this.prisma.pointRecord.aggregate({
                where: { userId, type: 'earn' },
                _sum: { amount: true }
            }),
            this.prisma.pointRecord.aggregate({
                where: { userId, type: 'consume' },
                _sum: { amount: true }
            })
        ]);

        return {
            balance: user?.luckyPoints || 0,
            totalEarned: earnResult._sum.amount || 0,
            totalConsumed: consumeResult._sum.amount || 0
        };
    }

    /**
     * 获取积分记录
     */
    async getRecords(userId: string, query: PointsQueryDto) {
        const { page = 1, pageSize = 20, type } = query;
        const skip = (page - 1) * pageSize;

        // 获取当前积分
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { luckyPoints: true }
        });

        const where: any = { userId };
        if (type) {
            where.type = type;
        }

        const [records, total] = await Promise.all([
            this.prisma.pointRecord.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            }),
            this.prisma.pointRecord.count({ where })
        ]);

        return {
            currentPoints: user?.luckyPoints || 0,
            records: records.map((record) => ({
                id: record.id.toString(),
                type: record.type,
                amount: record.amount,
                source: record.source,
                description: record.description,
                createdAt: record.createdAt.toISOString()
            })),
            total,
            page,
            pageSize
        };
    }

    /**
     * 获取今日广告观看次数
     */
    private async getTodayAdCount(userId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.prisma.pointRecord.count({
            where: {
                userId,
                source: { in: ['task_double', 'ad_reward'] },
                createdAt: { gte: today }
            }
        });
    }

    /**
     * 获取广告观看状态
     */
    async getAdStatus(userId: string) {
        const todayAdCount = await this.getTodayAdCount(userId);
        const remainingCount = Math.max(0, DAILY_AD_LIMIT - todayAdCount);

        return {
            todayAdCount,
            dailyLimit: DAILY_AD_LIMIT,
            remainingCount,
            canWatch: remainingCount > 0
        };
    }

    /**
     * 领取广告奖励
     */
    async claimAdReward(userId: string, type: AdRewardType) {
        // 检查每日广告观看次数
        const todayAdCount = await this.getTodayAdCount(userId);

        if (todayAdCount >= DAILY_AD_LIMIT) {
            throw new BadRequestException('今日广告观看次数已达上限');
        }

        // 获取奖励积分
        const points = AD_REWARD_POINTS[type];

        // 获取当前用户积分
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { luckyPoints: true }
        });

        if (!user) {
            throw new BadRequestException('用户不存在');
        }

        const newBalance = user.luckyPoints + points;

        // 使用事务更新积分
        const [updatedUser] = await this.prisma.$transaction([
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
                    source: type === AdRewardType.TASK_DOUBLE ? 'task_double' : 'ad_reward',
                    description: type === AdRewardType.TASK_DOUBLE ? '任务双倍奖励' : '观看广告奖励'
                }
            })
        ]);

        return {
            success: true,
            points,
            totalPoints: updatedUser.luckyPoints,
            remainingAdCount: DAILY_AD_LIMIT - todayAdCount - 1
        };
    }
}
