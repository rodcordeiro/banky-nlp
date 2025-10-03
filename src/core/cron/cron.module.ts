import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { UncategorizedService } from './services/uncategorized.services';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [UncategorizedService],
})
export class CronModule {}
