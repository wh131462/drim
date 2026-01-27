import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderService } from './reminder.service';
import { SettingsModule } from '../settings/settings.module';
import { WechatService } from '@/shared/wechat/wechat.service';
import { CacheModule } from '@/shared/cache/cache.module';

@Module({
    imports: [ScheduleModule.forRoot(), SettingsModule, CacheModule],
    providers: [ReminderService, WechatService]
})
export class SchedulerModule {}
