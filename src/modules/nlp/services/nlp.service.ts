import { FeedbackService } from '@/modules/feedback/services/feedback.service';
import { CategoriesEntity } from '@/modules/nlp/entities/category.entity';
import { Inject, Injectable } from '@nestjs/common';
import chrono from 'chrono-node';
import { Repository } from 'typeorm';
import { AccountsEntity } from '../entities/account.entity';
import { UsersEntity } from '../entities/users.entity';

import { IntentClassifier } from '../classifiers/intent.classifier';

@Injectable()
export class NlpService {
  private accountsCache: AccountsEntity[] = [];
  private categoriesCache: CategoriesEntity[] = [];
  private intentProcessor: IntentClassifier;
  constructor(
    @Inject('CATEGORY_REPOSITORY')
    private readonly _categoriesRepository: Repository<CategoriesEntity>,
    @Inject('ACCOUNT_REPOSITORY')
    private readonly _accountsRepository: Repository<AccountsEntity>,
    @Inject('USER_REPOSITORY')
    private readonly _usersRepository: Repository<UsersEntity>,
    private readonly _feedbackService: FeedbackService,
  ) {
    this.intentProcessor = new IntentClassifier();
  }

  async findAll() {
    return this._categoriesRepository.find();
  }
  async extractEntities(text: string) {
    await this.loadAccountDictionaries();
    await this.loadCategoryDictionaries();

    const lower = text.toLowerCase();
    const result: any = {};
    result.intent = this.intentProcessor.classify(text);
    // valor
    const valMatch = text.match(/(\d+[,.]?\d*)\s*(reais|rs|r\$)?/i);
    if (valMatch) result.value = parseFloat(valMatch[1].replace(',', '.'));

    // data
    const dateParsed = chrono.pt.parseDate(text);
    if (dateParsed) result.date = dateParsed.toISOString();

    // contas
    for (const acc of this.accountsCache) {
      // const candidates = [acc.name.toLowerCase(), ...(acc.aliases || [])];
      const candidates = acc.name.toLowerCase();
      for (const alias of candidates) {
        if (lower.includes('de ' + alias)) result.origin = acc.name;
        if (lower.includes('para ' + alias) || lower.includes('pro ' + alias))
          result.destiny = acc.name;
      }
    }

    // categorias
    for (const cat of this.categoriesCache) {
      // const candidates = [cat.name.toLowerCase(), ...(cat.aliases || [])];
      const candidates = cat.name.toLowerCase();
      // if (candidates.some(a => lower.includes(a))) result.category = cat.name;
      if (lower.includes(candidates)) result.category = cat.name;
    }

    return result;
  }

  private async loadAccountDictionaries() {
    this.accountsCache = await this._accountsRepository.find();
  }
  private async loadCategoryDictionaries() {
    this.categoriesCache = await this._categoriesRepository.find();
  }
}
