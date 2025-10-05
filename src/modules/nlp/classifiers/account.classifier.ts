import { WordTokenizer, BayesClassifier, PorterStemmerPt } from 'natural';
import { AccountsEntity } from '../entities/account.entity';

let classifier: BayesClassifier | null = null;

function preprocess(text: string): string {
  const tokenizer = new WordTokenizer();
  return tokenizer.tokenize(text.toLowerCase()).join(' ');
}

export function trainAccountClassifier(accounts: AccountsEntity[]) {
  const bayes = new BayesClassifier(PorterStemmerPt);

  accounts.forEach(acc => {
    bayes.addDocument(preprocess(acc.name.toLowerCase()), acc.name);
  });

  bayes.train();
  classifier = bayes;
}

export function classifyAccount(text: string): string | null {
  if (!classifier) throw new Error('Classifier not trained');
  return classifier.classify(text.toLowerCase());
}
