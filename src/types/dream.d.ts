/**
 * 梦境相关类型定义
 */

import type { Analysis } from './analysis';

export interface Dream {
    id: string;
    content: string;
    tags: string[];
    emotion: Emotion;
    status: DreamStatus;
    hasAnalysis: boolean;
    analysisId?: string;
    createdAt: string;
}

export interface DreamInput {
    content: string;
    tags?: string[];
    emotion?: Emotion;
}

export interface DreamDetail extends Dream {
    analysis?: Analysis;
}

export interface DreamListParams {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    tag?: string;
    emotion?: string;
    keyword?: string;
}

export interface DreamListResponse {
    list: Dream[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CalendarRecord {
    date: string;
    hasDream: boolean;
    dreamId: string | null;
}

export interface CalendarResponse {
    year: number;
    month: number;
    records: CalendarRecord[];
    consecutiveDays: number;
    monthTotal: number;
}

export type Emotion = 'happy' | 'fear' | 'confused' | 'sad';

export type DreamStatus = 'pending' | 'analyzed' | 'deleted';

export interface DreamTag {
    id: string;
    name: string;
    icon: string;
}

export interface EmotionOption {
    id: Emotion;
    name: string;
    icon: string;
}
