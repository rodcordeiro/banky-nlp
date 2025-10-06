import { BayesClassifier, PorterStemmerPt, WordTokenizer } from 'natural';
export interface TrainingSample {
  text: string;
  label: string;
}

export class BaseClassifier {
  public classifier: BayesClassifier | null = null;
  private tokenizer: WordTokenizer;

  init({ samples }: { samples?: TrainingSample[] }) {
    if (this.classifier != null) {
      return this.classifier;
    }
    this.classifier = new BayesClassifier(PorterStemmerPt);
    this.tokenizer = new WordTokenizer();
    this.train(samples!);
  }

  preprocess(text: string): string {
    return this.tokenizer.tokenize(text.toLowerCase()).join(' ');
  }

  classify(text: string): string {
    if (!this.classifier) throw new Error('Classifier not trained');
    return this.classifier.classify(this.preprocess(text.toLowerCase()));
  }
  train(samples: TrainingSample[]) {
    if (!this.classifier) return;

    const bayes = this.classifier;

    for (const sample of samples) {
      bayes.addDocument(this.preprocess(sample.text), sample.label);
    }

    bayes.train();
    this.classifier = bayes;
  }
}
