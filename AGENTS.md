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
- Acuracia de `category` e `account` melhorou, mas ainda ha risco de regressao sem blindagem no codigo.

### Prioridade Alta

1. Blindar canonizacao de labels de `category` e `account` no codigo.

- Tratar `userCorrectedJson.category/account` como UUID ou texto durante o treino.
- Resolver UUID para nome em `bk_tb_categories`/`bk_tb_accounts` antes de `addDocument`.
- Garantir que o classificador textual seja treinado apenas com labels textuais canonicos.

1. Filtrar amostras invalidas no pipeline de treino.

- Ignorar exemplos com `label` nulo, vazio ou indefinido.
- Em fluxos de transferencia, nao treinar `account/category` com exemplos que so possuem `origin/destiny`.

1. Separar treino por contexto de intent.

- `intent=create`: treinar `account` e `category`.
- `intent=transfer`: treinar `origin/destiny` (ou classificador dedicado para transferencia).

### Prioridade Media

1. Endurecer validacao de contrato de feedback.

- Validar payloads de aprovacao por `status` e `intent`.
- Exigir campos corrigidos coerentes quando `status=corrected`.

1. Suporte multi-tenant em feedback.

- Adicionar coluna `owner` em `bk_nlp_feedback`.
- Salvar `owner` no momento do parse e aplicar filtros por owner no treino e analises.

### Prioridade Baixa

1. Melhorar normalizacao textual para `category/account`.

- Normalizar acentos e variantes comuns (`mercadinho/mercadinnho`, `cartao/cartão`).
- Adicionar regras lexicais para padroes bancarios recorrentes.
