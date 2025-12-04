import { Inject, Injectable } from '@nestjs/common';
import { FindManyOptions, FindOptionsWhere, Not, Repository } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { SearchFeedbackDto } from '../dtos/search.dto';
import { AccountsClassifier } from '@/modules/nlp/classifiers/account.classifier';
import { IntentClassifier } from '@/modules/nlp/classifiers/intent.classifier';
import { CategoryClassifier } from '@/modules/nlp/classifiers/category.classifier';
import { mapFeedback } from '@/common/utils/feedback.util';
import { PaginationService } from '@/core/paginate/paginate.service';
import { ValueClassifier } from '@/modules/nlp/classifiers/value.classifier';

@Injectable()
export class FeedbackService {
  private intentProcessor: IntentClassifier;
  private accountProcessor: AccountsClassifier;
  private categoriesProcessor: CategoryClassifier;
  private valuesProcessor: ValueClassifier;

  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private readonly _repository: Repository<FeedbackEntity>,
    private readonly _paginateService: PaginationService,
  ) {
    this.intentProcessor = new IntentClassifier();
    this.accountProcessor = new AccountsClassifier();
    this.categoriesProcessor = new CategoryClassifier();
    this.valuesProcessor = new ValueClassifier();
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
        order: {
          createdAt: 'DESC',
        },
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
  async trainClassifiers(fullTraining?: boolean) {
    const { feeds, intents, categories, accounts, origin, destiny, values } =
      await this.getUntrainedFeedback(fullTraining).then(feeds => {
        // console.debug({ feeds });
        const intents = feeds.map(i => mapFeedback(i, 'intent'));
        const categories = feeds.map(i => mapFeedback(i, 'category'));
        const accounts = feeds.map(i => mapFeedback(i, 'account'));
        const origin = feeds.map(i => mapFeedback(i, 'origin'));
        const destiny = feeds.map(i => mapFeedback(i, 'destiny'));
        const values = feeds.map(i => ({
          text: i.originalText,
          label: (
            i.userCorrectedJson?.value ??
            i.predictedJson?.value ??
            0
          )?.toString(),
        }));
        return {
          feeds,
          intents,
          categories,
          accounts,
          origin,
          destiny,
          values,
        };
      });

    if (!feeds.length) return;

    await this.intentProcessor.train(intents);

    await this.accountProcessor.train(accounts);

    if (origin.length) {
      await this.accountProcessor.train(origin);
      await this.accountProcessor.train(destiny);
    }

    await this.categoriesProcessor.train(categories);
    await this.valuesProcessor.train(values);

    await this.markAsTrained(feeds);
  }
}
