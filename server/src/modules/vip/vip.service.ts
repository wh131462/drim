import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VipService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 获取会员信息
     */
    async getVipInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isVip: true, vipExpireAt: true }
        });

        const plans = await this.prisma.vipPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });

        return {
            isVip: user?.isVip || false,
            expireAt: user?.vipExpireAt?.toISOString() || null,
            benefits: [
                {
                    key: 'no_ad',
                    name: '免广告查看解析',
                    enabled: user?.isVip || false
                },
                {
                    key: 'unlimited_history',
                    name: '无限历史记录',
                    enabled: user?.isVip || false
                },
                {
                    key: 'free_reanalyze',
                    name: '免费重新解析',
                    enabled: user?.isVip || false
                },
                {
                    key: 'premium_themes',
                    name: '高级解析主题',
                    enabled: user?.isVip || false
                }
            ],
            plans: plans.map((plan) => ({
                id: plan.id,
                name: plan.name,
                price: Number(plan.price),
                originalPrice: Number(plan.originalPrice)
            }))
        };
    }

    /**
     * 创建订单
     */
    async createOrder(userId: string, planId: string) {
        const plan = await this.prisma.vipPlan.findUnique({
            where: { id: planId }
        });

        if (!plan || !plan.isActive) {
            throw new BadRequestException('套餐不存在或已下架');
        }

        const orderNo = `VIP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const expireAt = new Date();
        expireAt.setMinutes(expireAt.getMinutes() + 30); // 30分钟内支付

        const order = await this.prisma.order.create({
            data: {
                userId,
                orderNo,
                type: 'vip',
                productId: plan.id,
                productName: plan.name,
                amount: plan.price,
                payAmount: plan.price,
                expireAt
            }
        });

        // TODO: 调用微信支付接口获取支付参数
        // 这里返回模拟数据
        return {
            orderId: order.id,
            paymentParams: {
                timeStamp: String(Math.floor(Date.now() / 1000)),
                nonceStr: uuidv4().replace(/-/g, ''),
                package: `prepay_id=mock_${order.id}`,
                signType: 'RSA',
                paySign: 'mock_sign'
            }
        };
    }

    /**
     * 查询订单状态
     */
    async getOrderStatus(userId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (order.userId !== userId) {
            throw new ForbiddenException('无权查看该订单');
        }

        return {
            orderId: order.id,
            status: order.status,
            planId: order.productId,
            amount: Number(order.amount),
            paidAt: order.paidAt?.toISOString() || null,
            vipExpireAt: null // 支付成功后更新
        };
    }

    /**
     * 处理支付回调
     */
    async handlePaymentCallback(orderId: string, transactionId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order || order.status !== 'pending') {
            return;
        }

        // 获取套餐信息
        const plan = await this.prisma.vipPlan.findUnique({
            where: { id: order.productId }
        });

        if (!plan) return;

        // 计算VIP过期时间
        const user = await this.prisma.user.findUnique({
            where: { id: order.userId }
        });

        let vipExpireAt: Date;
        if (user?.isVip && user.vipExpireAt && user.vipExpireAt > new Date()) {
            // 续费，在原有基础上延长
            vipExpireAt = new Date(user.vipExpireAt);
        } else {
            // 新开，从现在开始
            vipExpireAt = new Date();
        }
        vipExpireAt.setDate(vipExpireAt.getDate() + plan.durationDays);

        // 事务更新
        await this.prisma.$transaction([
            // 更新订单状态
            this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'paid',
                    transactionId,
                    paidAt: new Date()
                }
            }),
            // 更新用户VIP状态
            this.prisma.user.update({
                where: { id: order.userId },
                data: {
                    isVip: true,
                    vipExpireAt
                }
            })
        ]);
    }
}
