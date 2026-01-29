import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PointsQueryDto } from './dto/points-query.dto';

/** 每日广告观看上限 */
const DAILY_AD_LIMIT = 5;

/** 广告奖励积分（统一10积分） */
const AD_REWARD_POINTS = 10;

/** 广告类型 */
type AdRewardType = 'task_double' | 'points_gain';

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
     * 获取广告配额信息
     */
    async getAdQuota(userId: string) {
        const todayAdCount = await this.getTodayAdCount(userId);
        const remaining = Math.max(0, DAILY_AD_LIMIT - todayAdCount);

        return {
            total: DAILY_AD_LIMIT,
            used: todayAdCount,
            remaining
        };
    }

    /**
     * 领取广告奖励
     * @param userId 用户ID
     * @param type 广告类型: task_double(任务翻倍) | points_gain(主动看广告)，默认 points_gain
     * @param scene 观看场景，用于数据分析
     */
    async claimAdReward(userId: string, type?: AdRewardType, scene?: string) {
        // 检查每日广告观看次数
        const todayAdCount = await this.getTodayAdCount(userId);

        if (todayAdCount >= DAILY_AD_LIMIT) {
            throw new BadRequestException('今日观看次数已用完');
        }

        // 统一奖励 10 幸运值
        const points = AD_REWARD_POINTS;

        // 获取当前用户积分
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { luckyPoints: true }
        });

        if (!user) {
            throw new BadRequestException('用户不存在');
        }

        const newBalance = user.luckyPoints + points;

        // 确定来源和描述
        const isTaskDouble = type === 'task_double';
        const source = isTaskDouble ? 'task_double' : 'ad_reward';
        let description = isTaskDouble ? '任务翻倍奖励' : '观看广告奖励';
        if (scene) {
            description += ` (${scene})`;
        }

        // 使用事务更新积分
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
                    source,
                    description
                }
            })
        ]);

        return {
            success: true,
            points,
            remaining: DAILY_AD_LIMIT - todayAdCount - 1,
            total: DAILY_AD_LIMIT
        };
    }
}
