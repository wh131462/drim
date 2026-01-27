import { Module, forwardRef } from '@nestjs/common';
import { DreamController } from './dream.controller';
import { DreamService } from './dream.service';
import { UserModule } from '../user/user.module';
import { AchievementModule } from '../achievement/achievement.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [UserModule, forwardRef(() => AchievementModule), SettingsModule],
    controllers: [DreamController],
    providers: [DreamService],
    exports: [DreamService]
})
export class DreamModule {}
