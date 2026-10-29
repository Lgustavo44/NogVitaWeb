# NogVita Web

Front-end em Angular do **NogVita**, uma plataforma de nutrição que conecta pacientes, nutricionistas e administradores. Consome a [NogVita API](https://github.com/Lgustavo44/NogVitaApi).

## Status

**Fase 0: fundação.** O projeto, o lint, a formatação, os testes, o proxy para a API e a integração contínua estão configurados. Ainda não há telas.

## Stack

- [Angular 22](https://angular.dev) (componentes standalone, zoneless, modo estrito)
- [Vitest](https://vitest.dev) para os testes unitários
- [ESLint](https://eslint.org) com [angular-eslint](https://github.com/angular-eslint/angular-eslint)
- [Prettier](https://prettier.io)
- GitHub Actions (lint, testes e build a cada push e pull request)

## Pré-requisitos

- Node.js `^22.22.3`, `^24.15.0` ou `>=26` (exigência do Angular 22)
- npm 11

## Como rodar

```powershell
npm ci
npm start
```

Abra `http://localhost:4200`.

Em desenvolvimento, o `ng serve` usa um proxy (`proxy.conf.json`): as chamadas para `/api` e `/health` saem de `localhost:4200` e são encaminhadas para a API de staging (`https://nogvitaapi.onrender.com`). Assim, o CORS da API não precisa liberar a porta 4200.

> A API de staging roda no plano gratuito da Render e "dorme" depois de 15 minutos sem uso. A primeira requisição pode levar cerca de 1 minuto.

## Scripts

| Comando                     | O que faz                                     |
| --------------------------- | --------------------------------------------- |
| `npm start`                 | Servidor de desenvolvimento com o proxy       |
| `npm run build`             | Build de produção em `dist/`                  |
| `npm test`                  | Testes unitários (Vitest), em modo observação |
| `npx ng test --watch=false` | Testes unitários uma vez só (como na CI)      |
| `npm run lint`              | ESLint                                        |
| `npm run format`            | Formata o código com o Prettier               |
| `npm run format:check`      | Confere a formatação sem alterar nada         |

## Estrutura

```text
src/app/
  core/                 serviços únicos do app (API, autenticação, interceptors, guards)
  shared/               componentes, pipes e diretivas reutilizáveis, sem regra de negócio
  features/
    auth/               login, cadastro, confirmação de e-mail, senha, convite
    patient/            área do paciente
    nutritionist/       área do nutricionista
    admin/              painel do administrador
src/environments/       URL da API por ambiente (público: nada de segredos aqui)
```

Regras: uma feature não importa de outra; `shared` não importa de `features`.

## API

- [Guia de consumo da API](https://github.com/Lgustavo44/NogVitaApi/blob/main/docs/API.md)
- [Swagger do staging](https://nogvitaapi.onrender.com/swagger/index.html)
