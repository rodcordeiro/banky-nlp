import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FeedbackService } from '../services/feedback.service';
import { SearchFeedbackDto } from '../dtos/search.dto';
import { ApproveFeedbackDto } from '../dtos/Approve.dto';
import { FeedbackEntity } from '../entities/feedback.entity';

@ApiTags('feedback')
@Controller({
  version: '1',
  path: '/feedback',
})
export class FeedbackController {
  constructor(private readonly _service: FeedbackService) {}

  @Get()
  async index(@Query() queries: SearchFeedbackDto) {
    return await this._service.findAll(queries);
  }

  @Post(':id')
  async aprove(@Body() payload: ApproveFeedbackDto, @Param('id') id: string) {
    return await this._service.save({
      ...payload,
      id,
    } as unknown as Partial<FeedbackEntity>);
  }
}
