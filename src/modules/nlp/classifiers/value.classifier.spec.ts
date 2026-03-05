import { ValueClassifier } from './value.classifier';

describe('ValueClassifier', () => {
  const classifier = new ValueClassifier();

  it('extracts amount when text has date before value', () => {
    expect(classifier.extract('Santander, 19/12/25, 5687 de outras receitas')).toBe(5687);
    expect(classifier.extract('Santander, 02/01/26, 3896 de salario')).toBe(3896);
    expect(classifier.extract('Santander, 08/01/26, 1280.00 de aluguel')).toBe(1280);
    expect(classifier.extract('Santander para nubank digo, 11/01/26, 70')).toBe(70);
  });

  it('extracts leading decimal amount and ignores inline date', () => {
    expect(
      classifier.extract('2756.87 dia 03/02, para pagar cartao de credito com o nubank yah'),
    ).toBe(2756.87);
    expect(
      classifier.extract('2454.70 dia 05/01, para pagar cartao de credito com o nubank yah'),
    ).toBe(2454.7);
  });

  it('handles value with currency context', () => {
    expect(
      classifier.extract('14 reais de caldo de cana (variado) pago com mercado pago dia 24/02'),
    ).toBe(14);
  });

  it('keeps zero value as valid extraction', async () => {
    await expect(classifier.classify('paguei 0 reais de ajuste')).resolves.toBe(0);
  });
});
