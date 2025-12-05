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
  /**
   *Limite data of the paginate transactions.
   *@example 100
   */
  @ApiPropertyOptional()
  limit?: number;
  /**
   *Current page of the paginate transactions.
   *@example 1
   */
  @ApiPropertyOptional()
  page?: number;
}
