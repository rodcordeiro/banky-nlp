import natural from 'natural';

let classifier: natural.BayesClassifier | null = null;
const INTENTS = ['create', 'transfer'];
export function trainIntentClassifier() {
  const bayes = new natural.BayesClassifier(natural.PorterStemmerPt);

  INTENTS.forEach(intent => {
    bayes.addDocument(intent.toLowerCase(), intent);
  });

  bayes.train();
  classifier = bayes;
}

export function classifyIntent(text: string): string | null {
  if (!classifier) throw new Error('Classifier not trained');
  return classifier.classify(text.toLowerCase());
}
