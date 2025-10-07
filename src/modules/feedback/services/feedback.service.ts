import { Inject, Injectable } from '@nestjs/common';
import { FindManyOptions, FindOptionsWhere, Not, Repository } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { SearchFeedbackDto } from '../dtos/search.dto';
import { AccountsClassifier } from '@/modules/nlp/classifiers/account.classifier';
import { IntentClassifier } from '@/modules/nlp/classifiers/intent.classifier';
import { CategoryClassifier } from '@/modules/nlp/classifiers/category.classifier';
import { mapFeedback } from '@/common/utils/feedback.util';
import { PaginationService } from '@/core/paginate/paginate.service';

@Injectable()
export class FeedbackService {
  private intentProcessor: IntentClassifier;
  private accountProcessor: AccountsClassifier;
  private categoriesProcessor: CategoryClassifier;

  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private readonly _repository: Repository<FeedbackEntity>,
    private readonly _paginateService: PaginationService,
  ) {
    this.intentProcessor = new IntentClassifier();
    this.accountProcessor = new AccountsClassifier();
    this.categoriesProcessor = new CategoryClassifier();
  }

  async findAll(queries: SearchFeedbackDto) {
    const { page, limit, ...filters } = queries;
    return this._paginateService.paginate(
      this._repository,
      {
        limit: queries.limit ?? 10,
        page: queries.page ?? 1,
      },
      {
        where: filters as FindOptionsWhere<FeedbackEntity>,
      } as unknown as FindManyOptions<FeedbackEntity>,
    );
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

    return await this._repository.find({
      where: filter,
    });
  }

  async markAsTrained(feedbacks: FeedbackEntity[]) {
    await this._repository.save(
      feedbacks.map(i => ({ ...i, usedForTraining: true })),
    );
  }
  async trainClassifiers() {
    const feedbacks = await this.getUntrainedFeedback();
    console.log({ feedbacks });

    if (!feedbacks.length) return;

    await this.intentProcessor.train(
      feedbacks.map(i => mapFeedback(i, 'intent')),
    );

    await this.accountProcessor.train(
      feedbacks.map(i => mapFeedback(i, 'account')),
    );
    if (feedbacks.some(i => i.predictedJson.intent === 'transfer')) {
      await this.accountProcessor.train(
        feedbacks.map(i => mapFeedback(i, 'origin')),
      );
      await this.accountProcessor.train(
        feedbacks.map(i => mapFeedback(i, 'destiny')),
      );
    }

    await this.categoriesProcessor.train(
      feedbacks.map(i => mapFeedback(i, 'category')),
    );

    await this.markAsTrained(feedbacks);
  }
}
