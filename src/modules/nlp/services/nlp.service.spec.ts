import { NlpService } from './nlp.service';

describe('NlpService transfer extraction heuristics', () => {
  const categoryRepository = { find: jest.fn() };
  const accountRepository = { find: jest.fn() };
  const feedbackService = { save: jest.fn() };

  let service: NlpService;
  const intentClassify = jest.fn();
  const accountClassify = jest.fn();
  const categoryClassify = jest.fn();
  const valueClassify = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NlpService(
      categoryRepository as never,
      accountRepository as never,
      feedbackService as never,
    );

    (
      service as unknown as {
        intentProcessor: { classify: typeof intentClassify };
      }
    ).intentProcessor = { classify: intentClassify };
    (
      service as unknown as {
        accountProcessor: { classify: typeof accountClassify };
      }
    ).accountProcessor = { classify: accountClassify };
    (
      service as unknown as {
        categoriesProcessor: { classify: typeof categoryClassify };
      }
    ).categoriesProcessor = { classify: categoryClassify };
    (
      service as unknown as {
        valueProcessor: { classify: typeof valueClassify };
      }
    ).valueProcessor = { classify: valueClassify };
  });

  it('extracts origin and destiny with pro/pra/para patterns', async () => {
    intentClassify.mockResolvedValue('transfer');
    valueClassify.mockResolvedValue(70);
    accountClassify.mockImplementation((input: string) => {
      if (input.includes('santander')) return Promise.resolve('Santander');
      if (input.includes('nubank nick')) return Promise.resolve('Nubank Nick');
      return Promise.resolve('Conta desconhecida');
    });

    const result = await service.extractEntities(
      'Na conta santander, dia 11/11, transferi 70 pro nubank nick',
    );

    expect(result.origin).toBe('Santander');
    expect(result.destiny).toBe('Nubank Nick');
  });

  it('keeps destiny extraction stable with article before account name', async () => {
    intentClassify.mockResolvedValue('transfer');
    valueClassify.mockResolvedValue(212.8);
    accountClassify.mockImplementation((input: string) => {
      if (input.includes('santander')) return Promise.resolve('Santander');
      if (input.includes('mercado pago') || input.includes('mercado'))
        return Promise.resolve('Mercado Pago');
      return Promise.resolve('Conta desconhecida');
    });

    const result = await service.extractEntities(
      'Na conta santander, dia 08/11, transferi 212.8 para o mercado',
    );

    expect(result.origin).toBe('Santander');
    expect(result.destiny).toBe('Mercado Pago');
  });
});
