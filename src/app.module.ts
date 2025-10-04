import { Module } from '@nestjs/common';
import { SharedModule } from '@/modules/shared.module'

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
