import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    ConflictException,
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
    ) {
        if (process.env.NODE_ENV === 'production' && !this.wechatService) {
            throw new Error('生产环境必须注入 WechatService 以进行内容安全检测');
        }
    }

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
        const trimmedOriginalContent = (dto.originalContent ?? dto.content).trim();

        if (trimmedOriginalContent.length < 25 || trimmedOriginalContent.length > 1000) {
            throw new BadRequestException({
                code: 20001,
                message: '原始梦境内容长度必须为25-1000字'
            });
        }

        // 无意义内容检测
        this.validateContentMeaningful(trimmedContent);
        if (trimmedOriginalContent !== trimmedContent) {
            this.validateContentMeaningful(trimmedOriginalContent);
        }

        // 内容安全检测
        await this.checkContentSecurity(trimmedContent, userId);
        if (trimmedOriginalContent !== trimmedContent) {
            await this.checkContentSecurity(trimmedOriginalContent, userId);
        }

        // 如果前端传入了 isPublic，使用传入的值；否则使用用户默认隐私设置
        let isPublic = dto.isPublic;
        if (isPublic === undefined) {
            const privacySettings = await this.settingsService.getPrivacySettings(userId);
            isPublic = privacySettings.defaultDreamPublic;
        }

        const hasModifiedContent = trimmedOriginalContent !== trimmedContent;
        const appliedVersionType = dto.versionType === 'edited' ? 'edited' : 'polished';
        const DREAM_REWARD = 5;
        const { dream, streakReward } = await this.prisma.$transaction(async (tx) => {
            const streakReward = await this.userService.updateConsecutiveDays(userId, tx);
            const createdDream = await tx.dream.create({
                data: {
                    userId,
                    content: trimmedContent,
                    originalContent: trimmedOriginalContent,
                    tags: dto.tags ? JSON.stringify(dto.tags) : null,
                    emotion: dto.emotion ?? null,
                    wordCount,
                    isPublic
                }
            });

            const originalVersion = await tx.dreamVersion.create({
                data: {
                    dreamId: createdDream.id,
                    userId,
                    type: 'original',
                    content: trimmedOriginalContent,
                    versionNumber: 1,
                    isCurrent: !hasModifiedContent
                }
            });

            let currentVersionId = originalVersion.id;
            if (hasModifiedContent) {
                const appliedVersion = await tx.dreamVersion.create({
                    data: {
                        dreamId: createdDream.id,
                        userId,
                        type: appliedVersionType,
                        content: trimmedContent,
                        polishedFrom: appliedVersionType === 'polished' ? originalVersion.id : null,
                        versionNumber: 2,
                        isCurrent: true
                    }
                });
                currentVersionId = appliedVersion.id;
            }

            const dream = await tx.dream.update({
                where: { id: createdDream.id },
                data: { currentVersionId }
            });
            const rewardedUser = await tx.user.update({
                where: { id: userId },
                data: { luckyPoints: { increment: DREAM_REWARD } }
            });
            await tx.pointRecord.create({
                data: {
                    userId,
                    type: 'earn',
                    amount: DREAM_REWARD,
                    balance: rewardedUser.luckyPoints,
                    source: 'dream_create',
                    sourceId: dream.id,
                    description: `记录梦境 +${DREAM_REWARD}`
                }
            });
            return { dream, streakReward };
        });

        // 异步检查成就（记梦和连续打卡相关）
        this.achievementService
            .checkAndUnlockAchievements(userId, [
                AchievementConditionType.DREAM_COUNT,
                AchievementConditionType.CONSECUTIVE_DAYS
            ])
            .catch((err) => console.error('检查成就失败:', err));

        return {
            ...this.formatDream(dream),
            currentVersionType: hasModifiedContent ? appliedVersionType : 'original',
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
        const currentVersion = await this.prisma.dreamVersion.findFirst({
            where: {
                dreamId,
                ...(dream.currentVersionId ? { id: dream.currentVersionId } : { isCurrent: true })
            },
            orderBy: { versionNumber: 'desc' },
            select: { type: true }
        });
        result.currentVersionType = currentVersion?.type || 'original';

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
        if (wordCount < 25 || wordCount > 1000) {
            throw new BadRequestException({ code: 20001, message: '梦境内容长度必须为25-1000字' });
        }

        this.validateContentMeaningful(trimmedContent);
        await this.checkContentSecurity(trimmedContent, userId);

        const REANALYZE_COST = 50;
        const result = await this.prisma.$transaction(async (tx) => {
            const editedAt = new Date(Math.max(Date.now(), dream.updatedAt.getTime() + 1));
            const claimed = await tx.dream.updateMany({
                where: {
                    id: dreamId,
                    userId,
                    status: { not: 'deleted' },
                    updatedAt: dream.updatedAt,
                    currentVersionId: dream.currentVersionId
                },
                data: { updatedAt: editedAt }
            });
            if (claimed.count !== 1) {
                throw new ConflictException('梦境已更新，请重新加载后再保存');
            }

            const currentDream = await tx.dream.findUnique({
                where: { id: dreamId },
                include: { analysis: true }
            });

            if (!currentDream || currentDream.userId !== userId || currentDream.status === 'deleted') {
                throw new NotFoundException('梦境不存在或已删除');
            }
            if (currentDream.analysis?.status === 'processing') {
                throw new ConflictException('梦境解析中，请等待完成后再编辑');
            }

            const shouldReAnalyze = dto.reAnalyze === true;
            let pointsConsumed = 0;
            let remainingPoints = 0;

            if (shouldReAnalyze && currentDream.analysis) {
                const charged = await tx.user.updateMany({
                    where: { id: userId, luckyPoints: { gte: REANALYZE_COST } },
                    data: { luckyPoints: { decrement: REANALYZE_COST } }
                });
                if (charged.count !== 1) {
                    throw new BadRequestException({
                        code: 30001,
                        message: `积分不足，重新解析需要${REANALYZE_COST}积分`
                    });
                }

                const chargedUser = await tx.user.findUnique({
                    where: { id: userId },
                    select: { luckyPoints: true }
                });
                pointsConsumed = REANALYZE_COST;
                remainingPoints = chargedUser?.luckyPoints ?? 0;
                await tx.pointRecord.create({
                    data: {
                        userId,
                        type: 'consume',
                        amount: REANALYZE_COST,
                        balance: remainingPoints,
                        source: 'dream_reanalyze',
                        sourceId: dreamId,
                        description: `编辑后重新解析 -${REANALYZE_COST}`
                    }
                });
                await tx.analysis.delete({ where: { id: currentDream.analysis.id } });
                await tx.task.deleteMany({ where: { dreamId } });
            }

            const latestVersion = await tx.dreamVersion.findFirst({
                where: { dreamId },
                orderBy: { versionNumber: 'desc' }
            });
            let versionType = dto.versionType || 'edited';
            if (versionType === 'original' && trimmedContent !== currentDream.originalContent) versionType = 'edited';
            const originalVersion =
                versionType === 'original'
                    ? await tx.dreamVersion.findFirst({
                          where: { dreamId, type: 'original', content: trimmedContent },
                          orderBy: { versionNumber: 'asc' }
                      })
                    : null;
            await tx.dreamVersion.updateMany({
                where: { dreamId, isCurrent: true },
                data: { isCurrent: false }
            });
            const currentVersion = originalVersion
                ? await tx.dreamVersion.update({ where: { id: originalVersion.id }, data: { isCurrent: true } })
                : await tx.dreamVersion.create({
                      data: {
                          dreamId,
                          userId,
                          type: versionType,
                          content: trimmedContent,
                          polishedFrom: versionType === 'polished' ? currentDream.currentVersionId : null,
                          versionNumber: (latestVersion?.versionNumber || 0) + 1,
                          isCurrent: true
                      }
                  });

            const data: any = {
                content: trimmedContent,
                wordCount,
                currentVersionId: currentVersion.id,
                updatedAt: editedAt
            };
            if (dto.tags !== undefined) data.tags = dto.tags === null ? null : JSON.stringify(dto.tags);
            if (dto.emotion !== undefined) data.emotion = dto.emotion;
            if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
            if (shouldReAnalyze) data.status = 'pending';

            const updatedDream = await tx.dream.update({ where: { id: dreamId }, data });
            return { updatedDream, pointsConsumed, remainingPoints, versionType };
        });

        return {
            ...this.formatDream(result.updatedDream),
            currentVersionType: result.versionType,
            needReAnalyze: dto.reAnalyze || false,
            pointsConsumed: result.pointsConsumed,
            remainingPoints: result.remainingPoints
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
            originalContent: dream.originalContent,
            currentVersionId: dream.currentVersionId,
            tags: dream.tags ? JSON.parse(dream.tags) : [],
            emotion: dream.emotion,
            status: dream.status,
            isPublic: dream.isPublic,
            wordCount: dream.wordCount,
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
            if (process.env.NODE_ENV === 'production') {
                throw new BadRequestException('内容安全检测不可用，请稍后重试');
            }
            return; // WechatService 未注入时跳过检测
        }

        // 获取用户 openId
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { openId: true }
        });

        if (!user?.openId) {
            if (process.env.NODE_ENV === 'production') {
                throw new BadRequestException('用户身份无效，请重新登录后提交');
            }
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
