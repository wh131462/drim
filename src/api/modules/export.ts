/**
 * 数据导出 API
 */
import { get } from '../request';

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

export const exportApi = {
    /**
     * 预览导出数据
     */
    preview(): Promise<ExportPreview> {
        return get<ExportPreview>('/export/dreams/preview');
    },

    /**
     * 获取导出数据（JSON 格式）
     */
    getData(): Promise<string> {
        return get<string>('/export/dreams', { format: 'json' });
    },

    /**
     * 获取导出文件下载地址
     */
    getDownloadUrl(): string {
        const token = uni.getStorageSync('token');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/v1';
        return `${baseUrl}/export/dreams?token=${token}`;
    }
};
