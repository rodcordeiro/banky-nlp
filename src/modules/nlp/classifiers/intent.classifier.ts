import { BaseClassifier } from '@/common/classifiers/base.classifier';

export enum Intents {
  TRANSFER = 'transfer',
  CREATE = 'create',
}

export class IntentClassifier extends BaseClassifier {
  constructor() {
    super('intent.model');
  }
  TRANSFER_VERBS = [
    'transferi',
    'enviei',
    'mandei',
    'passei',
    'movi',
    'movimentei',
    'pix para',
    'fiz pix',
    'fiz um pix',
    'pixei para',
  ];

  hasTransferVerb(text: string) {
    const t = text.toLowerCase();
    return this.TRANSFER_VERBS.some(v => t.includes(v));
  }

  override async classify(text: string): Promise<string> {
    const classified = await super.classify(text);
    if (classified === Intents.TRANSFER) {
      if (this.hasTransferVerb(text)) return Intents.TRANSFER;
      return Intents.CREATE;
    }
    return classified as string;
  }
}
