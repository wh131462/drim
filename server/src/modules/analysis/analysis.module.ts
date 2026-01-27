import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { PromptService } from './prompt.service';
import { AiModule } from '@/shared/ai/ai.module';
import { DreamModule } from '../dream/dream.module';
import { TaskModule } from '../task/task.module';

@Module({
    imports: [DreamModule, TaskModule, AiModule],
    controllers: [AnalysisController],
    providers: [AnalysisService, PromptService],
    exports: [AnalysisService]
})
export class AnalysisModule {}
