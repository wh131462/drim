import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    Inject,
    forwardRef,
    Optional
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { AchievementService, AchievementConditionType } from '../achievement/achievement.service';
import { SettingsService } from '../settings/settings.service';
import { WechatService } from '@/shared/wechat/wechat.service';
import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';
import { DreamListQueryDto } from './dto/dream-list-query.dto';

@Injectable()
export class DreamService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
        @Inject(forwardRef(() => AchievementService))
        private readonly achievementService: AchievementService,
        private readonly settingsService: SettingsService,
        @Optional() private readonly wechatService?: WechatService
    ) {}

    /**
     * 创建梦境
     */
    async create(userId: string, dto: CreateDreamDto) {
        // 内容长度校验
        const wordCount = dto.content.trim().length;
        if (wordCount < 25) {
            throw new BadRequestException({
                code: 20001,
                message: '梦境内容至少需要25字'
            });
        }

        if (wordCount > 1000) {
            throw new BadRequestException({
                code: 20001,
                message: '梦境内容不能超过1000字'
            });
        }

        const trimmedContent = dto.content.trim();

        // 无意义内容检测
        this.validateContentMeaningful(trimmedContent);

        // 内容安全检测
        await this.checkContentSecurity(trimmedContent, userId);

        // 如果前端传入了 isPublic，使用传入的值；否则使用用户默认隐私设置
        let isPublic = dto.isPublic;
        if (isPublic === undefined) {
            const privacySettings = await this.settingsService.getPrivacySettings(userId);
            isPublic = privacySettings.defaultDreamPublic;
        }

        // 创建梦境记录
        const dream = await this.prisma.dream.create({
            data: {
                userId,
                content: trimmedContent,
                originalContent: trimmedContent, // 保存原始内容
                tags: dto.tags ? JSON.stringify(dto.tags) : null,
                emotion: dto.emotion,
                wordCount,
                isPublic // 使用用户默认隐私设置
            }
        });

        // 创建原始版本
        await this.prisma.dreamVersion.create({
            data: {
                dreamId: dream.id,
                userId,
                type: 'original',
                content: trimmedContent,
                versionNumber: 1,
                isCurrent: true
            }
        });

        // 更新用户连续记梦天数并获取奖励信息
        const streakReward = await this.userService.updateConsecutiveDays(userId);

        // 记录梦境基础奖励 +5 积分
        const DREAM_REWARD = 5;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            const newBalance = user.luckyPoints + DREAM_REWARD;
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: userId },
                    data: { luckyPoints: newBalance }
                }),
                this.prisma.pointRecord.create({
                    data: {
                        userId,
                        type: 'earn',
                        amount: DREAM_REWARD,
                        balance: newBalance,
                        source: 'dream_create',
                        sourceId: dream.id,
                        description: `记录梦境 +${DREAM_REWARD}`
                    }
                })
            ]);
        }

        // 异步检查成就（记梦和连续打卡相关）
        this.achievementService
            .checkAndUnlockAchievements(userId, [
                AchievementConditionType.DREAM_COUNT,
                AchievementConditionType.CONSECUTIVE_DAYS
            ])
            .catch((err) => console.error('检查成就失败:', err));

        return {
            ...this.formatDream(dream),
            rewards: {
                dreamReward: DREAM_REWARD,
                streakReward: streakReward?.bonus || 0,
                streakDays: streakReward?.consecutiveDays || 1
            }
        };
    }

    /**
     * 获取梦境列表
     */
    async getList(userId: string, query: DreamListQueryDto) {
        const { page = 1, pageSize = 20, startDate, endDate, tag, emotion, keyword } = query;
        const skip = (page - 1) * pageSize;

        const where: any = {
            userId,
            status: { not: 'deleted' }
        };

        // 日期筛选
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        // 标签筛选（tags 存储为 JSON 字符串）
        if (tag) {
            where.tags = { contains: tag };
        }

        // 情绪筛选
        if (emotion) {
            where.emotion = emotion;
        }

        // 关键词搜索（搜索内容）
        if (keyword) {
            where.content = { contains: keyword };
        }

        const [list, total] = await Promise.all([
            this.prisma.dream.findMany({
                where,
                include: {
                    analysis: {
                        select: { id: true, status: true, fortuneScore: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            }),
            this.prisma.dream.count({ where })
        ]);

        return {
            list: list.map((dream) => ({
                ...this.formatDream(dream),
                hasAnalysis: dream.analysis?.status === 'completed',
                analysisId: dream.analysis?.id,
                fortuneScore: dream.analysis?.status === 'completed' ? dream.analysis.fortuneScore : null,
                isPublic: dream.isPublic
            })),
            total,
            page,
            pageSize
        };
    }

    /**
     * 获取梦境详情
     */
    async getById(userId: string, dreamId: string) {
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId },
            include: {
                analysis: true
            }
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
                fortuneTips: dream.analysis.fortuneTips ? JSON.parse(dream.analysis.fortuneTips) : null,
                createdAt: dream.analysis.createdAt.toISOString()
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
                    lte: endDate
                }
            },
            select: {
                id: true,
                createdAt: true
            }
        });

        // 构建日历记录
        const records = [];
        const daysInMonth = endDate.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDreams = dreams.filter((d) => {
                const dreamDate = new Date(d.createdAt);
                return dreamDate.getDate() === day;
            });

            records.push({
                date,
                hasDream: dayDreams.length > 0,
                dreamId: dayDreams[0]?.id || null,
                dreamIds: dayDreams.map((d) => d.id),
                dreamCount: dayDreams.length
            });
        }

        // 获取用户信息
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { consecutiveDays: true }
        });

        return {
            year,
            month,
            records,
            consecutiveDays: user?.consecutiveDays || 0,
            monthTotal: dreams.length
        };
    }

    /**
     * 更新梦境内容
     */
    async update(userId: string, dreamId: string, dto: UpdateDreamDto) {
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId },
            include: { analysis: true }
        });

        if (!dream) {
            throw new NotFoundException('梦境不存在');
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException('无权编辑该梦境');
        }

        if (dream.status === 'deleted') {
            throw new NotFoundException('梦境已删除');
        }

        const trimmedContent = dto.content.trim();
        const wordCount = trimmedContent.length;

        // 无意义内容检测
        this.validateContentMeaningful(trimmedContent);

        // 内容安全检测
        await this.checkContentSecurity(trimmedContent, userId);

        // 更新梦境内容
        const updatedDream = await this.prisma.dream.update({
            where: { id: dreamId },
            data: {
                content: trimmedContent,
                wordCount,
                updatedAt: new Date()
            }
        });

        // 创建编辑版本记录
        const latestVersion = await this.prisma.dreamVersion.findFirst({
            where: { dreamId },
            orderBy: { versionNumber: 'desc' }
        });

        await this.prisma.dreamVersion.create({
            data: {
                dreamId,
                userId,
                type: 'edited',
                content: trimmedContent,
                versionNumber: (latestVersion?.versionNumber || 0) + 1,
                isCurrent: true
            }
        });

        // 将之前的版本设为非当前
        if (latestVersion) {
            await this.prisma.dreamVersion.update({
                where: { id: latestVersion.id },
                data: { isCurrent: false }
            });
        }

        // 重新解析相关
        let pointsConsumed = 0;
        let remainingPoints = 0;

        // 如果需要重新解析，检查积分并扣除
        if (dto.reAnalyze && dream.analysis) {
            const REANALYZE_COST = 50;

            // 获取用户当前积分
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || user.luckyPoints < REANALYZE_COST) {
                throw new BadRequestException({
                    code: 30001,
                    message: `积分不足，重新解析需要${REANALYZE_COST}积分`
                });
            }

            remainingPoints = user.luckyPoints - REANALYZE_COST;
            pointsConsumed = REANALYZE_COST;

            // 使用事务：扣除积分、记录消耗、删除旧解析、删除旧任务
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: userId },
                    data: { luckyPoints: remainingPoints }
                }),
                this.prisma.pointRecord.create({
                    data: {
                        userId,
                        type: 'consume',
                        amount: REANALYZE_COST,
                        balance: remainingPoints,
                        source: 'dream_reanalyze',
                        sourceId: dreamId,
                        description: `编辑后重新解析 -${REANALYZE_COST}`
                    }
                }),
                this.prisma.analysis.delete({
                    where: { id: dream.analysis.id }
                }),
                this.prisma.task.deleteMany({
                    where: { dreamId }
                })
            ]);

            // 标记状态为 pending
            await this.prisma.dream.update({
                where: { id: dreamId },
                data: { status: 'pending' }
            });
        }

        return {
            ...this.formatDream(updatedDream),
            needReAnalyze: dto.reAnalyze || false,
            pointsConsumed,
            remainingPoints
        };
    }

    /**
     * 删除梦境
     */
    async delete(userId: string, dreamId: string) {
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId }
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
                deletedAt: new Date()
            }
        });

        return null;
    }

    /**
     * 批量删除梦境
     */
    async batchDelete(userId: string, dreamIds: string[]) {
        if (!dreamIds || dreamIds.length === 0) {
            throw new BadRequestException('请选择要删除的梦境');
        }

        // 验证所有梦境都属于当前用户
        const dreams = await this.prisma.dream.findMany({
            where: {
                id: { in: dreamIds },
                userId,
                status: { not: 'deleted' }
            }
        });

        if (dreams.length !== dreamIds.length) {
            throw new BadRequestException('部分梦境不存在或无权删除');
        }

        // 批量软删除
        await this.prisma.dream.updateMany({
            where: {
                id: { in: dreamIds },
                userId
            },
            data: {
                status: 'deleted',
                deletedAt: new Date()
            }
        });

        return { deletedCount: dreamIds.length };
    }

    /**
     * 根据ID获取梦境（内部使用）
     */
    async getDreamById(dreamId: string) {
        return this.prisma.dream.findUnique({
            where: { id: dreamId }
        });
    }

    /**
     * 更新梦境状态
     */
    async updateStatus(dreamId: string, status: 'pending' | 'analyzed') {
        return this.prisma.dream.update({
            where: { id: dreamId },
            data: { status }
        });
    }

    /**
     * 切换梦境隐私状态
     */
    async togglePrivacy(userId: string, dreamId: string) {
        const dream = await this.prisma.dream.findUnique({
            where: { id: dreamId }
        });

        if (!dream) {
            throw new NotFoundException('梦境不存在');
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException('无权操作该梦境');
        }

        if (dream.status === 'deleted') {
            throw new NotFoundException('梦境已删除');
        }

        // 切换为公开时需要进行内容安全检测
        if (!dream.isPublic) {
            await this.checkContentSecurity(dream.content, userId);
        }

        // 切换隐私状态
        const updatedDream = await this.prisma.dream.update({
            where: { id: dreamId },
            data: {
                isPublic: !dream.isPublic
            }
        });

        return {
            isPublic: updatedDream.isPublic
        };
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
            createdAt: dream.createdAt.toISOString()
        };
    }

    /**
     * 无意义内容检测
     * @param content 待检测内容
     * @throws BadRequestException 当内容被判定为无意义时
     */
    private validateContentMeaningful(content: string): void {
        // 移除空白字符后的内容
        const cleanContent = content.replace(/\s/g, '');
        const length = cleanContent.length;

        if (length === 0) {
            throw new BadRequestException({
                code: 20003,
                message: '梦境内容不能为空'
            });
        }

        // 检测重复字符比例（单个字符出现次数超过50%）
        const charCount: Record<string, number> = {};
        for (const char of cleanContent) {
            charCount[char] = (charCount[char] || 0) + 1;
        }
        const maxCharCount = Math.max(...Object.values(charCount));
        if (maxCharCount / length > 0.5) {
            throw new BadRequestException({
                code: 20003,
                message: '梦境内容包含过多重复字符，请描述真实的梦境体验'
            });
        }

        // 统计中文字符数量
        const chineseChars = cleanContent.match(/[\u4e00-\u9fa5]/g) || [];
        const chineseRatio = chineseChars.length / length;

        // 统计英文字母数量
        const englishChars = cleanContent.match(/[a-zA-Z]/g) || [];
        const englishRatio = englishChars.length / length;

        // 纯数字/符号内容检测（无中文且无英文）
        if (chineseRatio === 0 && englishRatio === 0) {
            throw new BadRequestException({
                code: 20003,
                message: '梦境内容需要包含文字描述，请用文字记录您的梦境'
            });
        }

        // 中文内容比例过低检测（当内容较长时，中文比例应该较高）
        if (length > 30 && chineseRatio < 0.3 && englishRatio < 0.5) {
            throw new BadRequestException({
                code: 20003,
                message: '梦境内容需要包含更多文字描述，请详细记录您的梦境'
            });
        }

        // 检测连续重复模式（如 "哈哈哈哈" 或 "abcabcabc"）
        const repeatPattern = /(.{2,})\1{3,}/;
        if (repeatPattern.test(cleanContent)) {
            throw new BadRequestException({
                code: 20003,
                message: '梦境内容包含重复片段，请描述真实的梦境体验'
            });
        }
    }

    /**
     * 内容安全检测
     * @param content 待检测内容
     * @param userId 用户ID
     */
    private async checkContentSecurity(content: string, userId: string): Promise<void> {
        if (!this.wechatService) {
            return; // WechatService 未注入时跳过检测
        }

        // 获取用户 openId
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { openId: true }
        });

        if (!user?.openId) {
            return; // 无 openId 时跳过检测（可能是测试账号）
        }

        const result = await this.wechatService.checkTextSecurity(content, user.openId, 4);

        if (!result.safe) {
            throw new BadRequestException({
                code: 20002,
                message: result.keyword
                    ? `内容包含违规信息: "${result.keyword}"，请修改后重试`
                    : '内容包含违规信息，请修改后重试'
            });
        }
    }
}
