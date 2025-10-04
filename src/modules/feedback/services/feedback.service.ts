import { CategoriesEntity } from '@/modules/nlp/entities/category.entity';
import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private readonly _repository: Repository<CategoriesEntity>,
  ) {}

  async findAll() {
    return this._repository.find();
  }
}
