import { Module } from '@nestjs/common';
import { FeedbackController } from './controllers/feedback.controller';
import { FeedbackProviders } from './providers/feedback.provider';
import { FeedbackService } from './services/feedback.service';

@Module({
  imports: [],
  controllers: [FeedbackController],
  providers: [...FeedbackProviders, FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
