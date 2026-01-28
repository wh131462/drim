import { Module, forwardRef } from '@nestjs/common';
import { PolishController } from './polish.controller';
import { PolishService } from './polish.service';
import { AiModule } from '@/shared/ai/ai.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
    imports: [AiModule, forwardRef(() => AchievementModule)],
    controllers: [PolishController],
    providers: [PolishService],
    exports: [PolishService]
})
export class PolishModule {}
