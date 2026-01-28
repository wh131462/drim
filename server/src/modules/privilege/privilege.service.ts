import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ExchangeRecordsQueryDto } from './dto/exchange.dto';
import { OrderStatus } from '@prisma/client';

/**
 * 权益套餐配置（硬编码，避免数据库编码问题）
 */
export interface PrivilegePlan {
    id: string;
    name: string;
    durationDays: number;
    price: number;
    originalPrice: number;
}

export const PRIVILEGE_PLANS: PrivilegePlan[] = [
    {
        id: 'privilege_1day',
        name: '体验特权',
        durationDays: 1,
        price: 50,
        originalPrice: 50
    },
    {
        id: 'privilege_30day',
        name: '月度特权',
        durationDays: 30,
        price: 300,
        originalPrice: 500
    },
    {
        id: 'privilege_365day',
        name: '年度特权',
        durationDays: 365,
        price: 2000,
        originalPrice: 5000
    }
];

@Injectable()
export class PrivilegeService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 根据 ID 获取权益套餐
     */
    private getPlanById(id: string): PrivilegePlan | undefined {
        return PRIVILEGE_PLANS.find((plan) => plan.id === id);
    }

    /**
     * 获取权益信息
     */
    async getInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                isVip: true,
                vipExpireAt: true,
                luckyPoints: true
            }
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 检查特权是否已过期
        const now = new Date();
        const hasPrivilege = user.isVip && user.vipExpireAt && user.vipExpireAt > now;

        return {
            hasPrivilege,
            expireAt: hasPrivilege && user.vipExpireAt ? user.vipExpireAt.toISOString() : null,
            currentPoints: user.luckyPoints,
            benefits: [
                {
                    key: 'no_ad',
                    name: '免广告查看解析',
                    enabled: hasPrivilege
                },
                {
                    key: 'unlimited_polish',
                    name: '无限AI润色',
                    enabled: hasPrivilege
                },
                {
                    key: 'unlimited_history',
                    name: '无限历史记录',
                    enabled: hasPrivilege
                },
                {
                    key: 'deep_analysis',
                    name: '深度心理分析',
                    enabled: hasPrivilege
                }
            ],
            // 从硬编码常量获取权益套餐
            exchangeItems: PRIVILEGE_PLANS.map((plan) => ({
                id: plan.id,
                name: plan.name,
                duration: `${plan.durationDays}天`,
                points: plan.price,
                originalPoints: plan.originalPrice !== plan.price ? plan.originalPrice : null
            })),
            earnWays: [
                { name: '记录梦境', points: 5 },
                { name: '连续打卡奖励', points: '5-200', desc: '3/7/14/30/60/100天里程碑' },
                { name: '浏览他人梦境', points: 1, desc: '每日最多10次' },
                { name: '完成改运任务', points: 10 },
                { name: '看广告翻倍', points: 10 },
                { name: '解锁成就', points: '10-100' }
            ]
        };
    }

    /**
     * 积分兑换权益
     */
    async exchange(userId: string, itemId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                luckyPoints: true,
                isVip: true,
                vipExpireAt: true
            }
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 从硬编码常量获取兑换项目
        const plan = this.getPlanById(itemId);

        if (!plan) {
            throw new BadRequestException('兑换项目不存在');
        }

        const pointsNeeded = plan.price;

        // 检查积分是否足够
        if (user.luckyPoints < pointsNeeded) {
            throw new BadRequestException('积分不足');
        }

        // 计算新的特权过期时间
        let privilegeExpireAt: Date;
        const now = new Date();

        if (user.isVip && user.vipExpireAt && user.vipExpireAt > now) {
            // 续期：在原有过期时间基础上延长
            privilegeExpireAt = new Date(user.vipExpireAt);
        } else {
            // 新开：从现在开始
            privilegeExpireAt = new Date();
        }
        privilegeExpireAt.setDate(privilegeExpireAt.getDate() + plan.durationDays);

        // 生成兑换订单号
        const orderNo = `EX${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // 事务处理
        const result = await this.prisma.$transaction(async (tx) => {
            // 创建兑换记录（保存权益名称，期限从硬编码常量获取）
            const order = await tx.order.create({
                data: {
                    userId,
                    orderNo,
                    type: 'vip',
                    productId: plan.id,
                    productName: plan.name, // 保存权益名称
                    amount: plan.price,
                    payAmount: plan.price,
                    status: 'paid',
                    payType: 'points',
                    paidAt: new Date(),
                    expireAt: privilegeExpireAt
                }
            });

            // 扣除积分
            const newPoints = user.luckyPoints - pointsNeeded;
            await tx.user.update({
                where: { id: userId },
                data: {
                    luckyPoints: newPoints,
                    isVip: true,
                    vipExpireAt: privilegeExpireAt
                }
            });

            // 记录积分消耗
            await tx.pointRecord.create({
                data: {
                    userId,
                    type: 'consume',
                    amount: pointsNeeded,
                    balance: newPoints,
                    source: 'privilege_exchange',
                    sourceId: order.id,
                    description: `兑换${plan.name} -${pointsNeeded}`
                }
            });

            return { order, newPoints };
        });

        return {
            exchangeId: result.order.id,
            itemId: plan.id,
            itemName: plan.name,
            duration: `${plan.durationDays}天`,
            pointsConsumed: pointsNeeded,
            remainingPoints: result.newPoints,
            privilegeExpireAt: privilegeExpireAt.toISOString()
        };
    }

    /**
     * 获取兑换记录
     */
    async getRecords(userId: string, query: ExchangeRecordsQueryDto) {
        const { page = 1, pageSize = 20 } = query;
        const skip = (page - 1) * pageSize;

        const where = {
            userId,
            payType: 'points',
            status: OrderStatus.paid
        };

        const [records, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { paidAt: 'desc' },
                skip,
                take: pageSize
            }),
            this.prisma.order.count({ where })
        ]);

        return {
            list: records.map((record) => {
                // 从硬编码常量获取期限
                const plan = this.getPlanById(record.productId);
                const duration = plan ? `${plan.durationDays}天` : '';

                return {
                    exchangeId: record.id,
                    itemId: record.productId,
                    itemName: record.productName, // 使用订单保存的名称
                    duration,
                    pointsConsumed: Number(record.payAmount),
                    exchangedAt: record.paidAt?.toISOString() || record.createdAt.toISOString(),
                    expireAt: record.expireAt.toISOString()
                };
            }),
            total,
            page,
            pageSize
        };
    }
}
