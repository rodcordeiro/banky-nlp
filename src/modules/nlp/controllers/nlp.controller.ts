import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NlpService } from '../services/nlp.service';
import { ProcessingDto, TrainingSamplesDto } from '../dtos/processing.dto';

@ApiTags('Nlp')
@Controller({
  version: '1',
  path: '/nlp',
})
export class NlpController {
  constructor(private readonly _service: NlpService) {}

  @Get()
  async index() {
    return await this._service.findAll();
  }
  @Post()
  async process(@Body() payload: ProcessingDto) {
    return this._service.parse(payload.text);
  }
  @Post('trainning/categories')
  async categories(@Body() payload: TrainingSamplesDto) {
    return this._service.addCategoriesTrainnings(payload.samples);
  }
  @Post('trainning/accounts')
  async accounts(@Body() payload: TrainingSamplesDto) {
    return this._service.addAccountsTrainnings(payload.samples);
  }
}
