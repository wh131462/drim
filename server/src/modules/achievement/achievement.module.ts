import { Module } from '@nestjs/common';
import { AchievementController } from './achievement.controller';
import { AchievementService } from './achievement.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CacheModule } from '@/shared/cache/cache.module';

@Module({
    imports: [PrismaModule, CacheModule],
    controllers: [AchievementController],
    providers: [AchievementService],
    exports: [AchievementService]
})
export class AchievementModule {}
