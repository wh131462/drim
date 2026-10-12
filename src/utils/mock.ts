/**
 * Mock 数据模块
 * 用于开发环境测试
 */

import type { User, UserStats } from '@/types/user';
import type { Dream, DreamDetail } from '@/types/dream';
import type { Analysis as AnalysisResult } from '@/types/analysis';
import type { VipInfo } from '@/types/vip';

// Mock 用户数据
export const mockUser: User = {
    id: 'mock_user_001',
    openId: 'mock_openid',
    nickname: '梦游者',
    avatar: '',
    gender: 0,
    isVip: false,
    vipExpireAt: null,
    luckyPoints: 150,
    consecutiveDays: 3,
    totalDreams: 12,
    totalTasks: 8,
    createdAt: '2024-01-01T00:00:00.000Z'
};

export const mockUserStats: UserStats = {
    totalDreams: 12,
    totalAnalysis: 12,
    totalTasks: 8,
    taskCompletionRate: 0.75,
    currentStreak: 3,
    longestStreak: 3,
    luckyPoints: 150,
    achievements: [
        { id: 'first_dream', name: '梦境初探', icon: '🌟', unlockedAt: '2024-01-01' },
        { id: 'streak_3', name: '初露锋芒', icon: '🔥', unlockedAt: '2024-01-03' }
    ]
};

// Mock 梦境数据
export const mockDreams: Dream[] = [
    {
        id: 'dream_001',
        content: '我梦见自己在一片星空下飞翔，周围是无尽的星星，感觉非常自由和平静。突然我看到远处有一座发光的城堡...',
        tags: ['flying', 'star'],
        emotion: 'happy',
        status: 'analyzed',
        hasAnalysis: true,
        analysisId: 'analysis_001',
        fortuneScore: 85,
        createdAt: new Date().toISOString()
    },
    {
        id: 'dream_002',
        content: '我在一个陌生的城市迷路了，周围的建筑都很高大，街道上没有人。我一直在寻找回家的路...',
        tags: ['city', 'lost'],
        emotion: 'fear',
        status: 'analyzed',
        hasAnalysis: true,
        analysisId: 'analysis_002',
        fortuneScore: 65,
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'dream_003',
        content: '我梦见和家人一起在海边度假，阳光很温暖，海水很蓝。我们一起堆沙堡，笑声不断...',
        tags: ['family', 'beach'],
        emotion: 'happy',
        status: 'pending',
        hasAnalysis: false,
        createdAt: new Date(Date.now() - 172800000).toISOString()
    }
];

// Mock 梦境详情
export const mockDreamDetail: DreamDetail = {
    id: 'dream_001',
    content:
        '我梦见自己在一片星空下飞翔，周围是无尽的星星，感觉非常自由和平静。突然我看到远处有一座发光的城堡，我飞了过去，城堡的门自动打开了。里面是一片金色的光芒，非常温暖。',
    tags: ['flying', 'star', 'castle'],
    emotion: 'happy',
    status: 'analyzed',
    hasAnalysis: true,
    createdAt: new Date().toISOString(),
    analysis: {
        id: 'analysis_001',
        dreamId: 'dream_001',
        status: 'completed',
        theme: '追寻自由与梦想',
        interpretation:
            '这个梦境反映了你内心对自由的渴望和对美好未来的期待。飞翔象征着你想要突破现实束缚的愿望，而发光的城堡则代表你心中的理想目标。金色的光芒暗示着你对成功和幸福的向往。这是一个非常积极正面的梦，说明你目前的心态很好，对未来充满希望。',
        fortuneScore: 85,
        fortuneTips: {
            career: '今天适合推进重要项目，你的创造力会得到认可',
            love: '单身者可能会遇到心仪的对象，已有伴侣的感情升温',
            health: '精力充沛，适合进行户外运动'
        },
        task: {
            id: 'task_001',
            type: 'action',
            content: '今天给一位很久没联系的朋友发一条问候消息',
            rewardPoints: 10
        },
        disclaimer: '内容仅供自我探索参考，不构成医疗建议。',
        createdAt: new Date().toISOString()
    }
};

// Mock 解析结果
export const mockAnalysisResult: AnalysisResult = {
    id: 'analysis_001',
    dreamId: 'dream_001',
    status: 'completed',
    theme: '追寻自由与梦想',
    interpretation:
        '这个梦境反映了你内心对自由的渴望和对美好未来的期待。飞翔象征着你想要突破现实束缚的愿望，而发光的城堡则代表你心中的理想目标。',
    fortuneScore: 85,
    fortuneTips: {
        career: '今天适合推进重要项目，你的创造力会得到认可',
        love: '单身者可能会遇到心仪的对象，已有伴侣的感情升温',
        health: '精力充沛，适合进行户外运动'
    },
    task: {
        id: 'task_001',
        type: 'action',
        content: '今天给一位很久没联系的朋友发一条问候消息',
        rewardPoints: 10
    },
    disclaimer: '内容仅供自我探索参考，不构成医疗建议。',
    createdAt: new Date().toISOString()
};

// Mock VIP 信息
export const mockVipInfo: VipInfo = {
    isVip: false,
    expireAt: null,
    benefits: [
        { key: 'no_ad', name: '免广告查看解析', enabled: false },
        { key: 'unlimited_history', name: '无限历史记录', enabled: false },
        { key: 'free_reanalyze', name: '免费重新解析', enabled: false },
        { key: 'premium_themes', name: '高级解析主题', enabled: false }
    ],
    plans: [
        { id: 'monthly', name: '月度会员', price: 9.9, originalPrice: 19.9 },
        { id: 'quarterly', name: '季度会员', price: 25.9, originalPrice: 59.7 },
        { id: 'yearly', name: '年度会员', price: 68.0, originalPrice: 238.8 }
    ]
};

// Mock 日历数据
export function getMockCalendarData(
    year: number,
    month: number
): Record<string, { hasDream: boolean; dreamCount: number }> {
    const data: Record<string, { hasDream: boolean; dreamCount: number }> = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    // 随机生成一些记梦日期
    const dreamDays = [3, 5, 8, 12, 15, 18, 20, 22, 25, 28].filter((d) => d <= daysInMonth);

    dreamDays.forEach((day) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        data[dateStr] = {
            hasDream: true,
            dreamCount: Math.floor(Math.random() * 2) + 1
        };
    });

    return data;
}

/**
 * 延迟函数，模拟网络请求
 */
export function delay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock API 响应包装
 */
export async function mockResponse<T>(data: T, delayMs: number = 300): Promise<T> {
    await delay(delayMs);
    return data;
}
