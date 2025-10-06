import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackEntity } from '../entities/feedback.entity';

export class SearchFeedbackDto {
  @ApiPropertyOptional({
    type: 'string',
  })
  status?: keyof FeedbackEntity['status'];
  @ApiPropertyOptional({
    type: 'boolean',
  })
  usedForTraining?: boolean;
  @ApiPropertyOptional({
    type: 'string',
  })
  id?: string;
}
