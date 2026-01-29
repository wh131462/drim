/**
 * 成就状态管理
 */

import { defineStore } from 'pinia';
import { achievementApi } from '@/api';
import type { Achievement } from '@/types/achievement';

interface AchievementState {
    achievements: Achievement[];
    level: number;
    levelTitle: string;
    currentExp: number;
    nextLevelExp: number;
    loading: boolean;
    loaded: boolean;
}

export const useAchievementStore = defineStore('achievement', {
    state: (): AchievementState => ({
        achievements: [],
        level: 1,
        levelTitle: '梦境新手',
        currentExp: 0,
        nextLevelExp: 100,
        loading: false,
        loaded: false
    }),

    getters: {
        unlockedCount: (state): number => {
            return state.achievements.filter((a) => a.unlocked).length;
        },
        totalCount: (state): number => {
            return state.achievements.length;
        },
        progressPercent: (state): number => {
            if (state.nextLevelExp === 0) return 0;
            return Math.round((state.currentExp / state.nextLevelExp) * 100);
        }
    },

    actions: {
        /**
         * 智能加载成就（已加载则跳过）
         */
        async ensureAchievements(): Promise<void> {
            if (this.loaded) return;
            await this.fetchAchievements();
        },

        /**
         * 强制获取成就数据
         */
        async fetchAchievements(): Promise<void> {
            if (this.loading) return;

            this.loading = true;
            try {
                const data = await achievementApi.getAchievementsWithProgress();
                this.achievements = data.achievements;
                this.level = data.level;
                this.levelTitle = data.levelTitle;
                this.currentExp = data.currentExp;
                this.nextLevelExp = data.nextLevelExp;
                this.loaded = true;
            } catch (error) {
                console.error('加载成就数据失败:', error);
            } finally {
                this.loading = false;
            }
        }
    }
});
