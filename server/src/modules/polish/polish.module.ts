import { Module } from '@nestjs/common';
import { PolishController } from './polish.controller';
import { PolishService } from './polish.service';
import { AiModule } from '@/shared/ai/ai.module';

@Module({
    imports: [AiModule],
    controllers: [PolishController],
    providers: [PolishService],
    exports: [PolishService]
})
export class PolishModule {}
