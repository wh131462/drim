import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AiService } from '@/shared/ai/ai.service';
import { PromptService } from './prompt.service';
import { AnalysisSSEService } from './analysis-sse.service';
import { DreamService } from '../dream/dream.service';
import { TaskService } from '../task/task.service';
import { RequestAnalysisDto } from './dto/request-analysis.dto';

@Injectable()
export class AnalysisService {
    private readonly logger = new Logger(AnalysisService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
        private readonly promptService: PromptService,
        private readonly sseService: AnalysisSSEService,
        private readonly dreamService: DreamService,
        private readonly taskService: TaskService
    ) {}

    /**
     * 请求解析
     */
    async requestAnalysis(userId: string, dto: RequestAnalysisDto) {
        const dream = await this.dreamService.getDreamById(dto.dreamId);

        if (!dream) {
            throw new NotFoundException('梦境不存在');
        }

        if (dream.userId !== userId) {
            throw new ForbiddenException('无权访问该梦境');
        }

        // 检查是否已有解析
        const existingAnalysis = await this.prisma.analysis.findUnique({
            where: { dreamId: dto.dreamId }
        });

        if (existingAnalysis && existingAnalysis.status === 'completed') {
            return {
                analysisId: existingAnalysis.id,
                status: existingAnalysis.status
            };
        }

        // 创建或更新解析记录
        let analysis;
        if (existingAnalysis) {
            analysis = await this.prisma.analysis.update({
                where: { id: existingAnalysis.id },
                data: { status: 'processing' }
            });
        } else {
            analysis = await this.prisma.analysis.create({
                data: {
                    dreamId: dto.dreamId,
                    userId,
                    status: 'processing'
                }
            });
        }

        // 异步执行解析
        this.processAnalysis(analysis.id, dream).catch((error) => {
            this.logger.error(`Analysis failed for ${analysis.id}:`, error);
        });

        return {
            analysisId: analysis.id,
            status: 'processing'
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
            this.sseService.emitProgress(dreamId, 'AI 正在深度解读...');
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

            const analysis = await this.prisma.analysis.update({
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

            // 创建改运任务
            await this.taskService.createFromAnalysis(analysis.userId, dream.id, parsed.task);

            // 更新梦境状态
            await this.dreamService.updateStatus(dream.id, 'analyzed');

            // 获取完整结果并发送完成事件
            const fullResult = await this.getById(analysis.userId, analysisId);
            this.sseService.emitComplete(dreamId, fullResult);
        } catch (error) {
            this.logger.error(`Analysis processing failed:`, error);

            // 标记失败
            await this.prisma.analysis.update({
                where: { id: analysisId },
                data: { status: 'failed' }
            });

            // 发送错误事件
            this.sseService.emitError(dreamId, 'AI 解析失败，请重试');
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

        // 检查用户积分
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.luckyPoints < COST_POINTS) {
            throw new BadRequestException({
                code: 30001,
                message: `积分不足，需要${COST_POINTS}积分`
            });
        }

        const dream = await this.dreamService.getDreamById(dreamId);

        if (!dream || dream.userId !== userId) {
            throw new NotFoundException('梦境不存在');
        }

        const newBalance = user.luckyPoints - COST_POINTS;

        // 使用事务确保数据一致性
        await this.prisma.$transaction([
            // 扣除积分
            this.prisma.user.update({
                where: { id: userId },
                data: { luckyPoints: newBalance }
            }),
            // 记录积分消耗
            this.prisma.pointRecord.create({
                data: {
                    userId,
                    type: 'consume',
                    amount: COST_POINTS,
                    balance: newBalance,
                    source: 'dream_reanalyze',
                    sourceId: dreamId,
                    description: `重新解析梦境 -${COST_POINTS}`
                }
            }),
            // 删除旧解析
            this.prisma.analysis.deleteMany({
                where: { dreamId }
            }),
            // 删除旧任务
            this.prisma.task.deleteMany({
                where: { dreamId }
            })
        ]);

        // 重新请求解析
        const result = await this.requestAnalysis(userId, { dreamId });

        return {
            ...result,
            pointsConsumed: COST_POINTS,
            remainingPoints: newBalance
        };
    }

    /**
     * 解析AI响应
     */
    private parseAiResponse(response: string): ParsedAnalysis {
        try {
            // 尝试提取JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found');
        } catch {
            // 降级处理：生成默认响应
            return this.generateFallbackAnalysis();
        }
    }

    /**
     * 生成降级响应
     */
    private generateFallbackAnalysis(): ParsedAnalysis {
        // 生成 70-82 之间的随机评分
        const baseScore = 70;
        const randomBonus = Math.floor(Math.random() * 13);
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
