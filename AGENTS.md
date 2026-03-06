# AGENTS.md

## Escopo

Este guia vale apenas para `banky-nlp` (API de NLP).
Antes de editar, confirme se a tarefa pertence a este projeto e nao ao `banky_api` ou `banky_app` ou `banky_mcp`.

## Stack e Estrutura

- Framework: NestJS + Fastify.
- Persistencia: TypeORM + MySQL.
- Validacao/contratos: Zod + Swagger.
- Modulos principais em `src/modules`: `feedback`, `health`, `nlp`.
- Modulo compartilhado: `src/modules/shared.module.ts`.

## Comandos

Execute dentro de `banky-nlp/`.

- Instalar dependencias: `pnpm install`
- Desenvolvimento: `pnpm run start:dev`
- Build: `pnpm run build`
- Testes: `pnpm run test`, `pnpm run test:e2e`, `pnpm run test:cov`
- Lint e formatacao: `pnpm run lint`, `pnpm run format`

## Variaveis de Ambiente

- Nao ha `.env.example` neste projeto.
- Seguir `src/common/config/env.config.ts` para variaveis obrigatorias.
- Variaveis criticas: `PORT`, JWT e banco MySQL.
- Nunca commitar segredos em `.env`.

## Integracoes e Observacoes

- Existe integracao RabbitMQ no codigo, mas `RabbitModule` esta comentado em `src/app.module.ts`.
- Ao alterar contrato de NLP (rota/DTO/schema), alinhar consumidores impactados.

## Diretrizes de Mudanca

- Nao editar `dist/`, `node_modules/` ou arquivos gerados.
- Manter mudancas pequenas e focadas no requisito.
- Preservar padroes existentes de modulos, naming e injecao de dependencias.

## Validacao Minima Antes de Concluir

1. Rodar `pnpm run lint`.
2. Rodar `pnpm run build` e testes relevantes para a mudanca.
3. Atualizar a versao do projeto quando houver alteracao funcional (semver).
4. Comitar seguindo o padrao de commit adotado no repositorio.

## Referencia Cruzada

Seguir tambem as regras gerais em `../AGENTS.md`.

## Proximos Passos (Backlog NLP)

Status atual:

- Correcao pontual de dados ja aplicada no banco: `userCorrectedJson.account/category` convertido de UUID para texto em 54 linhas de feedback.
- Blindagem de treino por `intent` aplicada (create vs transfer), com filtro de amostras invalidas.
- Contrato de aprovacao por `status/intent` endurecido para `status=corrected`.
- Suporte multi-tenant em feedback aplicado com coluna `owner`, persistencia no parse e filtros no treino/listagem.
- Suíte de regressao dos 4 classifiers expandida para 40 casos por classe (baseada em feedbacks corrigidos).

### Prioridade Alta

1. Fechar isolamento de tenant ponta a ponta (sem fallback silencioso).

- Trocar fallback `owner='global'` por owner obrigatorio vindo de contexto autenticado.
- Bloquear treino/listagem sem owner quando a operacao for tenant-scoped.

1. Ajustar o treinamento agendado para multi-tenant.

- Rodar `retrain` por owner (iterando tenants ativos), evitando misturar sinais entre usuarios.
- Evitar que cron noturno re-treine feedback de todos os owners em uma passada unica.

1. Cobrir fluxo completo de parse+approve+train com testes e2e.

- Validar cenarios `create` e `transfer` por owner.
- Garantir que payload invalido de aprovacao retorne erro consistente de contrato.

### Prioridade Media

1. Endurecer validacao de entrada via DTO/schema.

- Mover validacoes de contrato de feedback para schema (Zod/class-validator) alem da regra de servico.
- Padronizar mensagens/codigos de erro para clientes.

1. Evoluir modelo de owner no banco.

- Backfill de dados legados que ainda estejam com owner nulo/`global`.
- Adicionar indice em `bk_nlp_feedback(owner, status, usedForTraining)` para melhorar treino/listagem.

1. Propagar `owner` para analiticos externos.

- Garantir que consumidores de analise usem filtro por owner como padrao.
- Definir modo explicito para agregacao cross-tenant apenas quando solicitado.

### Prioridade Baixa

1. Melhorar normalizacao textual para `category/account`.

- Normalizar acentos e variantes comuns (`mercadinho/mercadinnho`, `cartao/cartão`).
- Adicionar regras lexicais para padroes bancarios recorrentes.

1. Melhorar heuristicas de entidades para transferencia.

- Refinar regex de origem/destino para frases com preposicoes variadas (`pro`, `pra`, `de`).
- Reduzir ambiguidades quando houver mais de duas contas citadas no mesmo texto.
