import { DataSource } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';

export const FeedbackProviders = [
  {
    provide: 'FEEDBACK_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(FeedbackEntity),
    inject: ['DATA_SOURCE'],
  },
];
