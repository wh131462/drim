import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AiService } from '@/shared/ai/ai.service';
import { PromptService } from './prompt.service';
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
    private readonly dreamService: DreamService,
    private readonly taskService: TaskService,
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
      where: { dreamId: dto.dreamId },
    });

    if (existingAnalysis && existingAnalysis.status === 'completed') {
      return {
        analysisId: existingAnalysis.id,
        status: existingAnalysis.status,
      };
    }

    // 创建或更新解析记录
    let analysis;
    if (existingAnalysis) {
      analysis = await this.prisma.analysis.update({
        where: { id: existingAnalysis.id },
        data: { status: 'processing' },
      });
    } else {
      analysis = await this.prisma.analysis.create({
        data: {
          dreamId: dto.dreamId,
          userId,
          status: 'processing',
        },
      });
    }

    // 异步执行解析
    this.processAnalysis(analysis.id, dream).catch((error) => {
      this.logger.error(`Analysis failed for ${analysis.id}:`, error);
    });

    return {
      analysisId: analysis.id,
      status: 'processing',
    };
  }

  /**
   * 处理解析（异步）
   */
  private async processAnalysis(analysisId: string, dream: any) {
    const startTime = Date.now();

    try {
      // 构建Prompt
      const prompt = this.promptService.buildAnalysisPrompt({
        content: dream.content,
        tags: dream.tags ? JSON.parse(dream.tags) : [],
        emotion: dream.emotion,
      });

      // 调用AI
      const aiResponse = await this.aiService.chat(prompt);

      // 解析AI响应
      const parsed = this.parseAiResponse(aiResponse);

      const latency = Date.now() - startTime;

      // 更新解析结果
      const analysis = await this.prisma.analysis.update({
        where: { id: analysisId },
        data: {
          status: 'completed',
          theme: parsed.theme,
          interpretation: parsed.interpretation,
          fortuneScore: parsed.fortuneScore,
          fortuneTips: JSON.stringify(parsed.fortuneTips),
          aiModel: 'qwen-turbo',
          latency,
        },
      });

      // 创建改运任务
      await this.taskService.createFromAnalysis(
        analysis.userId,
        dream.id,
        parsed.task,
      );

      // 更新梦境状态
      await this.dreamService.updateStatus(dream.id, 'analyzed');
    } catch (error) {
      this.logger.error(`Analysis processing failed:`, error);

      // 标记失败
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'failed' },
      });
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
          include: { task: true },
        },
      },
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
      fortuneTips: analysis.fortuneTips
        ? JSON.parse(analysis.fortuneTips)
        : null,
      task: analysis.dream.task
        ? {
            id: analysis.dream.task.id,
            type: analysis.dream.task.type,
            content: analysis.dream.task.content,
            rewardPoints: analysis.dream.task.rewardPoints,
          }
        : null,
      disclaimer: '本解析仅供娱乐参考，不构成任何专业建议',
      createdAt: analysis.createdAt.toISOString(),
    };
  }

  /**
   * 重新解析
   */
  async retry(userId: string, dreamId: string) {
    // 检查用户积分
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.luckyPoints < 50) {
      throw new BadRequestException({
        code: 30001,
        message: '积分不足，需要50积分',
      });
    }

    const dream = await this.dreamService.getDreamById(dreamId);

    if (!dream || dream.userId !== userId) {
      throw new NotFoundException('梦境不存在');
    }

    // 扣除积分
    await this.prisma.user.update({
      where: { id: userId },
      data: { luckyPoints: { decrement: 50 } },
    });

    // 记录积分消耗
    await this.prisma.pointRecord.create({
      data: {
        userId,
        type: 'consume',
        amount: 50,
        balance: user.luckyPoints - 50,
        source: 'dream_reanalyze',
        sourceId: dreamId,
        description: '重新解析梦境 -50',
      },
    });

    // 删除旧解析
    await this.prisma.analysis.deleteMany({
      where: { dreamId },
    });

    // 删除旧任务
    await this.prisma.task.deleteMany({
      where: { dreamId },
    });

    // 重新请求解析
    const result = await this.requestAnalysis(userId, { dreamId });

    return {
      ...result,
      pointsConsumed: 50,
      remainingPoints: user.luckyPoints - 50,
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
    return {
      theme: '心灵的探索与成长',
      interpretation:
        '这个梦境反映了你内心深处的思考和情感。梦境是潜意识的窗口，通过它我们可以更好地了解自己。建议在日常生活中多关注自己的内心感受，保持积极乐观的心态。',
      fortuneScore: 75,
      fortuneTips: {
        career: '保持专注，稳步前进',
        love: '真诚待人，收获美好',
        health: '注意休息，均衡饮食',
      },
      task: {
        type: 'action',
        content: '今天对一个朋友说声谢谢',
      },
    };
  }
}

interface ParsedAnalysis {
  theme: string;
  interpretation: string;
  fortuneScore: number;
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
