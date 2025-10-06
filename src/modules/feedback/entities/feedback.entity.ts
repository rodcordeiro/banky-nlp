import { BaseEntity } from '@/common/entities/base.entity';
import { Entity, Column } from 'typeorm';

@Entity({ name: 'bk_nlp_feedback' })
export class FeedbackEntity extends BaseEntity {
  @Column('text')
  originalText: string;

  @Column('simple-json')
  predictedJson: ProcessingResult;

  @Column('simple-json', { nullable: true })
  userCorrectedJson: ProcessingResult;

  @Column({
    type: 'enum',
    enum: ['pending', 'validated', 'corrected'],
    default: 'pending',
  })
  status: 'pending' | 'validated' | 'corrected';

  @Column({ default: false })
  usedForTraining: boolean;
}
