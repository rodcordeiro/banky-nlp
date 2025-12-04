import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackEntity } from '../entities/feedback.entity';

export class UserCorrectedJsonDto {
  @ApiProperty() intent: string;
  @ApiProperty() account: string;
  @ApiProperty() category: string;
  @ApiProperty() value: number;
  @ApiProperty() date: string;
}

export class ApproveFeedbackDto {
  @ApiProperty({ type: 'string' })
  status: keyof FeedbackEntity['status'];
  @ApiPropertyOptional({ type: () => UserCorrectedJsonDto })
  userCorrectedJson?: ProcessingResult;
}
