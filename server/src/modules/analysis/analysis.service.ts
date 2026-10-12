import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    ConflictException,
    Logger
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AiService } from '@/shared/ai/ai.service';
import { PromptService } from './prompt.service';
import { AnalysisSSEService } from './analysis-sse.service';
import { RequestAnalysisDto } from './dto/request-analysis.dto';

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
        private readonly promptService: PromptService,
        private readonly sseService: AnalysisSSEService
    ) {}

    /**
     * 请求解析
     */
    async requestAnalysis(userId: string, dto: RequestAnalysisDto) {
        const result = await this.prisma.$transaction(async (tx) => {
            const locked = await tx.dream.updateMany({
                where: { id: dto.dreamId, userId, status: { not: 'deleted' } },
                data: { updatedAt: new Date() }
            });
            if (locked.count !== 1) {
                const dream = await tx.dream.findUnique({ where: { id: dto.dreamId } });
                if (!dream || dream.status === 'deleted') throw new NotFoundException('梦境不存在');
                throw new ForbiddenException('无权访问该梦境');
            }

            const dream = await tx.dream.findUnique({ where: { id: dto.dreamId } });
            if (!dream) throw new NotFoundException('梦境不存在');
            const existingAnalysis = await tx.analysis.findUnique({ where: { dreamId: dto.dreamId } });

            if (existingAnalysis?.status === 'completed' || existingAnalysis?.status === 'processing') {
                return { dream, analysis: existingAnalysis, shouldProcess: false };
            }

            const analysis = existingAnalysis
                ? await tx.analysis.update({
                      where: { id: existingAnalysis.id },
                      data: {
                          status: 'processing',
                          theme: null,
                          interpretation: null,
                          fortuneScore: null,
                          fortuneTips: null
                      }
                  })
                : await tx.analysis.create({
                      data: { dreamId: dto.dreamId, userId, status: 'processing' }
                  });
            if (existingAnalysis?.status === 'failed') {
                await tx.task.deleteMany({ where: { dreamId: dto.dreamId } });
            }
            await tx.dream.update({ where: { id: dto.dreamId }, data: { status: 'pending' } });
            return { dream, analysis, shouldProcess: true };
        });

        if (result.shouldProcess) {
            void this.processAnalysis(result.analysis.id, result.dream).catch((error) => {
                this.logger.error(`Analysis failed for ${result.analysis.id}:`, error);
            });
        }

        return {
            analysisId: result.analysis.id,
            status: result.analysis.status
        };
    }

    /**
     * 请求解析 (SSE 模式)
     * 如果已完成，会立即通过 SSE 发送结果
     */
    async requestAnalysisWithSSE(userId: string, dto: RequestAnalysisDto) {
        const result = await this.requestAnalysis(userId, dto);

        // 如果已完成，直接发送完成事件
        if (result.status === 'completed') {
            const analysis = await this.getById(userId, result.analysisId);
            this.sseService.emitComplete(dto.dreamId, analysis);
        }

        return result;
    }

    /**
     * 处理解析（异步）
     */
    private async processAnalysis(analysisId: string, dream: any) {
        const startTime = Date.now();
        const dreamId = dream.id;

        try {
            // 发送开始事件
            this.sseService.emitStart(dreamId);

            // 构建 Prompt
            this.sseService.emitProgress(dreamId, '正在分析梦境内容...');
            const prompt = this.promptService.buildAnalysisPrompt({
                content: dream.content,
                tags: dream.tags ? JSON.parse(dream.tags) : [],
                emotion: dream.emotion
            });

            // 调用 AI
            this.sseService.emitProgress(dreamId, '系统正在深度解读...');
            const aiResponse = await this.aiService.chat(prompt);

            // 解析 AI 响应
            this.sseService.emitProgress(dreamId, '正在生成解析报告...');
            const parsed = this.parseAiResponse(aiResponse);

            const latency = Date.now() - startTime;

            // 更新解析结果（将 scoreReason 合并到 fortuneTips 中存储）
            const fortuneTipsWithReason = {
                ...parsed.fortuneTips,
                scoreReason: parsed.scoreReason || '综合梦境意象分析得出'
            };

            const analysis = await this.prisma.$transaction(async (tx) => {
                // 与请求和编辑保持相同锁顺序，避免解析完成时覆盖软删除。
                const lockedDream = await tx.dream.updateMany({
                    where: { id: dreamId, userId: dream.userId, status: { not: 'deleted' } },
                    data: { updatedAt: new Date() }
                });
                if (lockedDream.count !== 1) {
                    throw new ConflictException('梦境不存在或已删除');
                }

                const claimed = await tx.analysis.updateMany({
                    where: { id: analysisId, status: 'processing' },
                    data: { updatedAt: new Date() }
                });
                if (claimed.count !== 1) {
                    throw new ConflictException('解析任务已结束，请刷新后重试');
                }

                const current = await tx.analysis.findUnique({
                    where: { id: analysisId },
                    select: { id: true, userId: true, status: true, dreamId: true }
                });
                if (!current || current.status !== 'processing') {
                    throw new ConflictException('解析任务已结束，请刷新后重试');
                }

                const currentDream = await tx.dream.findUnique({
                    where: { id: current.dreamId },
                    select: {
                        status: true,
                        content: true,
                        originalContent: true,
                        tags: true,
                        emotion: true,
                        currentVersionId: true
                    }
                });
                if (
                    !currentDream ||
                    currentDream.status === 'deleted' ||
                    currentDream.content !== dream.content ||
                    currentDream.originalContent !== dream.originalContent ||
                    currentDream.tags !== dream.tags ||
                    currentDream.emotion !== dream.emotion ||
                    currentDream.currentVersionId !== dream.currentVersionId
                ) {
                    throw new ConflictException('梦境内容已变化，请重新发起解析');
                }

                await tx.task.create({
                    data: {
                        userId: current.userId,
                        dreamId: current.dreamId,
                        type: parsed.task.type,
                        content: parsed.task.content,
                        rewardPoints: 10,
                        expireAt: (() => {
                            const expireAt = new Date();
                            expireAt.setHours(23, 59, 59, 999);
                            return expireAt;
                        })()
                    }
                });
                await tx.dream.update({ where: { id: current.dreamId }, data: { status: 'analyzed' } });
                return tx.analysis.update({
                    where: { id: analysisId },
                    data: {
                        status: 'completed',
                        theme: parsed.theme,
                        interpretation: parsed.interpretation,
                        fortuneScore: parsed.fortuneScore,
                        fortuneTips: JSON.stringify(fortuneTipsWithReason),
                        aiModel: 'qwen-turbo',
                        latency
                    }
                });
            });

            // 获取完整结果并发送完成事件
            const fullResult = await this.getById(analysis.userId, analysisId);
            this.sseService.emitComplete(dreamId, fullResult);
        } catch (error) {
            this.logger.error(`Analysis processing failed:`, error);

            // 标记失败
            const failed = await this.prisma.analysis.updateMany({
                where: { id: analysisId, status: 'processing' },
                data: { status: 'failed' }
            });

            // 发送错误事件
            if (failed.count === 1) {
                this.sseService.emitError(dreamId, '智能解析失败，请重试');
            }
        }
    }

    /**
     * 获取解析结果
     */
    async getById(userId: string, analysisId: string) {
        const analysis = await this.prisma.analysis.findUnique({
            where: { id: analysisId },
            include: {
                dream: {
                    include: { task: true }
                }
            }
        });

        if (!analysis) {
            throw new NotFoundException('解析结果不存在');
        }

        if (analysis.userId !== userId) {
            throw new ForbiddenException('无权访问该解析结果');
        }

        return {
            id: analysis.id,
            dreamId: analysis.dreamId,
            status: analysis.status,
            theme: analysis.theme,
            interpretation: analysis.interpretation,
            fortuneScore: analysis.fortuneScore,
            fortuneTips: analysis.fortuneTips ? JSON.parse(analysis.fortuneTips) : null,
            task: analysis.dream.task
                ? {
                      id: analysis.dream.task.id,
                      type: analysis.dream.task.type,
                      content: analysis.dream.task.content,
                      rewardPoints: analysis.dream.task.rewardPoints
                  }
                : null,
            disclaimer: '本解析仅供娱乐参考，不构成任何专业建议',
            createdAt: analysis.createdAt.toISOString()
        };
    }

    /**
     * 重新解析
     */
    async retry(userId: string, dreamId: string) {
        const COST_POINTS = 50;
        const result = await this.prisma.$transaction(async (tx) => {
            const locked = await tx.dream.updateMany({
                where: { id: dreamId, userId, status: { not: 'deleted' } },
                data: { updatedAt: new Date(), status: 'pending' }
            });
            if (locked.count !== 1) {
                const dream = await tx.dream.findUnique({ where: { id: dreamId } });
                if (!dream || dream.status === 'deleted') throw new NotFoundException('梦境不存在');
                throw new ForbiddenException('无权访问该梦境');
            }

            const dream = await tx.dream.findUnique({ where: { id: dreamId } });
            if (!dream) throw new NotFoundException('梦境不存在');
            const existingAnalysis = await tx.analysis.findUnique({ where: { dreamId } });
            if (existingAnalysis?.status === 'processing') {
                throw new ConflictException('解析正在进行中，请勿重复操作');
            }

            const charged = await tx.user.updateMany({
                where: { id: userId, luckyPoints: { gte: COST_POINTS } },
                data: { luckyPoints: { decrement: COST_POINTS } }
            });
            if (charged.count !== 1) {
                throw new BadRequestException({ code: 30001, message: `积分不足，需要${COST_POINTS}积分` });
            }

            const user = await tx.user.findUnique({ where: { id: userId }, select: { luckyPoints: true } });
            const remainingPoints = user?.luckyPoints ?? 0;
            await tx.pointRecord.create({
                data: {
                    userId,
                    type: 'consume',
                    amount: COST_POINTS,
                    balance: remainingPoints,
                    source: 'dream_reanalyze',
                    sourceId: dreamId,
                    description: `重新解析梦境 -${COST_POINTS}`
                }
            });
            await tx.analysis.deleteMany({ where: { dreamId } });
            await tx.task.deleteMany({ where: { dreamId } });
            const analysis = await tx.analysis.create({ data: { dreamId, userId, status: 'processing' } });
            return { dream, analysis, remainingPoints };
        });

        void this.processAnalysis(result.analysis.id, result.dream).catch((error) => {
            this.logger.error(`Analysis failed for ${result.analysis.id}:`, error);
        });
        return {
            analysisId: result.analysis.id,
            status: result.analysis.status,
            pointsConsumed: COST_POINTS,
            remainingPoints: result.remainingPoints
        };
    }

    /**
     * 解析AI响应
     */
    private parseAiResponse(response: string): ParsedAnalysis {
        try {
            // 1. 移除 Markdown 代码块
            let cleanedResponse = response.trim();
            if (cleanedResponse.includes('```')) {
                const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    cleanedResponse = codeBlockMatch[1].trim();
                }
            }

            // 2. 提取 JSON 对象
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                this.logger.warn('AI response does not contain JSON object');
                this.logger.debug(`Raw response: ${response.substring(0, 200)}...`);
                throw new Error('No JSON found');
            }

            // 3. 解析 JSON
            const parsed = JSON.parse(jsonMatch[0]) as Partial<ParsedAnalysis>;

            // 4. 验证必需字段
            const requiredFields = ['theme', 'interpretation', 'fortuneScore', 'fortuneTips', 'task'];
            const missingFields = requiredFields.filter((field) => !(field in parsed));

            if (missingFields.length > 0) {
                this.logger.warn(`AI response missing required fields: ${missingFields.join(', ')}`);
                this.logger.debug(`Parsed JSON: ${JSON.stringify(parsed)}`);
                throw new Error(`Missing fields: ${missingFields.join(', ')}`);
            }

            // 5. 验证并规范化 fortuneScore
            if (typeof parsed.fortuneScore !== 'number' || parsed.fortuneScore < 60 || parsed.fortuneScore > 100) {
                this.logger.warn(`Invalid fortuneScore: ${parsed.fortuneScore}, clamping to 60-95`);
                parsed.fortuneScore = Math.max(60, Math.min(95, parsed.fortuneScore || 75));
            }

            return parsed as ParsedAnalysis;
        } catch (error) {
            // 降级处理：生成默认响应
            this.logger.error('AI response parsing failed, using fallback analysis', error);
            this.logger.debug(`Failed response: ${response}`);
            return this.generateFallbackAnalysis();
        }
    }

    /**
     * 生成降级响应
     */
    private generateFallbackAnalysis(): ParsedAnalysis {
        // 生成 80-95 之间的随机评分
        const baseScore = 80;
        const randomBonus = Math.floor(Math.random() * 16);
        const fortuneScore = baseScore + randomBonus;

        return {
            theme: '心灵的探索与成长',
            interpretation:
                '这个梦境反映了你内心深处的思考和情感。梦境是潜意识的窗口，通过它我们可以更好地了解自己。建议在日常生活中多关注自己的内心感受，保持积极乐观的心态。',
            fortuneScore,
            scoreReason: '梦境意象丰富，整体呈现平和积极的基调',
            fortuneTips: {
                career: '保持专注，稳步前进',
                love: '真诚待人，收获美好',
                health: '注意休息，均衡饮食'
            },
            task: {
                type: 'action',
                content: '今天对一个朋友说声谢谢'
            }
        };
    }
}

interface ParsedAnalysis {
    theme: string;
    interpretation: string;
    fortuneScore: number;
    scoreReason?: string;
    fortuneTips: {
        career: string;
        love: string;
        health: string;
    };
    task: {
        type: string;
        content: string;
    };
}
