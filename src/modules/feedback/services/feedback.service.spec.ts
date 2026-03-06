import { FeedbackService } from './feedback.service';
import { Intents } from '@/modules/nlp/classifiers/intent.classifier';

describe('FeedbackService.trainClassifiers', () => {
  const feedbackRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const accountRepository = {
    findOne: jest.fn(),
  };
  const categoryRepository = {
    findOne: jest.fn(),
  };
  const paginateService = {
    paginate: jest.fn(),
  };

  let service: FeedbackService;
  const intentTrain = jest.fn();
  const accountTrain = jest.fn();
  const categoryTrain = jest.fn();
  const valueTrain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FeedbackService(
      feedbackRepository as never,
      accountRepository as never,
      categoryRepository as never,
      paginateService as never,
    );

    (service as any).intentProcessor = { train: intentTrain };
    (service as any).accountProcessor = { train: accountTrain };
    (service as any).categoriesProcessor = { train: categoryTrain };
    (service as any).valuesProcessor = { train: valueTrain };
  });

  it('separates training by intent and canonicalizes uuid labels', async () => {
    const transferFeedback = {
      id: 'f-transfer',
      originalText: 'Santander para nubank digo, 03/03, 643',
      predictedJson: {
        intent: 'create',
        account: 'Nubank Digo',
        category: 'Almoço',
        value: 643,
      },
      userCorrectedJson: {
        intent: 'transfer',
        origin: '6d6bda2a-5134-4c3b-97f2-39194eb475d3',
        destiny: '73a857a9-9208-4a09-9ce8-dcaea06bff27',
        value: 643,
      },
      status: 'corrected',
      usedForTraining: false,
    };

    const createFeedback = {
      id: 'f-create',
      originalText: 'Santander, 11/01/26, 62.68 no mercadinho',
      predictedJson: {
        intent: 'create',
        account: 'santander',
        category: 'mercearia e açougue (dia-a-dia)',
        value: 62.68,
      },
      userCorrectedJson: {
        intent: 'create',
        account: '6d6bda2a-5134-4c3b-97f2-39194eb475d3',
        category: '668635e4-ef63-4df0-8d12-44b88b65f5ab',
        value: 62.68,
      },
      status: 'corrected',
      usedForTraining: false,
    };

    const invalidFeedback = {
      id: 'f-invalid',
      originalText: 'entrada inválida',
      predictedJson: {
        intent: 'undefined',
        value: 0,
      },
      userCorrectedJson: null,
      status: 'validated',
      usedForTraining: false,
    };

    feedbackRepository.find.mockResolvedValue([
      transferFeedback,
      createFeedback,
      invalidFeedback,
    ]);
    accountRepository.findOne.mockImplementation(({ where: { id } }) => {
      if (id === '6d6bda2a-5134-4c3b-97f2-39194eb475d3')
        return Promise.resolve({ id, name: 'Santander' });
      if (id === '73a857a9-9208-4a09-9ce8-dcaea06bff27')
        return Promise.resolve({ id, name: 'Nubank Digo' });
      return Promise.resolve(null);
    });
    categoryRepository.findOne.mockResolvedValue({
      id: '668635e4-ef63-4df0-8d12-44b88b65f5ab',
      name: 'Mercearia e Açougue (dia-a-dia)',
    });

    await service.trainClassifiers(true);

    expect(intentTrain).toHaveBeenCalledWith([
      { text: transferFeedback.originalText.toLowerCase(), label: Intents.TRANSFER },
      { text: createFeedback.originalText.toLowerCase(), label: Intents.CREATE },
    ]);

    expect(accountTrain).toHaveBeenCalledTimes(3);
    expect(accountTrain).toHaveBeenNthCalledWith(1, [
      { text: createFeedback.originalText.toLowerCase(), label: 'santander' },
    ]);
    expect(accountTrain).toHaveBeenNthCalledWith(2, [
      { text: transferFeedback.originalText.toLowerCase(), label: 'santander' },
    ]);
    expect(accountTrain).toHaveBeenNthCalledWith(3, [
      { text: transferFeedback.originalText.toLowerCase(), label: 'nubank digo' },
    ]);

    expect(categoryTrain).toHaveBeenCalledWith([
      {
        text: createFeedback.originalText.toLowerCase(),
        label: 'mercearia e açougue (dia-a-dia)',
      },
    ]);

    expect(valueTrain).toHaveBeenCalledWith([
      { text: transferFeedback.originalText, label: '643' },
      { text: createFeedback.originalText, label: '62.68' },
    ]);
    expect(feedbackRepository.save).toHaveBeenCalledTimes(1);
  });
});
