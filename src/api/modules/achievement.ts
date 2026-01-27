/**
 * 成就相关 API
 */

import { get } from '../request';
import type { Achievement, UserAchievementProgress } from '@/types/achievement';

export const achievementApi = {
    /**
     * 获取成就列表及用户进度
     */
    getAchievementsWithProgress(): Promise<UserAchievementProgress> {
        return get<UserAchievementProgress>('/achievement/list');
    },

    /**
     * 获取用户已解锁的成就
     */
    getUserAchievements(): Promise<Achievement[]> {
        return get<Achievement[]>('/achievement/user');
    }
};
