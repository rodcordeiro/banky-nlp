import { Module } from '@nestjs/common';
import { FeedbackController } from './controllers/feedback.controller';
import { FeedbackProviders } from './providers/feedback.provider';
import { FeedbackService } from './services/feedback.service';
import { PaginationModule } from '@/core/paginate/paginate.module';

@Module({
  imports: [PaginationModule],
  controllers: [FeedbackController],
  providers: [...FeedbackProviders, FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
