import { Module } from '@nestjs/common';
import { NlpController } from './controllers/nlp.controller';
import { NlpProviders } from './providers/npl.provider';
import { NlpService } from './services/nlp.service';
import { FeedbackModule } from '../feedback/feedback.module';

@Module({
  imports: [FeedbackModule],
  controllers: [NlpController],
  providers: [...NlpProviders, NlpService],
  exports: [NlpService],
})
export class NlpModule {}
