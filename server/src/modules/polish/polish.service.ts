import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Inject,
    forwardRef
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AiService } from '@/shared/ai/ai.service';
import { AchievementService, AchievementConditionType } from '../achievement/achievement.service';
import { PolishDreamDto } from './dto';

@Injectable()
export class PolishService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
        @Inject(forwardRef(() => AchievementService))
        private readonly achievementService: AchievementService
    ) {}

    /**
     * 润色梦境
     */
    async polishDream(userId: string, dreamId: string, dto: PolishDreamDto) {
        const { prompt, basedOnVersionId } = dto;

        // 检查梦境是否存在且属于该用户
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId },
            include: {
                user: {
                    select: {
                        isVip: true,
                        vipExpireAt: true
                    }
                },
                versions: {
                    orderBy: {
                        versionNumber: 'desc'
                    }
                }
            }
        });

        if (!dream) {
            throw new NotFoundException('梦境不存在');
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException('无权操作此梦境');
        }

        // 检查配额
        const isVip = dream.user.isVip && dream.user.vipExpireAt && dream.user.vipExpireAt > new Date();

        if (!isVip) {
            // 非 VIP 用户检查配额
            const quota = await this.getOrCreateQuota(userId);
            if (quota.remaining <= 0) {
                throw new BadRequestException('今日润色配额已用完，开通会员可无限润色');
            }
        }

        // 确定要润色的内容
        let baseContent: string;
        let baseVersionId: string | null = null;

        if (basedOnVersionId) {
            const baseVersion = dream.versions.find((v: any) => v.id === basedOnVersionId);
            if (!baseVersion) {
                throw new NotFoundException('指定的版本不存在');
            }
            baseContent = baseVersion.content;
            baseVersionId = basedOnVersionId;
        } else {
            // 使用当前版本
            if (dream.currentVersionId) {
                const currentVersion = dream.versions.find((v: any) => v.id === dream.currentVersionId);
                baseContent = currentVersion?.content || dream.content;
                baseVersionId = dream.currentVersionId;
            } else {
                baseContent = dream.content;
            }
        }

        // 调用 AI 润色
        const polishedContent = await this.callAIPolish(baseContent, prompt);

        // 创建新版本
        const newVersionNumber = dream.versions.length > 0 ? dream.versions[0].versionNumber + 1 : 2;

        const newVersion = await this.prisma.dreamVersion.create({
            data: {
                dreamId,
                userId,
                type: 'polished',
                content: polishedContent,
                polishedFrom: baseVersionId,
                polishPrompt: prompt || '默认润色',
                aiModel: 'ai-polish',
                versionNumber: newVersionNumber,
                isCurrent: true
            }
        });

        // 更新所有其他版本为非当前版本
        await this.prisma.dreamVersion.updateMany({
            where: {
                dreamId,
                id: { not: newVersion.id }
            },
            data: {
                isCurrent: false
            }
        });

        // 更新梦境的当前版本
        await this.prisma.dream.update({
            where: { id: dreamId },
            data: {
                content: polishedContent,
                currentVersionId: newVersion.id
            }
        });

        // 扣减配额（非 VIP）
        if (!isVip) {
            const now = new Date();
            const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            await this.prisma.polishQuota.update({
                where: {
                    userId_date: {
                        userId,
                        date: today
                    }
                },
                data: {
                    used: { increment: 1 },
                    remaining: { decrement: 1 }
                }
            });
        }

        // 异步检查润色相关成就
        this.achievementService
            .checkAndUnlockAchievements(userId, [AchievementConditionType.POLISH_COUNT])
            .catch((err) => console.error('检查润色成就失败:', err));

        return {
            versionId: newVersion.id,
            content: polishedContent,
            versionNumber: newVersionNumber,
            quota: isVip ? null : await this.getQuota(userId)
        };
    }

    /**
     * 调用 AI 进行润色
     */
    private async callAIPolish(content: string, customPrompt?: string): Promise<string> {
        const prompt = `你是一个专业的梦境记录润色助手。请将以下梦境内容润色得更具故事性和可读性，同时保持梦境的真实性和原始含义。

要求：
1. 保留所有关键事实和细节
2. 优化语言表达，使其更流畅、生动
3. 适当补充合理的描述性细节，但不改变核心内容
4. 保持梦境的情绪氛围
5. 字数控制在原文的 1.2-1.5 倍左右
6. 使用第一人称视角
7. 不要添加任何解释或分析

${customPrompt ? `特别要求：${customPrompt}\n\n` : ''}原始梦境记录：
${content}

请直接输出润色后的梦境内容，不要有其他说明：`;

        try {
            const polishedContent = await this.aiService.chat(prompt);
            return polishedContent || content;
        } catch (error) {
            console.error('AI 润色失败:', error);
            throw new BadRequestException('AI 润色服务暂时不可用，请稍后重试');
        }
    }

    /**
     * 纯文本润色(不需要梦境ID,不保存到数据库)
     */
    async polishText(userId: string, content: string, customPrompt?: string) {
        // 检查配额
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                isVip: true,
                vipExpireAt: true
            }
        });

        const isVip = user?.isVip && user?.vipExpireAt && user.vipExpireAt > new Date();

        if (!isVip) {
            // 非 VIP 用户检查配额
            const quota = await this.getOrCreateQuota(userId);
            if (quota.remaining <= 0) {
                throw new BadRequestException('今日润色配额已用完,开通会员可无限润色');
            }
        }

        // 调用 AI 润色
        const polishedContent = await this.callAIPolish(content, customPrompt);

        // 扣减配额(非 VIP)
        if (!isVip) {
            const now = new Date();
            const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            await this.prisma.polishQuota.update({
                where: {
                    userId_date: {
                        userId,
                        date: today
                    }
                },
                data: {
                    used: { increment: 1 },
                    remaining: { decrement: 1 }
                }
            });
        }

        return {
            content: polishedContent,
            quota: isVip ? null : await this.getQuota(userId)
        };
    }

    /**
     * 获取配额
     */
    async getQuota(userId: string) {
        const quota = await this.getOrCreateQuota(userId);

        // 检查用户是否是 VIP
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                isVip: true,
                vipExpireAt: true
            }
        });

        const isVip = user?.isVip && user?.vipExpireAt && user.vipExpireAt > new Date();

        return {
            date: quota.date.toISOString(),
            total: isVip ? -1 : quota.total, // -1 表示无限
            used: quota.used,
            remaining: isVip ? -1 : quota.remaining,
            isVip
        };
    }

    /**
     * 获取或创建今日配额
     */
    private async getOrCreateQuota(userId: string) {
        // 获取今天的日期（UTC 时间，只保留年月日）
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        console.log(`[PolishQuota] 获取配额 - userId: ${userId}, today: ${today.toISOString()}`);

        // 最多重试 3 次
        for (let attempt = 0; attempt < 3; attempt++) {
            console.log(`[PolishQuota] 尝试第 ${attempt + 1} 次`);

            // 先尝试查找
            let quota = await this.prisma.polishQuota.findFirst({
                where: {
                    userId,
                    date: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (quota) {
                console.log(`[PolishQuota] 找到现有配额:`, quota);
                return quota;
            }

            console.log(`[PolishQuota] 未找到配额，尝试创建`);

            // 如果不存在，尝试创建
            try {
                quota = await this.prisma.polishQuota.create({
                    data: {
                        userId,
                        date: today,
                        total: 3,
                        used: 0,
                        remaining: 3
                    }
                });
                console.log(`[PolishQuota] 创建成功:`, quota);
                return quota;
            } catch (error: any) {
                console.error(`[PolishQuota] 创建失败:`, error.code, error.message);

                // 如果是唯一约束冲突，说明其他请求已经创建了，继续重试
                if (error.code === 'P2002' && attempt < 2) {
                    // 等待一小段时间后重试
                    await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
                    continue;
                }
                // 其他错误或重试次数用尽，抛出异常
                if (error.code === 'P2002') {
                    throw new BadRequestException('配额获取失败，请稍后重试');
                }
                throw error;
            }
        }

        throw new BadRequestException('无法获取配额信息，请重试');
    }

    /**
     * 切换梦境当前版本
     */
    async switchVersion(userId: string, dreamId: string, versionId: string) {
        // 检查梦境是否存在且属于该用户
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId }
        });

        if (!dream) {
            throw new NotFoundException('梦境不存在');
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException('无权操作此梦境');
        }

        // 检查版本是否存在
        const version = await this.prisma.dreamVersion.findUnique({
            where: { id: versionId }
        });

        if (!version || version.dreamId !== dreamId) {
            throw new NotFoundException('版本不存在');
        }

        // 更新所有版本为非当前版本
        await this.prisma.dreamVersion.updateMany({
            where: { dreamId },
            data: { isCurrent: false }
        });

        // 设置指定版本为当前版本
        await this.prisma.dreamVersion.update({
            where: { id: versionId },
            data: { isCurrent: true }
        });

        // 更新梦境内容和当前版本ID
        await this.prisma.dream.update({
            where: { id: dreamId },
            data: {
                content: version.content,
                currentVersionId: versionId
            }
        });

        return {
            success: true,
            currentVersionId: versionId,
            content: version.content
        };
    }

    /**
     * 获取梦境版本历史
     */
    async getVersions(userId: string, dreamId: string) {
        // 检查梦境是否存在且属于该用户
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId }
        });

        if (!dream) {
            throw new NotFoundException('梦境不存在');
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException('无权操作此梦境');
        }

        // 获取所有版本
        const versions = await this.prisma.dreamVersion.findMany({
            where: { dreamId },
            orderBy: {
                versionNumber: 'asc'
            },
            select: {
                id: true,
                type: true,
                content: true,
                polishedFrom: true,
                polishPrompt: true,
                versionNumber: true,
                isCurrent: true,
                createdAt: true
            }
        });

        return {
            dreamId,
            currentVersionId: dream.currentVersionId,
            totalVersions: versions.length,
            versions: versions.map((v: any) => ({
                id: v.id,
                type: v.type,
                content: v.content,
                polishedFrom: v.polishedFrom,
                polishPrompt: v.polishPrompt,
                versionNumber: v.versionNumber,
                isCurrent: v.isCurrent,
                createdAt: v.createdAt
            }))
        };
    }
}
