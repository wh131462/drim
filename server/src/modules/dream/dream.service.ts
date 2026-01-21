import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { CreateDreamDto } from './dto/create-dream.dto';
import { DreamListQueryDto } from './dto/dream-list-query.dto';

@Injectable()
export class DreamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 创建梦境
   */
  async create(userId: string, dto: CreateDreamDto) {
    // 检查今日是否已记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingDream = await this.prisma.dream.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { not: 'deleted' },
      },
    });

    if (existingDream) {
      throw new BadRequestException({
        code: 20002,
        message: '今日已记录梦境，每天只能记录一次',
      });
    }

    // 内容长度校验
    const wordCount = dto.content.trim().length;
    if (wordCount < 50) {
      throw new BadRequestException({
        code: 20001,
        message: '梦境内容至少需要50字',
      });
    }

    if (wordCount > 500) {
      throw new BadRequestException({
        code: 20001,
        message: '梦境内容不能超过500字',
      });
    }

    // 创建梦境记录
    const dream = await this.prisma.dream.create({
      data: {
        userId,
        content: dto.content.trim(),
        tags: dto.tags ? JSON.stringify(dto.tags) : null,
        emotion: dto.emotion,
        wordCount,
      },
    });

    // 更新用户连续记梦天数
    await this.userService.updateConsecutiveDays(userId);

    return this.formatDream(dream);
  }

  /**
   * 获取梦境列表
   */
  async getList(userId: string, query: DreamListQueryDto) {
    const { page = 1, pageSize = 20, startDate, endDate } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      userId,
      status: { not: 'deleted' },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.dream.findMany({
        where,
        include: {
          analysis: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.dream.count({ where }),
    ]);

    return {
      list: list.map((dream) => ({
        ...this.formatDream(dream),
        hasAnalysis: dream.analysis?.status === 'completed',
        analysisId: dream.analysis?.id,
      })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取梦境详情
   */
  async getById(userId: string, dreamId: string) {
    const dream = await this.prisma.dream.findUnique({
      where: { id: dreamId },
      include: {
        analysis: true,
      },
    });

    if (!dream) {
      throw new NotFoundException('梦境不存在');
    }

    if (dream.userId !== userId) {
      throw new ForbiddenException('无权访问该梦境');
    }

    if (dream.status === 'deleted') {
      throw new NotFoundException('梦境已删除');
    }

    const result: any = this.formatDream(dream);

    if (dream.analysis && dream.analysis.status === 'completed') {
      result.analysis = {
        id: dream.analysis.id,
        theme: dream.analysis.theme,
        interpretation: dream.analysis.interpretation,
        fortuneScore: dream.analysis.fortuneScore,
        fortuneTips: dream.analysis.fortuneTips
          ? JSON.parse(dream.analysis.fortuneTips)
          : null,
        createdAt: dream.analysis.createdAt.toISOString(),
      };
    }

    return result;
  }

  /**
   * 获取日历数据
   */
  async getCalendar(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const dreams = await this.prisma.dream.findMany({
      where: {
        userId,
        status: { not: 'deleted' },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    // 构建日历记录
    const records = [];
    const daysInMonth = endDate.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dream = dreams.find((d) => {
        const dreamDate = new Date(d.createdAt);
        return dreamDate.getDate() === day;
      });

      records.push({
        date,
        hasDream: !!dream,
        dreamId: dream?.id || null,
      });
    }

    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { consecutiveDays: true },
    });

    return {
      year,
      month,
      records,
      consecutiveDays: user?.consecutiveDays || 0,
      monthTotal: dreams.length,
    };
  }

  /**
   * 删除梦境
   */
  async delete(userId: string, dreamId: string) {
    const dream = await this.prisma.dream.findUnique({
      where: { id: dreamId },
    });

    if (!dream) {
      throw new NotFoundException('梦境不存在');
    }

    if (dream.userId !== userId) {
      throw new ForbiddenException('无权删除该梦境');
    }

    // 软删除
    await this.prisma.dream.update({
      where: { id: dreamId },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });

    return null;
  }

  /**
   * 根据ID获取梦境（内部使用）
   */
  async getDreamById(dreamId: string) {
    return this.prisma.dream.findUnique({
      where: { id: dreamId },
    });
  }

  /**
   * 更新梦境状态
   */
  async updateStatus(dreamId: string, status: 'pending' | 'analyzed') {
    return this.prisma.dream.update({
      where: { id: dreamId },
      data: { status },
    });
  }

  /**
   * 格式化梦境数据
   */
  private formatDream(dream: any) {
    return {
      id: dream.id,
      content: dream.content,
      tags: dream.tags ? JSON.parse(dream.tags) : [],
      emotion: dream.emotion,
      status: dream.status,
      createdAt: dream.createdAt.toISOString(),
    };
  }
}
