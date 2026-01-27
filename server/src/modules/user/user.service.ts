import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/shared/cache/redis.service';
import { WechatService } from '@/shared/wechat/wechat.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly redisService: RedisService,
        private readonly wechatService: WechatService
    ) {}

    /**
     * 微信登录
     */
    async login(code: string) {
        // 1. 通过code获取openId
        const { openid, unionid } = await this.wechatService.code2Session(code);

        if (!openid) {
            throw new UnauthorizedException('登录失败，无法获取用户信息');
        }

        // 2. 查找或创建用户
        let user = await this.prisma.user.findUnique({
            where: { openId: openid }
        });

        let isNewUser = false;

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    openId: openid,
                    unionId: unionid
                }
            });
            isNewUser = true;
        }

        // 3. 生成JWT
        const payload = { userId: user.id, openId: user.openId };
        const token = this.jwtService.sign(payload);

        // 4. 缓存用户信息
        await this.redisService.setJson(`user:info:${user.id}`, user, 86400);

        return {
            token,
            expiresIn: 7 * 24 * 60 * 60, // 7天
            userInfo: this.formatUserInfo(user),
            isNewUser
        };
    }

    /**
     * 使用 OpenID 登录（仅测试环境）
     */
    async loginByOpenId(openId: string) {
        const user = await this.prisma.user.findUnique({
            where: { openId }
        });

        if (!user) {
            throw new UnauthorizedException('测试用户不存在');
        }

        // 生成JWT
        const payload = { userId: user.id, openId: user.openId };
        const token = this.jwtService.sign(payload);

        // 缓存用户信息
        await this.redisService.setJson(`user:info:${user.id}`, user, 86400);

        return {
            token,
            expiresIn: 7 * 24 * 60 * 60, // 7天
            userInfo: this.formatUserInfo(user),
            isNewUser: false
        };
    }

    /**
     * 获取用户信息
     */
    async getUserInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new UnauthorizedException('用户不存在');
        }

        // 实时查询梦境总数，避免与日历数据不一致
        const totalDreams = await this.prisma.dream.count({
            where: {
                userId,
                status: { not: 'deleted' }
            }
        });

        // 实时计算连续打卡天数
        const consecutiveDays = await this.calculateConsecutiveDays(userId);

        // 如果数据库中的数据与实际不符，同步更新
        const needsUpdate = user.totalDreams !== totalDreams || user.consecutiveDays !== consecutiveDays;

        if (needsUpdate) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { totalDreams, consecutiveDays }
            });
            user.totalDreams = totalDreams;
            user.consecutiveDays = consecutiveDays;
        }

        // 更新缓存
        await this.redisService.setJson(`user:info:${userId}`, user, 86400);

        return this.formatUserInfo(user);
    }

    /**
     * 计算连续打卡天数
     */
    private async calculateConsecutiveDays(userId: string): Promise<number> {
        // 获取用户所有梦境的日期（去重，按日期降序）
        const dreams = await this.prisma.dream.findMany({
            where: {
                userId,
                status: { not: 'deleted' }
            },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' }
        });

        if (dreams.length === 0) return 0;

        // 提取日期并去重
        const dateSet = new Set<string>();
        dreams.forEach((d) => {
            const date = new Date(d.createdAt);
            date.setHours(0, 0, 0, 0);
            dateSet.add(date.toISOString().split('T')[0]);
        });

        const dates = Array.from(dateSet).sort().reverse(); // 降序排列

        // 从今天或最近的记梦日期开始计算连续天数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // 检查最近一条梦境是否是今天或昨天
        const lastDreamDate = new Date(dates[0]);
        const diffFromToday = Math.floor((today.getTime() - lastDreamDate.getTime()) / (1000 * 60 * 60 * 24));

        // 如果最后一条梦境超过1天，连续天数为0
        if (diffFromToday > 1) return 0;

        // 计算连续天数
        let consecutive = 1;
        for (let i = 1; i < dates.length; i++) {
            const current = new Date(dates[i - 1]);
            const prev = new Date(dates[i]);
            const diff = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

            if (diff === 1) {
                consecutive++;
            } else {
                break;
            }
        }

        return consecutive;
    }

    /**
     * 更新用户信息
     */
    async updateUserInfo(userId: string, dto: UpdateUserDto) {
        const updateData: any = {};

        if (dto.nickname !== undefined) {
            updateData.nickname = dto.nickname;
        }
        if (dto.avatar !== undefined) {
            updateData.avatar = dto.avatar;
        }
        if (dto.gender !== undefined) {
            updateData.gender = dto.gender;
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        // 更新缓存
        await this.redisService.setJson(`user:info:${userId}`, user, 86400);

        return this.formatUserInfo(user);
    }

    /**
     * 获取用户统计
     */
    async getUserStats(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                achievements: {
                    include: { achievement: true },
                    orderBy: { unlockedAt: 'desc' }
                }
            }
        });

        if (!user) {
            throw new UnauthorizedException('用户不存在');
        }

        // 计算任务完成率
        const totalTasks = await this.prisma.task.count({
            where: { userId }
        });
        const completedTasks = await this.prisma.task.count({
            where: { userId, status: 'completed' }
        });
        const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

        // 获取解析总数
        const totalAnalysis = await this.prisma.analysis.count({
            where: { userId, status: 'completed' }
        });

        return {
            totalDreams: user.totalDreams,
            totalAnalysis,
            totalTasks: completedTasks,
            taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
            currentStreak: user.consecutiveDays,
            longestStreak: user.consecutiveDays, // TODO: 需要单独存储最长连续天数
            luckyPoints: user.luckyPoints,
            achievements: user.achievements.map((ua) => ({
                id: ua.achievement.id,
                name: ua.achievement.name,
                icon: ua.achievement.icon,
                unlockedAt: ua.unlockedAt.toISOString()
            }))
        };
    }

    /**
     * 更新用户幸运值
     */
    async updateLuckyPoints(userId: string, amount: number, source: string, sourceId?: string, description?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return;

        const newBalance = user.luckyPoints + amount;
        const type = amount > 0 ? 'earn' : 'consume';

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
                    type,
                    amount: Math.abs(amount),
                    balance: newBalance,
                    source,
                    sourceId,
                    description
                }
            })
        ]);

        // 更新缓存
        await this.redisService.del(`user:info:${userId}`);
    }

    /**
     * 更新连续记梦天数
     */
    async updateConsecutiveDays(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDreamDate = user.lastDreamDate ? new Date(user.lastDreamDate) : null;

        let newConsecutiveDays = 1;

        if (lastDreamDate) {
            lastDreamDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - lastDreamDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // 今天已经记录过
                return;
            } else if (diffDays === 1) {
                // 连续记录
                newConsecutiveDays = user.consecutiveDays + 1;
            }
            // 超过1天，重置为1
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                consecutiveDays: newConsecutiveDays,
                lastDreamDate: today,
                totalDreams: { increment: 1 }
            }
        });

        // 更新缓存
        await this.redisService.del(`user:info:${userId}`);
    }

    /**
     * 格式化用户信息
     */
    private formatUserInfo(user: any) {
        return {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            isVip: user.isVip,
            vipExpireAt: user.vipExpireAt
                ? typeof user.vipExpireAt === 'string'
                    ? user.vipExpireAt
                    : user.vipExpireAt.toISOString()
                : null,
            luckyPoints: user.luckyPoints,
            consecutiveDays: user.consecutiveDays,
            totalDreams: user.totalDreams,
            totalTasks: user.totalTasks,
            createdAt: user.createdAt
                ? typeof user.createdAt === 'string'
                    ? user.createdAt
                    : user.createdAt.toISOString()
                : null
        };
    }
}
