import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'bk_nlp_feedback' })
export class FeedbackEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  originalText: string;

  @Column('simple-json')
  predictedJson: any;

  @Column('simple-json', { nullable: true })
  userCorrectedJson: any;

  @Column({
    type: 'enum',
    enum: ['pending', 'validated', 'corrected'],
    default: 'pending',
  })
  status: 'pending' | 'validated' | 'corrected';

  @Column({ default: false })
  usedForTraining: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
