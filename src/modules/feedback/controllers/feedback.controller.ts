import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FeedbackService } from '../services/feedback.service';

@ApiTags('feedback')
@Controller({
  version: '1',
  path: '/feedback',
})
export class FeedbackController {
  constructor(private readonly _service: FeedbackService) {}

  @Get()
  async index() {
    return await this._service.findAll();
  }
}
