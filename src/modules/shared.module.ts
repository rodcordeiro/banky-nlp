import { Module } from '@nestjs/common';

import { HealthModule } from '@/modules/health/health.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NlpModule } from './nlp/nlp.module';

@Module({
  imports: [HealthModule, FeedbackModule, NlpModule],
  controllers: [],
  providers: [],
})
export class SharedModule {}
