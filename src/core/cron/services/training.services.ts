import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { classifyText, classifyWithScores, trainIntentClassifier } from '@/modules/nlp/classifiers/intent.classifier';

/**
 * **Uncategorized**
 * List all transactions that received the inbound categories and are pending categorization
 */
@Injectable()
export class TrainingService {
  private readonly _logger = new Logger(TrainingService.name);

  constructor() {
    this._logger.log('TrainingService Initialized');
  }

  @Cron('0/30 * * * * *')
  train() {
    trainIntentClassifier();
    const tests = [
      'Recebi 2500 de salário',
      'Pixei 200 para maria',
      'Paguei 1251 de aluguel no santander',
      'Transferi 50 pro mercado pago',
      'Caiu o pagamento de 3500 hoje',
      'Enviei dinheiro para minha conta no bradesco',
    ];

    for (const t of tests) {
      console.log(`"${t}" -> ${classifyText(t)}`);
      console.log(classifyWithScores(t)); // debug com probabilidades
    }
  }
  @Cron('0/30 * * * * *')
  // @Cron('0 0 0 * * *')
  retrain() {
    this._logger.verbose('Starting Uncategorized service');

    // const uncategorized = await this._transactions.uncategorized();
    // this._logger.verbose(
    //   `${uncategorized.length} transactions pending categorization.`,
    // );
    // this._rabbitService.sendMessage('uncategorized_notification', {
    //   type: 'notification',
    //   title: 'Uncategorized Transactions',
    //   description: `${uncategorized.length} transactions pending categorization.`,
    // });
  }
}
