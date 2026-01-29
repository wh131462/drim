/**
 * Pinia Store 统一导出
 */

import { createPinia } from 'pinia';

export const pinia = createPinia();

export { useUserStore } from './modules/user';
export { useDreamStore } from './modules/dream';
export { useSettingsStore } from './modules/settings';
export { useAchievementStore } from './modules/achievement';
