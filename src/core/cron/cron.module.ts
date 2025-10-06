import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TrainingService } from './services/training.services';
import { NlpModule } from '@/modules/nlp/nlp.module';
import { FeedbackModule } from '@/modules/feedback/feedback.module';

@Module({
  imports: [ScheduleModule.forRoot(), FeedbackModule, NlpModule],
  providers: [TrainingService],
})
export class CronModule {}
