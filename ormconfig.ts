// ormconfig.ts
import { DataSource } from 'typeorm';
import { FeedbackEntity } from './src/modules/feedback/entities/feedback.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [FeedbackEntity], // 👈 apenas a entity local
  migrations: ['src/migrations/*.ts'],
});
