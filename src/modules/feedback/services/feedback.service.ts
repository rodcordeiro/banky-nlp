import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, FindOptionsWhere, Not, Repository } from 'typeorm';
import { FeedbackEntity } from '../entities/feedback.entity';
import { SearchFeedbackDto } from '../dtos/search.dto';
import { AccountsClassifier } from '@/modules/nlp/classifiers/account.classifier';
import {
  IntentClassifier,
  Intents,
} from '@/modules/nlp/classifiers/intent.classifier';
import { CategoryClassifier } from '@/modules/nlp/classifiers/category.classifier';
import { PaginationService } from '@/core/paginate/paginate.service';
import { ValueClassifier } from '@/modules/nlp/classifiers/value.classifier';
import { AccountsEntity } from '@/modules/nlp/entities/account.entity';
import { CategoriesEntity } from '@/modules/nlp/entities/category.entity';
import { TrainingSample } from '@/common/classifiers/base.classifier';

@Injectable()
export class FeedbackService {
  private intentProcessor: IntentClassifier;
  private accountProcessor: AccountsClassifier;
  private categoriesProcessor: CategoryClassifier;
  private valuesProcessor: ValueClassifier;

  constructor(
    @Inject('FEEDBACK_REPOSITORY')
    private readonly _repository: Repository<FeedbackEntity>,
    @Inject('ACCOUNT_REPOSITORY')
    private readonly _accountRepository: Repository<AccountsEntity>,
    @Inject('CATEGORY_REPOSITORY')
    private readonly _categoryRepository: Repository<CategoriesEntity>,
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
    if (payload.id) {
      const existing = await this._repository.findOne({
        where: { id: payload.id },
      });

      if (!existing) {
        throw new NotFoundException('Feedback nao encontrado para aprovacao.');
      }

      const feedback = this._repository.create({
        ...existing,
        ...payload,
      });
      return await this._repository.save(feedback);
    }

    if (!payload.originalText || !payload.predictedJson) {
      throw new BadRequestException(
        'originalText e predictedJson sao obrigatorios para criar feedback.',
      );
    }

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

  private normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.toLowerCase();
    if (normalized === 'undefined' || normalized === 'null') return null;
    return normalized;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private async resolveAccountLabel(value: unknown): Promise<string | null> {
    const normalized = this.normalizeText(value);
    if (!normalized) return null;
    if (!this.isUuid(normalized)) return normalized;

    const account = await this._accountRepository.findOne({
      where: { id: normalized },
      select: ['id', 'name'],
    });
    return this.normalizeText(account?.name);
  }

  private async resolveCategoryLabel(value: unknown): Promise<string | null> {
    const normalized = this.normalizeText(value);
    if (!normalized) return null;
    if (!this.isUuid(normalized)) return normalized;

    const category = await this._categoryRepository.findOne({
      where: { id: normalized },
      select: ['id', 'name'],
    });
    return this.normalizeText(category?.name);
  }

  private selectField(
    feedback: FeedbackEntity,
    field: keyof ProcessingResult,
  ): unknown {
    const correctedValue = feedback.userCorrectedJson?.[field];
    if (correctedValue !== undefined && correctedValue !== null)
      return correctedValue;
    return feedback.predictedJson?.[field];
  }

  private async buildIntentSample(
    feedback: FeedbackEntity,
  ): Promise<TrainingSample | null> {
    const label = this.normalizeText(this.selectField(feedback, 'intent'));
    if (!label) return null;
    return {
      text: feedback.originalText.toLowerCase(),
      label,
    };
  }

  private async buildCategorySample(
    feedback: FeedbackEntity,
  ): Promise<TrainingSample | null> {
    const label = await this.resolveCategoryLabel(
      this.selectField(feedback, 'category'),
    );
    if (!label) return null;
    return {
      text: feedback.originalText.toLowerCase(),
      label,
    };
  }

  private async buildAccountSample(
    feedback: FeedbackEntity,
    field: 'account' | 'origin' | 'destiny',
  ): Promise<TrainingSample | null> {
    const label = await this.resolveAccountLabel(this.selectField(feedback, field));
    if (!label) return null;
    return {
      text: feedback.originalText.toLowerCase(),
      label,
    };
  }

  private buildValueSample(feedback: FeedbackEntity): TrainingSample | null {
    const value = feedback.userCorrectedJson?.value ?? feedback.predictedJson?.value;
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    return {
      text: feedback.originalText,
      label: value.toString(),
    };
  }

  async trainClassifiers(fullTraining?: boolean) {
    const feeds = await this.getUntrainedFeedback(fullTraining);

    if (!feeds.length) return;

    const intents: TrainingSample[] = [];
    const categories: TrainingSample[] = [];
    const accounts: TrainingSample[] = [];
    const origin: TrainingSample[] = [];
    const destiny: TrainingSample[] = [];
    const values: TrainingSample[] = [];

    for (const feed of feeds) {
      const intentSample = await this.buildIntentSample(feed);
      if (!intentSample) continue;

      intents.push(intentSample);

      if (intentSample.label === Intents.CREATE) {
        const accountSample = await this.buildAccountSample(feed, 'account');
        if (accountSample) accounts.push(accountSample);

        const categorySample = await this.buildCategorySample(feed);
        if (categorySample) categories.push(categorySample);
      }

      if (intentSample.label === Intents.TRANSFER) {
        const originSample = await this.buildAccountSample(feed, 'origin');
        if (originSample) origin.push(originSample);

        const destinySample = await this.buildAccountSample(feed, 'destiny');
        if (destinySample) destiny.push(destinySample);
      }

      const valueSample = this.buildValueSample(feed);
      if (valueSample) values.push(valueSample);
    }

    if (intents.length) await this.intentProcessor.train(intents);
    if (accounts.length) await this.accountProcessor.train(accounts);
    if (origin.length) await this.accountProcessor.train(origin);
    if (destiny.length) await this.accountProcessor.train(destiny);
    if (categories.length) await this.categoriesProcessor.train(categories);
    if (values.length) await this.valuesProcessor.train(values);

    await this.markAsTrained(feeds);
  }
}
