import { DataSource } from 'typeorm';

import { AccountsEntity } from '../entities/account.entity';
import { CategoriesEntity } from '../entities/category.entity';
import { UsersEntity } from '../entities/users.entity';

export const NlpProviders = [
  {
    provide: 'CATEGORY_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CategoriesEntity),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'ACCOUNT_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(AccountsEntity),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(UsersEntity),
    inject: ['DATA_SOURCE'],
  },
];
