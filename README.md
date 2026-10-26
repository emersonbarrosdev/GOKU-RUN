# Goku Run — Cinco Mundos

Runner para PC e Android construído com Angular 21, Phaser 4 e Capacitor 8.

## Jogar no PC

Abra [ABRIR_JOGO.bat](ABRIR_JOGO.bat), ou execute `npm install` e `npm run dev`, depois acesse <http://localhost:5173>. Requer Node.js 22.12 ou superior. O jogo usa módulos e precisa ser servido; não abra o HTML diretamente.

## Controles

- Celular: toque na área do jogo para pular; outro toque no ar dá pulo duplo. KI e pausa têm botões próprios.
- PC: Espaço, seta para cima ou W pula; K ativa KI; P pausa; M alterna o som.
- Oito esferas completam o KI. O efeito dura seis segundos e triplica os pontos.
- Cinco etapas de 30 segundos: Namek, floresta, cânion, cidade e vulcão.

## Arquitetura

Angular controla a aplicação, menu, HUD, overlays e ciclo de vida. Phaser controla cena, renderização, animação, Arcade Physics, entradas e áudio. O modelo determinístico em [js/game.js](js/game.js) avança em passo fixo de 60 Hz; o antigo renderizador Canvas foi removido.

O Goku usa uma folha única de dez quadros proveniente da referência escolhida. A corrida tem ciclo base de aproximadamente 0,55 s, balanço sutil no pivô do pé e um eco de quadro muito curto para suavizar a troca sem alterar hitbox ou física. O chão usa uma única textura horizontal perfeitamente repetível; cada plataforma mantém corpo de colisão independente, portanto os buracos continuam reais.

Detalhes: [arquitetura Angular + Phaser](docs/TASK2-ARCHITECTURE.md), [player](docs/TASK1-PLAYER-STATUS.md), [chão](docs/TASK3-GROUND-STATUS.md) e [spritesheets](docs/SPRITESHEETS.md).

## Testes

```text
npm run build
npm test
npm run test:visual
npm run test:player-native
npm run test:mobile
npm run test:story
npm run test:browser
```

`?debug=1` expõe `window.__gokuRun` para os testes e não salva recordes. `?autostart=1` pula o menu.

## Android

Use `npm run android:apk` para gerar o APK. Requer JDK 21 e Android SDK. A aplicação é horizontal e pausa quando perde o foco. Antes de publicar comercialmente, revise direitos dos personagens, músicas, imagens e requisitos das lojas.
