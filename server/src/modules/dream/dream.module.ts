import { Module } from '@nestjs/common';
import { DreamController } from './dream.controller';
import { DreamService } from './dream.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [DreamController],
  providers: [DreamService],
  exports: [DreamService],
})
export class DreamModule {}
