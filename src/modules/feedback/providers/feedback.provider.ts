import { DataSource } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { AccountsEntity } from '@/modules/nlp/entities/account.entity';
import { CategoriesEntity } from '@/modules/nlp/entities/category.entity';

export const FeedbackProviders = [
  {
    provide: 'FEEDBACK_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(FeedbackEntity),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'ACCOUNT_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(AccountsEntity),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'CATEGORY_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CategoriesEntity),
    inject: ['DATA_SOURCE'],
  },
];
