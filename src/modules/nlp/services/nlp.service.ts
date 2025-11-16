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

  async extractEntities(text: string) {
    const result: ProcessingResult = {};
    const cleaned = text.toLowerCase();

    result.intent = await this.intentProcessor.classify(cleaned);
    if (result.intent === 'transfer') {
      // 1. Encontrar ORIGEM por estrutura da frase
      let originText: string | undefined;

      const originRegex = /na conta ([^,]+)|do ([^ ]+)/i;
      const oMatch = originRegex.exec(cleaned);
      if (oMatch) {
        originText = (oMatch[1] || oMatch[2])?.trim();
      }

      if (originText) {
        result.origin = (await this.accountProcessor.classify(
          originText,
        )) as string;
      }

      // 2. Encontrar DESTINO por estrutura da frase
      let destText: string | undefined;

      const destRegex = /para ([^,]+)/i;
      const dMatch = destRegex.exec(cleaned);
      if (dMatch) {
        destText = dMatch[1].trim();
      }

      if (destText) {
        result.destiny = (await this.accountProcessor.classify(
          destText,
        )) as string;
      }

      // fallback — se ainda assim algo falhar
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
      // if (result.account)
      //   result.accountId = (
      //     await this._accountsRepository.findOne({
      //       where: { name: result.account },
      //     })
      //   )?.id;

      result.category = (await this.categoriesProcessor.classify(
        text,
      )) as string;
      // if (result.category)
      //   result.categoryId = (
      //     await this._categoriesRepository.findOne({
      //       where: { name: result.category },
      //     })
      //   )?.id;
    }

    result.value = (await this.valueProcessor.classify(text)) as number;
    // valor
    // const valMatch = text.match(/(\d+[,.]?\d*)\s*(reais|rs|r\$)?/i);
    // if (valMatch) result.value = valMatch;

    // data
    const dateParsed = pt.parseDate(text);
    if (dateParsed) result.date = dateParsed.toISOString();

    return result;
  }

  async parse(text: string) {
    const parsed = await this.extractEntities(text);
    const feedback = await this._feedbackService.save({
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
