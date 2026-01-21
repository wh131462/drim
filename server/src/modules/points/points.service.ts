import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PointsQueryDto } from './dto/points-query.dto';

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取积分记录
   */
  async getRecords(userId: string, query: PointsQueryDto) {
    const { page = 1, pageSize = 20, type } = query;
    const skip = (page - 1) * pageSize;

    // 获取当前积分
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { luckyPoints: true },
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
        take: pageSize,
      }),
      this.prisma.pointRecord.count({ where }),
    ]);

    return {
      currentPoints: user?.luckyPoints || 0,
      records: records.map((record) => ({
        id: record.id.toString(),
        type: record.type,
        amount: record.amount,
        source: record.source,
        description: record.description,
        createdAt: record.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }
}
