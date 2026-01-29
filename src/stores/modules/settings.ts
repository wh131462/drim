/**
 * 设置状态管理
 */

import { defineStore } from 'pinia';
import { settingsApi } from '@/api/modules/settings';

interface NotificationSettings {
    enabled: boolean;
    reminderTime: string;
    subscriptionAccepted: boolean;
}

interface PrivacySettings {
    defaultDreamPublic: boolean;
    allowProfileView: boolean;
}

interface SettingsState {
    notification: NotificationSettings;
    privacy: PrivacySettings;
    loaded: boolean;
}

export const useSettingsStore = defineStore('settings', {
    state: (): SettingsState => ({
        notification: {
            enabled: false,
            reminderTime: '22:00',
            subscriptionAccepted: false
        },
        privacy: {
            defaultDreamPublic: false,
            allowProfileView: true
        },
        loaded: false
    }),

    getters: {
        defaultDreamPublic: (state): boolean => state.privacy.defaultDreamPublic,
        allowProfileView: (state): boolean => state.privacy.allowProfileView,
        notificationEnabled: (state): boolean => state.notification.enabled,
        reminderTime: (state): string => state.notification.reminderTime
    },

    actions: {
        /**
         * 加载设置（带缓存，已加载则跳过）
         */
        async ensureSettings(): Promise<void> {
            if (this.loaded) return;
            await this.fetchSettings();
        },

        /**
         * 强制获取设置
         */
        async fetchSettings(): Promise<void> {
            try {
                const settings = await settingsApi.getSettings();
                if (settings?.privacy) {
                    this.privacy = settings.privacy;
                }
                if (settings?.notification) {
                    this.notification = settings.notification;
                }
                this.loaded = true;
            } catch (error) {
                console.error('加载设置失败:', error);
                this.loaded = true;
            }
        },

        /**
         * 更新默认公开设置
         */
        async setDefaultDreamPublic(value: boolean): Promise<void> {
            await settingsApi.updateSettings({ defaultDreamPublic: value });
            this.privacy.defaultDreamPublic = value;
        },

        /**
         * 更新允许查看主页设置
         */
        async setAllowProfileView(value: boolean): Promise<void> {
            await settingsApi.updateSettings({ allowProfileView: value });
            this.privacy.allowProfileView = value;
        },

        /**
         * 更新通知开关
         */
        async setNotificationEnabled(value: boolean): Promise<void> {
            await settingsApi.updateSettings({ notificationEnabled: value });
            this.notification.enabled = value;
        },

        /**
         * 更新提醒时间
         */
        async setReminderTime(value: string): Promise<void> {
            await settingsApi.updateSettings({ reminderTime: value });
            this.notification.reminderTime = value;
        }
    }
});
