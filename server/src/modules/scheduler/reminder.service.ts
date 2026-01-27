import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettingsService } from '../settings/settings.service';
import { WechatService } from '@/shared/wechat/wechat.service';

@Injectable()
export class ReminderService {
    private readonly logger = new Logger(ReminderService.name);

    constructor(
        private readonly settingsService: SettingsService,
        private readonly wechatService: WechatService
    ) {}

    /**
     * 每分钟检查需要发送提醒的用户
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async sendDreamReminders() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();

        try {
            const users = await this.settingsService.getUsersForReminder(hour, minute);

            if (users.length === 0) {
                return;
            }

            this.logger.log(`发现 ${users.length} 个用户需要发送提醒`);

            for (const pref of users) {
                // 检查今天是否已记梦
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lastDreamDate = pref.user.lastDreamDate;

                if (lastDreamDate && new Date(lastDreamDate) >= today) {
                    continue; // 今天已记录，跳过
                }

                // 发送订阅消息
                const success = await this.wechatService.sendDreamReminder(pref.user.openId, pref.reminderTime);

                if (success) {
                    this.logger.log(`已发送提醒给用户: ${pref.user.id}`);
                }
            }
        } catch (error) {
            this.logger.error('发送提醒任务失败', error);
        }
    }
}
