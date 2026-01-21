import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { TaskHistoryQueryDto } from './dto/task-history-query.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 从解析结果创建任务
   */
  async createFromAnalysis(
    userId: string,
    dreamId: string,
    taskData: { type: string; content: string },
  ) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return this.prisma.task.create({
      data: {
        userId,
        dreamId,
        type: taskData.type,
        content: taskData.content,
        rewardPoints: 10,
        expireAt: today,
      },
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
        status: { not: 'expired' },
      },
      include: {
        dream: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!task) {
      return null;
    }

    return {
      id: task.id,
      type: task.type,
      content: task.content,
      rewardPoints: task.rewardPoints,
      doubleReward: false,
      status: task.status,
      expireAt: task.expireAt.toISOString(),
      relatedDreamId: task.dream.id,
    };
  }

  /**
   * 完成任务
   */
  async completeTask(userId: string, taskId: string, dto: CompleteTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
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
    const rewardPoints = isDoubleReward
      ? task.rewardPoints * 2
      : task.rewardPoints;

    // 更新任务状态
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        isDoubleReward,
        completedAt: new Date(),
      },
    });

    // 更新用户积分和任务数
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        luckyPoints: { increment: rewardPoints },
        totalTasks: { increment: 1 },
      },
    });

    // 记录积分获取
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.prisma.pointRecord.create({
      data: {
        userId,
        type: 'earn',
        amount: rewardPoints,
        balance: user!.luckyPoints,
        source: 'task_complete',
        sourceId: taskId,
        description: `完成任务 +${rewardPoints}`,
      },
    });

    return {
      rewardPoints,
      totalPoints: user!.luckyPoints,
      isDoubleReward,
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
        take: pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      list: list.map((task) => ({
        id: task.id,
        content: task.content,
        status: task.status,
        rewardPoints: task.rewardPoints,
        completedAt: task.completedAt?.toISOString() || null,
      })),
      total,
      page,
      pageSize,
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
        expireAt: { lt: now },
      },
      data: { status: 'expired' },
    });
  }
}
