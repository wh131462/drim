/**
 * 成就相关类型定义
 */

// 成就条件类型
export type AchievementConditionType =
    | 'dream_count' // 记梦总数
    | 'consecutive_days' // 连续记梦天数
    | 'task_count' // 完成任务数
    | 'analysis_count' // 解析总数
    | 'polish_count' // 润色次数
    | 'share_count' // 分享次数
    | 'explore_view_count' // 探索浏览次数
    | 'lucky_points'; // 幸运值达到

// 成就信息
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    conditionType: AchievementConditionType;
    conditionValue: number;
    rewardPoints: number;
    unlocked: boolean;
    unlockedAt?: string;
    progress?: number;
    progressPercent?: number;
}

// 用户成就进度
export interface UserAchievementProgress {
    level: number;
    levelTitle: string;
    currentExp: number;
    nextLevelExp: number;
    unlockedCount: number;
    totalCount: number;
    achievements: Achievement[];
}

// 成就解锁通知
export interface AchievementUnlocked {
    id: string;
    name: string;
    description: string;
    icon: string;
    rewardPoints: number;
    unlockedAt: string;
}
