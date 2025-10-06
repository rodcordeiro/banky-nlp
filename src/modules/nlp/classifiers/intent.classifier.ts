import { BaseClassifier } from '@/common/classifiers/base.classifier';
import { WordTokenizer, BayesClassifier, PorterStemmerPt } from 'natural';

// --- Dataset inicial (mais robusto) ---
const trainingData: { text: string; label: string }[] = [
  // Nova transação
  { text: 'Recebi 2500 de salário', label: 'create' },
  { text: 'Paguei 1251 de aluguel no santander', label: 'create' },
  { text: 'Comprei 125 no mercado', label: 'create' },
  { text: 'Gastei 100 reais no supermercado', label: 'create' },
  { text: 'Almoço 45 reais no restaurante', label: 'create' },
  { text: 'Mensalidade da academia 120', label: 'create' },
  { text: 'Depositaram 500 reais na minha conta', label: 'create' },
  { text: 'Caiu o pagamento de 3500 hoje', label: 'create' },

  // Transferência entre contas
  { text: 'Mandei 25 para yah da conta nubank digo', label: 'transfer' },
  { text: 'Transferi 50 pro mercado pago', label: 'transfer' },
  { text: 'Enviei 300 para a conta do itau', label: 'transfer' },
  { text: 'Fiz um pix de 150 para joão', label: 'transfer' },
  { text: 'Passei 500 reais para o nubank', label: 'transfer' },
  { text: 'Pixei 200 para maria', label: 'transfer' },
  {
    text: 'Enviei dinheiro para minha conta no bradesco',
    label: 'transfer',
  },
  { text: 'Transfere 80 pro banco inter', label: 'transfer' },
];
export class IntentClassifier extends BaseClassifier {
  constructor() {
    super();
    this.init({ samples: trainingData });
  }
}
