import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NlpService } from '../services/nlp.service';

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
}
