import { Inject, Injectable } from '@nestjs/common';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { SearchFeedbackDto } from '../dtos/search.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private readonly _repository: Repository<FeedbackEntity>,
  ) {}

  async findAll(queries: SearchFeedbackDto) {
    return this._repository.find({
      where: queries as FindOptionsWhere<FeedbackEntity>,
    });
  }
  async save(payload: Partial<FeedbackEntity>) {
    const feedback = this._repository.create(payload);
    return await this._repository.save(feedback);
  }
  async getUntrainedFeedback(all: boolean = false) {
    const filter = {};

    if (!all) {
      filter['status'] = Not('pending');
      filter['usedForTraining'] = false;
    } else {
      filter['usedForTraining'] = true;
    }

    console.log({ all, filter });

    return await this._repository.find({
      where: filter,
    });
  }

  async markAsTrained(feedbacks: FeedbackEntity[]) {
    await this._repository.save(
      feedbacks.map(i => ({ ...i, usedForTraining: true })),
    );
  }
}
