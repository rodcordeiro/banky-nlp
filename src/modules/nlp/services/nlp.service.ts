import { FeedbackService } from '@/modules/feedback/services/feedback.service';
import { CategoriesEntity } from '@/modules/nlp/entities/category.entity';
import { Inject, Injectable } from '@nestjs/common';
import { pt } from 'chrono-node';
import { Repository } from 'typeorm';
import { AccountsEntity } from '../entities/account.entity';

import { IntentClassifier } from '../classifiers/intent.classifier';
import { AccountsClassifier } from '../classifiers/account.classifier';
import { CategoryClassifier } from '../classifiers/category.classifier';
import { TrainingSample } from '@/common/classifiers/base.classifier';
import { ValueClassifier } from '../classifiers/value.classifier';

@Injectable()
export class NlpService {
  private intentProcessor: IntentClassifier;
  private accountProcessor: AccountsClassifier;
  private categoriesProcessor: CategoryClassifier;
  private valueProcessor: ValueClassifier;

  constructor(
    @Inject('CATEGORY_REPOSITORY')
    private readonly _categoriesRepository: Repository<CategoriesEntity>,
    @Inject('ACCOUNT_REPOSITORY')
    private readonly _accountsRepository: Repository<AccountsEntity>,
    private readonly _feedbackService: FeedbackService,
  ) {
    this.intentProcessor = new IntentClassifier();
    this.accountProcessor = new AccountsClassifier();
    this.categoriesProcessor = new CategoryClassifier();
    this.valueProcessor = new ValueClassifier();
  }

  async findAll() {
    return (await this._accountsRepository.find()).map(i => i.name);
  }

  private cleanAccountChunk(value: string | undefined): string | undefined {
    if (!value) return undefined;
    return value
      .trim()
      .replace(/^(o|a|os|as)\s+/i, '')
      .replace(/\s+/g, ' ');
  }

  private extractTransferOrigin(cleaned: string): string | undefined {
    const paired = cleaned.match(
      /\b(?:do|de|na conta)\s+(.+?)\s+(?:para|pra|pro)\s+/i,
    );
    if (paired?.[1]) return this.cleanAccountChunk(paired[1]);

    const byDoDe = cleaned.match(/\b(?:do|de)\s+(.+?)(?:,|$)/i);
    if (byDoDe?.[1]) return this.cleanAccountChunk(byDoDe[1]);

    const byConta = cleaned.match(/\bna conta\s+(.+?)(?:,|$)/i);
    if (byConta?.[1]) return this.cleanAccountChunk(byConta[1]);

    return undefined;
  }

  private extractTransferDestiny(cleaned: string): string | undefined {
    const match = cleaned.match(
      /\b(?:para|pra|pro)\s+(.+?)(?:(?:\s+dia\b)|(?:\s+\d{1,2}[/-]\d{1,2})|,|$)/i,
    );
    if (!match?.[1]) return undefined;
    return this.cleanAccountChunk(match[1]);
  }

  async extractEntities(text: string) {
    const result: ProcessingResult = {};
    const cleaned = text.toLowerCase();

    result.intent = await this.intentProcessor.classify(cleaned);
    if (result.intent === 'transfer') {
      const originText = this.extractTransferOrigin(cleaned);
      const destText = this.extractTransferDestiny(cleaned);

      if (originText) {
        result.origin = (await this.accountProcessor.classify(
          originText,
        )) as string;
      }

      if (destText) {
        result.destiny = (await this.accountProcessor.classify(
          destText,
        )) as string;
      }

      if (!result.origin) {
        result.origin = (await this.accountProcessor.classify(text)) as string;
      }

      if (!result.destiny && originText) {
        result.destiny = (await this.accountProcessor.classify(
          text.replace(originText, ''),
        )) as string;
      }
    } else {
      result.account = (await this.accountProcessor.classify(text)) as string;

      result.category = (await this.categoriesProcessor.classify(
        text,
      )) as string;
    }

    result.value = (await this.valueProcessor.classify(text)) as number;

    const dateParsed = pt.parseDate(text);
    if (dateParsed) {
      result.date = dateParsed.toISOString();
    } else {
      result.date = new Date().toISOString();
    }

    return result;
  }

  async parse(text: string, owner?: string) {
    const parsed = await this.extractEntities(text);
    const feedback = await this._feedbackService.save({
      owner: owner?.trim() || 'global',
      originalText: text,
      predictedJson: parsed,
    });
    return { ...parsed, feedback: feedback.id };
  }

  public async loadAccountDictionaries() {
    const accounts = await this._accountsRepository.find();
    return accounts;
  }
  public async loadCategoryDictionaries() {
    const categories = await this._categoriesRepository.find();
    return categories;
  }
  public async addCategoriesTrainnings(data: TrainingSample[]) {
    return await this.categoriesProcessor.train(data);
  }
  public async addAccountsTrainnings(data: TrainingSample[]) {
    return await this.accountProcessor.train(data);
  }
}
