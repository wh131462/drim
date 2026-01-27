/**
 * 设置 API
 */
import { get, put } from '../request';

export interface UserSettings {
    notification: {
        enabled: boolean;
        reminderTime: string;
        subscriptionAccepted: boolean;
    };
    privacy: {
        defaultDreamPublic: boolean;
        allowProfileView: boolean;
    };
}

export interface UpdateSettingsParams {
    notificationEnabled?: boolean;
    reminderTime?: string;
    defaultDreamPublic?: boolean;
    allowProfileView?: boolean;
}

export const settingsApi = {
    /**
     * 获取用户设置
     */
    getSettings(): Promise<UserSettings> {
        return get<UserSettings>('/settings');
    },

    /**
     * 更新用户设置
     */
    updateSettings(data: UpdateSettingsParams): Promise<UserSettings> {
        return put<UserSettings>('/settings', data as Record<string, unknown>);
    },

    /**
     * 更新订阅消息授权状态
     */
    updateSubscription(accepted: boolean): Promise<{ success: boolean }> {
        return put('/settings/subscription', { accepted });
    }
};
