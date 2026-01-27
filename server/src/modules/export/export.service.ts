import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

interface ExportedDream {
    id: string;
    content: string;
    originalContent: string;
    tags: string[];
    emotion: string | null;
    isPublic: boolean;
    createdAt: string;
    analysis: {
        theme: string | null;
        interpretation: string | null;
        fortuneScore: number | null;
        fortuneTips: Record<string, string> | null;
    } | null;
    task: {
        type: string;
        content: string;
        status: string;
        completedAt: string | null;
    } | null;
    versions: {
        type: string;
        content: string;
        versionNumber: number;
        createdAt: string;
    }[];
}

interface ExportData {
    exportedAt: string;
    user: {
        id: string;
        nickname: string;
        consecutiveDays: number;
        totalDreams: number;
        luckyPoints: number;
    };
    statistics: {
        totalDreams: number;
        totalAnalyses: number;
        completedTasks: number;
        dateRange: { from: string; to: string } | null;
    };
    dreams: ExportedDream[];
}

export interface ExportPreview {
    exportedAt: string;
    user: {
        id: string;
        nickname: string;
        consecutiveDays: number;
        totalDreams: number;
        luckyPoints: number;
    };
    statistics: {
        totalDreams: number;
        totalAnalyses: number;
        completedTasks: number;
        dateRange: { from: string; to: string } | null;
    };
    dreams: {
        id: string;
        contentPreview: string;
        createdAt: string;
        hasAnalysis: boolean;
        hasTask: boolean;
        versionsCount: number;
    }[];
}

@Injectable()
export class ExportService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 导出用户所有数据
     */
    async exportUserData(userId: string): Promise<ExportData> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const dreams = await this.prisma.dream.findMany({
            where: {
                userId,
                status: { not: 'deleted' }
            },
            include: {
                analysis: true,
                task: true,
                versions: {
                    orderBy: { versionNumber: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const statistics = {
            totalDreams: dreams.length,
            totalAnalyses: dreams.filter((d) => d.analysis?.status === 'completed').length,
            completedTasks: dreams.filter((d) => d.task?.status === 'completed').length,
            dateRange:
                dreams.length > 0
                    ? {
                          from: dreams[dreams.length - 1].createdAt.toISOString(),
                          to: dreams[0].createdAt.toISOString()
                      }
                    : null
        };

        const formattedDreams: ExportedDream[] = dreams.map((dream) => ({
            id: dream.id,
            content: dream.content,
            originalContent: dream.originalContent,
            tags: dream.tags ? JSON.parse(dream.tags) : [],
            emotion: dream.emotion,
            isPublic: dream.isPublic,
            createdAt: dream.createdAt.toISOString(),
            analysis: dream.analysis
                ? {
                      theme: dream.analysis.theme,
                      interpretation: dream.analysis.interpretation,
                      fortuneScore: dream.analysis.fortuneScore,
                      fortuneTips: dream.analysis.fortuneTips ? JSON.parse(dream.analysis.fortuneTips) : null
                  }
                : null,
            task: dream.task
                ? {
                      type: dream.task.type,
                      content: dream.task.content,
                      status: dream.task.status,
                      completedAt: dream.task.completedAt?.toISOString() ?? null
                  }
                : null,
            versions: dream.versions.map((v) => ({
                type: v.type,
                content: v.content,
                versionNumber: v.versionNumber,
                createdAt: v.createdAt.toISOString()
            }))
        }));

        return {
            exportedAt: new Date().toISOString(),
            user: {
                id: user.id,
                nickname: user.nickname,
                consecutiveDays: user.consecutiveDays,
                totalDreams: user.totalDreams,
                luckyPoints: user.luckyPoints
            },
            statistics,
            dreams: formattedDreams
        };
    }

    /**
     * 预览导出数据
     */
    async previewExportData(userId: string): Promise<ExportPreview> {
        const data = await this.exportUserData(userId);

        return {
            ...data,
            dreams: data.dreams.map((d) => ({
                id: d.id,
                contentPreview: d.content.length > 50 ? d.content.substring(0, 50) + '...' : d.content,
                createdAt: d.createdAt,
                hasAnalysis: !!d.analysis,
                hasTask: !!d.task,
                versionsCount: d.versions.length
            }))
        };
    }
}
