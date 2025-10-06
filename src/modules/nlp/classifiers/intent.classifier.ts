import { BaseClassifier } from '@/common/classifiers/base.classifier';

export class IntentClassifier extends BaseClassifier {
  constructor() {
    super('intent.model');
  }
}
