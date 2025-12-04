import { BaseClassifier } from '@/common/classifiers/base.classifier';

export class ValueClassifier extends BaseClassifier {
  constructor() {
    super('value.model');
  }

  extract(text: string): number | null {
    if (!text) return null;

    const raw = text;

    // 1. Capturar todos os números (inteiros ou decimais)
    const matches = raw.match(/\d{1,3}(?:[.,]\d{3})*[.,]\d+|\d+/g);
    if (!matches) return null;

    // Mapeamos com inteligência: cada número é pré-processado com contexto
    const candidates = matches.map(n => ({
      raw: n,
      normalized: this.normalize(n),
    }));

    // 2. Remover números de datas dd/mm ou dd/mm/yy
    const noDates = candidates.filter(c => {
      const regexDate = new RegExp(`\\b${c.raw}(?=\\/|-)`);
      return !regexDate.test(raw);
    });

    // 3. Remover números de "parcela X/Y"
    const noParcel = noDates.filter(c => {
      const regexParcel = new RegExp(`parcela\\s+${c.raw}\\/`);
      return !regexParcel.test(raw);
    });

    if (noParcel.length === 0) return null;

    // 4. Prioridade: decimais reais
    const decimals = noParcel.filter(
      c => c.raw.includes('.') || c.raw.includes(','),
    );
    if (decimals.length > 0) {
      return parseFloat(decimals[0].normalized);
    }

    // 5. Número após verbo financeiro
    const verbMatch = raw.match(
      /(recebi|ganhei|paguei|gastei|transferi|enviei|depositei|coloquei|usei)\s+(\d+[.,]?\d*)/i,
    );
    if (verbMatch) {
      const n = this.normalize(verbMatch[2]);
      return parseFloat(n);
    }

    // 6. Número após vírgula (caso pequeno valor)
    const afterComma = raw.match(/,\s*(\d+)/);
    if (afterComma) {
      const n = this.normalize(afterComma[1]);
      return parseFloat(n);
    }

    // 7. Se sobrou só um → ele é o valor
    if (noParcel.length === 1) {
      return parseFloat(noParcel[0].normalized);
    }

    // 8. Caso final: pega o último número válido na frase
    return parseFloat(noParcel[noParcel.length - 1].normalized);
  }

  /**
   * Normalização inteligente: detecta quando o ponto é decimal real.
   */
  private normalize(n: string): string {
    const hasComma = n.includes(',');
    const hasDot = n.includes('.');

    // Caso BR 1.234,56
    if (hasComma && hasDot) {
      return n.replace(/\./g, '').replace(',', '.');
    }

    // Caso BR com vírgula decimal 43,50
    if (hasComma && !hasDot) {
      return n.replace(',', '.');
    }

    // Caso EN com ponto decimal 43.40
    if (!hasComma && hasDot) {
      const first = n.indexOf('.');
      const last = n.lastIndexOf('.');

      // Só um ponto → decimal real
      if (first === last) return n;

      // Vários pontos → milhares
      return n.replace(/\./g, '');
    }

    // Inteiro puro
    return n;
  }

  /**
   * Extrai o valor usando regex
   * Se falhar, cai para o classificador tradicional
   */
  async classify(text: string): Promise<number | null> {
    // 1. Primeiro tenta extrair com regex
    const extracted = this.extract(text);
    if (extracted) {
      return extracted;
    }

    // 2. Se não encontrou nada → usa o classificador treinado
    const label = await super.classify(text);

    if (!label) return null;
    // Converte rótulo salvo em número real
    const parsed = parseFloat(label.toString().replace(',', '.'));
    if (isNaN(parsed)) return null;

    return parsed;
  }
}
