import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AnalysisSSEService } from './analysis-sse.service';
import { PromptService } from './prompt.service';
import { AiModule } from '@/shared/ai/ai.module';
import { DreamModule } from '../dream/dream.module';
import { TaskModule } from '../task/task.module';

@Module({
    imports: [DreamModule, TaskModule, AiModule],
    controllers: [AnalysisController],
    providers: [AnalysisService, AnalysisSSEService, PromptService],
    exports: [AnalysisService, AnalysisSSEService]
})
export class AnalysisModule {}
