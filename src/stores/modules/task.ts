/**
 * 任务状态管理
 */

import { defineStore } from 'pinia';
import { taskApi } from '@/api';
import type { Task } from '@/api/modules/task';

// 缓存有效期（毫秒）
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

interface TaskState {
    todayTask: Task | null;
    completed: boolean;
    rewardClaimed: boolean;
    // 缓存时间戳
    fetchedAt: number;
}

export const useTaskStore = defineStore('task', {
    state: (): TaskState => ({
        todayTask: null,
        completed: false,
        rewardClaimed: false,
        fetchedAt: 0
    }),

    getters: {
        /**
         * 是否有可用任务
         */
        hasTask: (state): boolean => {
            return state.todayTask !== null && state.todayTask.status !== 'expired';
        },

        /**
         * 任务是否已完成
         */
        isCompleted: (state): boolean => {
            return state.todayTask?.status === 'completed' || state.completed;
        }
    },

    actions: {
        /**
         * 获取今日任务
         */
        async fetchTodayTask(): Promise<void> {
            try {
                const response = await taskApi.getTodayTask();
                if (response.task && response.task.status !== 'expired') {
                    this.todayTask = response.task;
                    this.completed = response.completed;
                    this.rewardClaimed = response.rewardClaimed;
                } else {
                    this.todayTask = null;
                    this.completed = false;
                    this.rewardClaimed = false;
                }
                this.fetchedAt = Date.now();
            } catch (error) {
                console.error('加载今日任务失败:', error);
                this.todayTask = null;
                this.completed = false;
                this.rewardClaimed = false;
            }
        },

        /**
         * 智能加载：有缓存则跳过，无数据或过期则加载
         */
        async ensureTodayTask(): Promise<void> {
            const now = Date.now();
            const isExpired = now - this.fetchedAt > CACHE_TTL;

            // 无数据时加载
            if (this.fetchedAt === 0) {
                await this.fetchTodayTask();
                return;
            }

            // 有数据但过期，静默后台刷新
            if (isExpired) {
                this.fetchTodayTask();
            }
        },

        /**
         * 完成任务
         */
        async completeTask(): Promise<{ success: boolean; totalPoints: number }> {
            if (!this.todayTask) {
                throw new Error('没有可用任务');
            }

            const response = await taskApi.completeTask(this.todayTask.id);

            if (response.success) {
                this.completed = true;
                this.todayTask.status = 'completed';
            }

            return {
                success: response.success,
                totalPoints: response.totalPoints
            };
        },

        /**
         * 翻倍奖励
         */
        async doubleReward(adToken: string): Promise<{ totalPoints: number }> {
            if (!this.todayTask) {
                throw new Error('没有可用任务');
            }

            const response = await taskApi.doubleReward(this.todayTask.id, adToken);

            if (response.success) {
                this.todayTask.isDoubleReward = true;
                this.rewardClaimed = true;
            }

            return {
                totalPoints: response.totalPoints
            };
        },

        /**
         * 重置状态
         */
        reset(): void {
            this.todayTask = null;
            this.completed = false;
            this.rewardClaimed = false;
            this.fetchedAt = 0;
        }
    }
});
