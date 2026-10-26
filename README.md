# Goku Run — Campanha por Sagas

Runner para PC e Android construído com Angular 21, Phaser 4 e Capacitor 8.

## Campanha

O jogo agora é dividido em capítulos inspirados nas grandes sagas, com 15 fases principais de 30 segundos e um chefe próprio em cada fase:

- Saga dos Saiyajins — Raditz, Nappa e Vegeta.
- Saga de Freeza — Recoome, Burter + Jeice, Capitão Ginyu e Freeza.
- Androides e Cell — Androide 19 e Cell.
- Majin Boo — Yakon, Majin Vegeta, Majin Boo Gordo, Super Boo, ilusões e Kid Boo.
- Bônus — depois de derrotar Kid Boo, o Torneio do Outro Mundo libera Caterpy, Maraikoh e Paikuhan.

Cada fase muda cenário, pressão dos obstáculos e padrão do chefe. Vegeta, por exemplo, alterna voo/mergulho, investidas e rajadas. A dificuldade cresce com velocidade, buracos, rochas, inimigos aéreos e intervalos menores.

Detalhes completos: [campanha por sagas](docs/CAMPAIGN.md).

## Jogar no PC

Abra [ABRIR_JOGO.bat](ABRIR_JOGO.bat), ou execute `npm install` e `npm run dev`, depois acesse <http://localhost:5173>. Requer Node.js 22.12 ou superior. O jogo usa módulos e precisa ser servido; não abra o HTML diretamente.

## Controles

- Celular: toque na área do jogo para pular; outro toque no ar dá pulo duplo. KI e pausa têm botões próprios.
- PC: Espaço, seta para cima ou W pula; K ativa KI; P pausa; M alterna o som.
- Oito esferas completam o KI. O efeito dura seis segundos e triplica os pontos.
- Ao morrer, a campanha reinicia a fase atual em vez de voltar ao começo do jogo.

## Arquitetura

Angular controla a aplicação, menu, HUD, overlays e ciclo de vida. Phaser controla cena, renderização, animação, Arcade Physics, entradas, chefes e áudio. O modelo base em [js/game.js](js/game.js) continua determinístico em passo fixo de 60 Hz; a campanha é aplicada por uma camada própria para preservar os testes históricos e o modo de QA.

O Goku continua usando a animação aprovada derivada de [goku-running-source.gif](assets/game/player/goku-running-source.gif). A arte do jogador e sua hitbox não foram substituídas.

O chão mantém a textura seamless aprovada, mas a campanha a renderiza em blocos rígidos de 256 px, ancora a fase da textura em coordenadas inteiras, arredonda pixels na câmera e desenha bordas de início/fim de plataforma. A colisão continua independente da arte, então buracos e plataformas permanecem corretos.

Os chefes possuem sprites vetoriais de runtime próprios; encontros duplos e ilusões são compostos por múltiplos personagens e cada chefe tem um conjunto de padrões de ataque.

## Testes

```text
npm run build
npm test
npm run test:campaign
npm run test:visual
npm run test:player-native
npm run test:mobile
npm run test:story
npm run test:browser
```

`?debug=1` expõe `window.__gokuRun` para os testes e mantém a simulação histórica de cinco ambientes. `?autostart=1` pula o menu no modo de QA.

## Cloudflare e Android

O deploy web continua usando `wrangler.jsonc` e publica `./dist` como SPA na Cloudflare. Não foi adicionado backend nem nova dependência de runtime.

Use `npm run android:apk` para gerar o APK. Requer JDK 21 e Android SDK. A aplicação é horizontal e pausa quando perde o foco. Antes de publicar comercialmente, revise direitos dos personagens, músicas, imagens e requisitos das lojas.
