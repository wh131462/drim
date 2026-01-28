/**
 * 任务相关 API
 */

import { get, post } from '../request';

export interface Task {
    id: string;
    type: string;
    content: string;
    rewardPoints: number;
    status: 'pending' | 'completed' | 'expired';
    isDoubleReward: boolean;
    expireAt: string;
}

export interface TodayTaskResponse {
    task: Task | null;
    completed: boolean;
    rewardClaimed: boolean;
}

export interface CompleteTaskResponse {
    success: boolean;
    points: number;
    totalPoints: number;
    isDoubleReward: boolean;
}

export const taskApi = {
    /**
     * 获取今日任务
     */
    getTodayTask(): Promise<TodayTaskResponse> {
        return get<TodayTaskResponse>('/task/today');
    },

    /**
     * 完成任务
     */
    completeTask(taskId: string): Promise<CompleteTaskResponse> {
        return post<CompleteTaskResponse>(`/task/${taskId}/complete`);
    },

    /**
     * 看广告翻倍奖励
     */
    doubleReward(taskId: string, adToken: string): Promise<CompleteTaskResponse> {
        return post<CompleteTaskResponse>(`/task/${taskId}/double`, { adToken });
    }
};
