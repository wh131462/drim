import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * 获取用户设置
     */
    async getSettings(userId: string) {
        let preference = await this.prisma.userPreference.findUnique({
            where: { userId }
        });

        // 首次获取时自动创建默认设置
        if (!preference) {
            preference = await this.prisma.userPreference.create({
                data: { userId }
            });
        }

        return this.formatSettings(preference);
    }

    /**
     * 更新用户设置
     */
    async updateSettings(userId: string, dto: UpdateSettingsDto) {
        const preference = await this.prisma.userPreference.upsert({
            where: { userId },
            create: { userId, ...dto },
            update: dto
        });

        return this.formatSettings(preference);
    }

    /**
     * 更新订阅消息授权状态
     */
    async updateSubscriptionStatus(userId: string, accepted: boolean) {
        await this.prisma.userPreference.upsert({
            where: { userId },
            create: { userId, subscriptionAccepted: accepted },
            update: { subscriptionAccepted: accepted }
        });
    }

    /**
     * 获取需要发送提醒的用户列表
     */
    async getUsersForReminder(hour: number, minute: number) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        return this.prisma.userPreference.findMany({
            where: {
                notificationEnabled: true,
                subscriptionAccepted: true,
                reminderTime: timeStr
            },
            include: {
                user: {
                    select: { id: true, openId: true, lastDreamDate: true }
                }
            }
        });
    }

    /**
     * 获取用户隐私设置
     */
    async getPrivacySettings(userId: string) {
        const preference = await this.prisma.userPreference.findUnique({
            where: { userId }
        });

        return {
            defaultDreamPublic: preference?.defaultDreamPublic ?? false,
            allowProfileView: preference?.allowProfileView ?? true
        };
    }

    private formatSettings(preference: {
        notificationEnabled: boolean;
        reminderTime: string;
        subscriptionAccepted: boolean;
        defaultDreamPublic: boolean;
        allowProfileView: boolean;
    }) {
        return {
            notification: {
                enabled: preference.notificationEnabled,
                reminderTime: preference.reminderTime,
                subscriptionAccepted: preference.subscriptionAccepted
            },
            privacy: {
                defaultDreamPublic: preference.defaultDreamPublic,
                allowProfileView: preference.allowProfileView
            }
        };
    }
}
