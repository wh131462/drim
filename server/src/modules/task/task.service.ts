import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Inject,
    forwardRef
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AchievementService, AchievementConditionType } from '../achievement/achievement.service';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { TaskHistoryQueryDto } from './dto/task-history-query.dto';

@Injectable()
export class TaskService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
        @Inject(forwardRef(() => AchievementService))
        private readonly achievementService: AchievementService
    ) {}

    /**
     * 从解析结果创建任务
     */
    async createFromAnalysis(userId: string, dreamId: string, taskData: { type: string; content: string }) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        return this.prisma.task.create({
            data: {
                userId,
                dreamId,
                type: taskData.type,
                content: taskData.content,
                rewardPoints: 10,
                expireAt: today
            }
        });
    }

    /**
     * 获取今日任务
     */
    async getTodayTask(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const task = await this.prisma.task.findFirst({
            where: {
                userId,
                createdAt: { gte: today },
                status: { not: 'expired' }
            },
            include: {
                dream: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!task) {
            return {
                task: null,
                completed: false,
                rewardClaimed: false
            };
        }

        return {
            task: {
                id: task.id,
                type: task.type,
                content: task.content,
                rewardPoints: task.rewardPoints,
                isDoubleReward: false,
                status: task.status,
                expireAt: task.expireAt.toISOString()
            },
            completed: task.status === 'completed',
            rewardClaimed: task.status === 'completed'
        };
    }

    /**
     * 完成任务
     */
    async completeTask(userId: string, taskId: string, dto: CompleteTaskDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        if (task.userId !== userId) {
            throw new ForbiddenException('无权操作该任务');
        }

        if (task.status === 'completed') {
            throw new BadRequestException('任务已完成');
        }

        if (task.status === 'expired') {
            throw new BadRequestException('任务已过期');
        }

        // 计算奖励
        const isDoubleReward = dto.watchedAd === true;
        const rewardPoints = isDoubleReward ? task.rewardPoints * 2 : task.rewardPoints;

        // 获取用户当前积分
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const newBalance = user.luckyPoints + rewardPoints;

        // 使用事务确保数据一致性
        await this.prisma.$transaction([
            // 更新任务状态
            this.prisma.task.update({
                where: { id: taskId },
                data: {
                    status: 'completed',
                    isDoubleReward,
                    completedAt: new Date()
                }
            }),
            // 更新用户积分和任务数
            this.prisma.user.update({
                where: { id: userId },
                data: {
                    luckyPoints: newBalance,
                    totalTasks: { increment: 1 }
                }
            }),
            // 记录积分获取
            this.prisma.pointRecord.create({
                data: {
                    userId,
                    type: 'earn',
                    amount: rewardPoints,
                    balance: newBalance,
                    source: 'task_complete',
                    sourceId: taskId,
                    description: `完成任务 +${rewardPoints}`
                }
            })
        ]);

        // 异步检查任务相关成就
        this.achievementService
            .checkAndUnlockAchievements(userId, [AchievementConditionType.TASK_COUNT])
            .catch((err) => console.error('检查任务成就失败:', err));

        return {
            success: true,
            points: rewardPoints,
            totalPoints: newBalance,
            isDoubleReward
        };
    }

    /**
     * 广告翻倍奖励（任务完成后通过看广告获得额外奖励）
     */
    async doubleReward(userId: string, taskId: string, adToken: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        if (task.userId !== userId) {
            throw new ForbiddenException('无权操作该任务');
        }

        if (task.status !== 'completed') {
            throw new BadRequestException('任务尚未完成');
        }

        if (task.isDoubleReward) {
            throw new BadRequestException('已获得翻倍奖励');
        }

        // TODO: 验证 adToken 的有效性（需要对接广告服务）
        // 目前仅检查 token 是否存在
        if (!adToken) {
            throw new BadRequestException('广告凭证无效');
        }

        // 计算额外奖励（与基础奖励相同）
        const extraPoints = task.rewardPoints;

        // 获取用户当前积分
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const newBalance = user.luckyPoints + extraPoints;

        // 使用事务确保数据一致性
        await this.prisma.$transaction([
            // 标记任务已获得翻倍奖励
            this.prisma.task.update({
                where: { id: taskId },
                data: { isDoubleReward: true }
            }),
            // 更新用户积分
            this.prisma.user.update({
                where: { id: userId },
                data: { luckyPoints: newBalance }
            }),
            // 记录积分获取
            this.prisma.pointRecord.create({
                data: {
                    userId,
                    type: 'earn',
                    amount: extraPoints,
                    balance: newBalance,
                    source: 'task_ad_double',
                    sourceId: taskId,
                    description: `看广告翻倍 +${extraPoints}`
                }
            })
        ]);

        return {
            success: true,
            points: extraPoints,
            totalPoints: newBalance,
            isDoubleReward: true
        };
    }

    /**
     * 获取任务历史
     */
    async getHistory(userId: string, query: TaskHistoryQueryDto) {
        const { page = 1, pageSize = 20, status } = query;
        const skip = (page - 1) * pageSize;

        const where: any = { userId };
        if (status) {
            where.status = status;
        }

        const [list, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            }),
            this.prisma.task.count({ where })
        ]);

        return {
            list: list.map((task) => ({
                id: task.id,
                content: task.content,
                status: task.status,
                rewardPoints: task.rewardPoints,
                completedAt: task.completedAt?.toISOString() || null
            })),
            total,
            page,
            pageSize
        };
    }

    /**
     * 过期检查（定时任务调用）
     */
    async expireTasks() {
        const now = new Date();

        await this.prisma.task.updateMany({
            where: {
                status: 'pending',
                expireAt: { lt: now }
            },
            data: { status: 'expired' }
        });
    }
}
