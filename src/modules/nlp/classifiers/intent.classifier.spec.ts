import { BaseClassifier } from '@/common/classifiers/base.classifier';
import { IntentClassifier, Intents } from './intent.classifier';

describe('IntentClassifier', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('classifies account-to-account pattern as transfer even when model says create', async () => {
    jest
      .spyOn(BaseClassifier.prototype, 'classify')
      .mockResolvedValue(Intents.CREATE);
    const classifier = new IntentClassifier();

    await expect(
      classifier.classify('Santander para nubank digo, 03/03, 643'),
    ).resolves.toBe(Intents.TRANSFER);
  });

  it('keeps transfer prediction only when transfer signals exist', async () => {
    jest
      .spyOn(BaseClassifier.prototype, 'classify')
      .mockResolvedValue(Intents.TRANSFER);
    const classifier = new IntentClassifier();

    await expect(classifier.classify('paguei 50 de almoço no santander')).resolves.toBe(
      Intents.CREATE,
    );
  });
});
