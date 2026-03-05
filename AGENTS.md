# AGENTS.md

## Escopo
Este guia vale apenas para `banky-nlp` (API de NLP).
Antes de editar, confirme se a tarefa pertence a este projeto e nao ao `banky_api` ou `banky_app`.

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

### Prioridade Alta
1. Canonizar labels de `category` e `account` antes do treino.
- Quando `userCorrectedJson.category/account` vier como UUID, resolver para nome em `bk_tb_categories`/`bk_tb_accounts`.
- Garantir que o classificador textual seja treinado apenas com labels textuais canonicos.

2. Filtrar amostras invalidas no pipeline de treino.
- Ignorar exemplos com `label` nulo, vazio ou indefinido.
- Em fluxos de transferencia, nao treinar `account/category` com exemplos que so possuem `origin/destiny`.

3. Separar treino por contexto de intent.
- `intent=create`: treinar `account` e `category`.
- `intent=transfer`: treinar `origin/destiny` (ou classificador dedicado para transferencia).

### Prioridade Media
4. Endurecer validacao de contrato de feedback.
- Validar payloads de aprovacao por `status` e `intent`.
- Exigir campos corrigidos coerentes quando `status=corrected`.

5. Suporte multi-tenant em feedback.
- Adicionar coluna `owner` em `bk_nlp_feedback`.
- Salvar `owner` no momento do parse e aplicar filtros por owner no treino e analises.

### Prioridade Baixa
6. Melhorar normalizacao textual para `category/account`.
- Normalizar acentos e variantes comuns (`mercadinho/mercadinnho`, `cartao/cartão`).
- Adicionar regras lexicais para padroes bancarios recorrentes.
