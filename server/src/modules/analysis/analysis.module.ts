import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { PromptService } from './prompt.service';
import { AiService } from '@/shared/ai/ai.service';
import { DreamModule } from '../dream/dream.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [DreamModule, TaskModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, PromptService, AiService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
