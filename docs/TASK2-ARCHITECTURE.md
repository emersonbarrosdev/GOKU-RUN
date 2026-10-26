# Task 2 — arquitetura Angular + Phaser

## Divisão de responsabilidades

Angular 21 é a casca da aplicação: monta menu, HUD, botões, overlays e controla criação/destruição do jogo. Phaser 4.2.1 é o motor: desenha a cena, executa animações e áudio, recebe entradas e mantém Arcade Physics. O modelo determinístico em [game.js](../js/game.js) preserva regras, progressão e passo fixo de 60 Hz.

O componente [game.component.ts](../src/app/game.component.ts) cria uma única instância por montagem e recebe um estado simples pela ponte de UI. [bootstrap.js](../js/bootstrap.js) expõe inicialização e limpeza. [main.js](../js/main.js) remove listeners, observadores e integração Capacitor ao destruir a instância. A história mantém seu overlay narrativo especializado, também com limpeza explícita.

O renderizador Canvas legado e a inicialização automática antiga foram removidos. O compilador Angular enxerga apenas o contrato TypeScript em [js-runtime.d.ts](../src/js-runtime.d.ts); o JavaScript do motor é empacotado sem esconder problemas das bibliotecas Angular com `skipLibCheck`.

## Build

`npm run build` gera `dist/` com `baseHref` relativo, adequado a hospedagem e Capacitor. Apenas os assets de produção são copiados. Angular 21 foi escolhido por ser a linha compatível com o Node 24.13 disponível; atualizar para Angular 22 exigiria Node 24.15 ou superior.
