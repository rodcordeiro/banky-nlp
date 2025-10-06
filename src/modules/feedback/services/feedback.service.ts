import { CategoriesEntity } from '@/modules/nlp/entities/category.entity';
import { Inject, Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private readonly _repository: Repository<FeedbackEntity>,
  ) {}

  async findAll() {
    return this._repository.find();
  }
  async save(payload: Partial<FeedbackEntity>) {
    const feedback = this._repository.create(payload);
    return await this._repository.save(feedback);
  }
  async getUntrainedFeedback() {
    return await this._repository.find({
      where: { usedForTraining: false, status: Not('pending') },
    });
  }
  async markAsTrained(feedbacks: FeedbackEntity[]) {
    await this._repository.save(
      feedbacks.map(i => ({ ...i, usedForTraining: true })),
    );
  }
}
