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
