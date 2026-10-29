# NogVita Web

Front-end em Angular do **NogVita**, uma plataforma de nutrição que conecta pacientes, nutricionistas e administradores. Consome a [NogVita API](https://github.com/Lgustavo44/NogVitaApi).

## Status

As telas estão sendo construídas uma por vez, de ponta a ponta (visual, integração com a API e testes).

| Tela                                                                                                  | Situação                         |
| ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| Login, cadastro do paciente, esqueci/redefinir senha, confirmação de e-mail, convite do nutricionista | Prontas                          |
| Escolha de área (contas com mais de um papel)                                                         | Pronta                           |
| Início do paciente, do nutricionista e do admin                                                       | Prontos, com dados reais da API  |
| Perfis do paciente e do nutricionista                                                                 | Prontos                          |
| Paciente: encontrar nutricionista, minhas solicitações, meu nutricionista, meu peso                   | Prontas                          |
| Nutricionista: solicitações, meus pacientes e detalhe do paciente (com o peso)                        | Prontas                          |
| Nutricionista: alimentos (busca TACO/Open Food Facts, ficha e importação por código de barras)        | Prontas                          |
| Nutricionista: planos alimentares (criar, refeições, alimentos, meta diária, ativar/finalizar, PDF)   | Prontas                          |
| Paciente: plano alimentar (atual e anteriores, baixar PDF, receber por e-mail)                        | Prontas                          |
| Telas do admin                                                                                        | Aparecem no menu como "Em breve" |

A sessão fica no `sessionStorage` (sobrevive ao recarregar, some ao fechar a aba) e o token é renovado automaticamente, uma renovação por vez.

O app é responsivo (pensado primeiro para o celular) e tem tema claro, escuro ou igual ao do sistema.

## Stack

- [Angular 22](https://angular.dev) (componentes standalone, zoneless, modo estrito, Signal Forms)
- [Tailwind CSS 4](https://tailwindcss.com), [Angular CDK e Angular Aria](https://angular.dev)
- Fonte [Inter](https://rsms.me/inter/) e ícones [Lucide](https://lucide.dev), servidos pelo próprio app
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
  core/                 serviços únicos do app (API, autenticação, interceptors, guards, tema)
  shared/
    ui/                 componentes do design system (botão, campo, alerta, logo...)
    layout/             layout público (card) e AppShell (menu lateral, cabeçalho, menu da conta)
    domain/             enums e tipos da API usados por mais de uma área
    weight/             painel de peso (gráfico, histórico, registro), usado pelo paciente e pelo nutricionista
    food/               peças de alimento (fonte, atribuição, nutrientes, divisão das calorias)
    plan/               peças do plano (status, card da refeição, resumo do dia), usadas pelo nutricionista e pelo paciente
  features/
    auth/               login, cadastro, confirmação de e-mail, senha, convite
    patient/            área do paciente
    nutritionist/       área do nutricionista
    admin/              painel do administrador
src/environments/       URL da API por ambiente (público: nada de segredos aqui)
```

Regras: uma feature não importa de outra; `shared` não importa de `features`.

## Design system

As cores, a tipografia, os raios e as sombras são tokens em `src/styles.css`, com nomes de uso (`bg-surface`, `text-ink-muted`, `bg-primary`...). Os componentes nunca usam a cor direta, e o modo escuro troca só os tokens. As combinações de texto passam no contraste do WCAG AA.

## API

- [Guia de consumo da API](https://github.com/Lgustavo44/NogVitaApi/blob/main/docs/API.md)
- [Swagger do staging](https://nogvitaapi.onrender.com/swagger/index.html)
