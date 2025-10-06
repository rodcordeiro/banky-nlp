import { TrainingSample } from '@/common/classifiers/base.classifier';
import { FeedbackEntity } from '@/modules/feedback/entities/feedback.entity';
import { FeedbackService } from '@/modules/feedback/services/feedback.service';
import { AccountsClassifier } from '@/modules/nlp/classifiers/account.classifier';
import { CategoryClassifier } from '@/modules/nlp/classifiers/category.classifier';
import { IntentClassifier } from '@/modules/nlp/classifiers/intent.classifier';
import { NlpService } from '@/modules/nlp/services/nlp.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

function mapFeedback(
  feedback: FeedbackEntity,
  label: keyof ProcessingResult,
): TrainingSample {
  if (feedback.userCorrectedJson)
    return {
      text: feedback.originalText,
      label: feedback.userCorrectedJson[label] as string,
    };
  return {
    text: feedback.originalText,
    label: feedback.predictedJson[label] as string,
  };
}
/**
 * **Uncategorized**
 * List all transactions that received the inbound categories and are pending categorization
 */
@Injectable()
export class TrainingService {
  private readonly _logger = new Logger(TrainingService.name);

  constructor(
    private readonly _feedbackService: FeedbackService,
    private readonly _nlpService: NlpService,
  ) {
    this._logger.log('TrainingService Initialized');
  }

  @Cron('0/15 * * * * *', { waitForCompletion: true })
  // @Cron('0 0 0 * * *', { waitForCompletion: true })
  async train() {
    this._logger.verbose('Starting training service');

    const intentClassifier = new IntentClassifier();
    const accountsClassifier = new AccountsClassifier();
    const categoriesClassifier = new CategoryClassifier();

    await intentClassifier.train();

    const accounts = await this._nlpService.loadAccountDictionaries();
    await accountsClassifier.train(
      accounts.map(i => ({ text: i.name, label: i.name })),
    );

    const categories = await this._nlpService.loadCategoryDictionaries();
    await categoriesClassifier.train(
      categories.map(i => ({ text: i.name, label: i.name })),
    );

    const tests = [
      'Recebi 2500 de salário',
      'Pixei 200 para maria',
      'Paguei 1251 de aluguel no santander',
      'Transferi 50 pro mercado pago',
      'Caiu o pagamento de 3500 hoje',
      'Enviei dinheiro para minha conta no bradesco',
      '43.40 do booster de Magic na Nubank yah crédito dia 09/10',
      'Recebi 4470 de salario liquido no dia 01/10/25 no santander',
    ];

    for (const t of tests) {
      console.log(`"${t}" ->`);
      console.log(await this._nlpService.extractEntities(t));
    }
  }

  @Cron('0 0 * * * *', { waitForCompletion: true })
  // @Cron('0/10 * * * * *', { waitForCompletion: true })
  async retrain() {
    this._logger.verbose('Starting retraining service');

    const intentClassifier = new IntentClassifier();
    const accountsClassifier = new AccountsClassifier();

    const feedbacks = await this._feedbackService.getUntrainedFeedback();
    console.log({ feedbacks });

    await intentClassifier.retrain(
      feedbacks.map(i => mapFeedback(i, 'intent')),
    );
    await accountsClassifier.retrain(
      feedbacks.map(i => mapFeedback(i, 'account')),
    );

    await this._feedbackService.markAsTrained(feedbacks);
  }
}
