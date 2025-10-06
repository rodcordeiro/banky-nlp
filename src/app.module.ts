import { SharedModule } from '@/modules/shared.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CronModule } from './core/cron/cron.module';
import { DatabaseModule } from './core/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 30,
        limit: 10,
      },
    ]),
    DatabaseModule,
    // RabbitModule,
    CronModule,
    SharedModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
