import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TrainingService } from './services/training.services';
import { NlpModule } from '@/modules/nlp/nlp.module';

@Module({
  imports: [ScheduleModule.forRoot(), NlpModule],
  providers: [TrainingService],
})
export class CronModule {}
