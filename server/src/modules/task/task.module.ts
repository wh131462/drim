import { Module, forwardRef } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { UserModule } from '../user/user.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
    imports: [forwardRef(() => UserModule), forwardRef(() => AchievementModule)],
    controllers: [TaskController],
    providers: [TaskService],
    exports: [TaskService]
})
export class TaskModule {}
