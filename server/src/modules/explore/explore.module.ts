import { Module, forwardRef } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
    imports: [forwardRef(() => AchievementModule)],
    controllers: [ExploreController],
    providers: [ExploreService],
    exports: [ExploreService]
})
export class ExploreModule {}
