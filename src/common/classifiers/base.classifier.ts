import { BayesClassifier, PorterStemmerPt } from 'natural';
import fs from 'fs';
import path from 'path';

export interface TrainingSample {
  text: string;
  label: string;
}

export class BaseClassifier {
  public classifier: BayesClassifier | null = null;
  private model: string;

  constructor(model: string) {
    this.model = model;
  }

  private getModelPath(): string {
    return path.join('src/common/classifiers/models', `${this.model}.json`);
  }

  async init(): Promise<BayesClassifier> {
    if (this.classifier) return this.classifier;

    const modelPath = this.getModelPath();

    if (fs.existsSync(modelPath)) {
      // Carrega o modelo já treinado
      return new Promise((resolve, reject) => {
        BayesClassifier.load(modelPath, PorterStemmerPt, (err, classifier) => {
          if (err) return reject(err);
          this.classifier = classifier ?? null;
          resolve(classifier!);
        });
      });
    } else {
      // Cria um novo se não existir
      this.classifier = new BayesClassifier(PorterStemmerPt);
      return this.classifier;
    }
  }

  preprocess(text: string): string {
    // return this._tokenizer.tokenize(text.toLowerCase()).join(' ');
    return text
      .toLowerCase()
      .replace(/[^\w\s\*\.]/g, '') // mantém ** e .
      .replace(/\s+/g, ' ')
      .trim();
  }

  async classify(text: string): Promise<string | number | null> {
    if (!this.classifier) await this.init();
    return this.classifier!.classify(this.preprocess(text));
  }

  async train(samples?: TrainingSample[]): Promise<void> {
    const classifier = await this.init();

    for (const sample of samples ?? []) {
      classifier.addDocument(this.preprocess(sample.text), sample.label);
    }

    classifier.train();

    await this.save();
  }

  /**
   * Re-treina incrementalmente com novos exemplos (ex: feedback)
   */
  async retrain(newSamples: TrainingSample[]): Promise<void> {
    console.log(`🔁 Re-treinando modelo '${this.model}' com feedback...`);
    const classifier = await this.init();

    for (const sample of newSamples) {
      classifier.addDocument(this.preprocess(sample.text), sample.label);
    }

    classifier.train();
    await this.save();
    console.log(`✅ Re-treinamento concluído: ${this.model}`);
  }

  private save(): Promise<void> {
    const modelPath = this.getModelPath();
    return new Promise((resolve, reject) => {
      this.classifier!.save(modelPath, err => {
        if (err) reject(err);
        console.log(`✅ Modelo '${this.model}' salvo em ${modelPath}`);
        resolve();
      });
    });
  }
}
