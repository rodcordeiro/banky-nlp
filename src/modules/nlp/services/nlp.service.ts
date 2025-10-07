import { FeedbackService } from '@/modules/feedback/services/feedback.service';
import { CategoriesEntity } from '@/modules/nlp/entities/category.entity';
import { Inject, Injectable } from '@nestjs/common';
import { pt } from 'chrono-node';
import { Repository } from 'typeorm';
import { AccountsEntity } from '../entities/account.entity';

import { IntentClassifier } from '../classifiers/intent.classifier';
import { AccountsClassifier } from '../classifiers/account.classifier';
import { CategoryClassifier } from '../classifiers/category.classifier';

@Injectable()
export class NlpService {
  private intentProcessor: IntentClassifier;
  private accountProcessor: AccountsClassifier;
  private categoriesProcessor: CategoryClassifier;

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
  }

  async findAll() {
    return (await this._accountsRepository.find()).map(i => i.name);
  }
  async extractEntities(text: string) {
    const result: ProcessingResult = {};
    result.intent = await this.intentProcessor.classify(text);

    if (result.intent === 'transfer') {
      result.origin = await this.accountProcessor.classify(text);
      if (result.origin)
        result.originId = (
          await this._accountsRepository.findOne({
            where: { name: result.origin },
          })
        )?.id;

      // Adiciona um separador para classificar o destino
      const remainingTextForDestiny = text.replace(result.origin, '').trim();
      result.destiny = await this.accountProcessor.classify(
        remainingTextForDestiny,
      );
      if (result.destiny)
        result.destinyId = (
          await this._accountsRepository.findOne({
            where: { name: result.destiny },
          })
        )?.id;
    } else {
      result.account = await this.accountProcessor.classify(text);
      if (result.account)
        result.accountId = (
          await this._accountsRepository.findOne({
            where: { name: result.account },
          })
        )?.id;

      result.category = await this.categoriesProcessor.classify(text);
      if (result.category)
        result.categoryId = (
          await this._categoriesRepository.findOne({
            where: { name: result.category },
          })
        )?.id;
    }

    // valor
    const valMatch = text.match(/(\d+[,.]?\d*)\s*(reais|rs|r\$)?/i);
    if (valMatch) result.value = parseFloat(valMatch[1].replace(',', '.'));

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
}
