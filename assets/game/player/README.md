# Player — referência GIF escolhida pelo usuário

Fonte: [Goku Dragon Ball, publicado por Skc03 no Tenor](https://tenor.com/view/goku-dragon-ball-dragon-ball-z-running-gif-8114153398015504637). A indicação da fonte não constitui licença comercial.

- [Original](goku-running-source.gif): 228 × 201, 10 frames transparentes.
- [Folha](goku-run.png): 1280 × 512, grid 5 × 2, células 256 × 256 em ordem de leitura.
- Conversão sem redesenho ou reescala: padding fixo X=14, Y=40. `npm run art:import-gif` usa FFmpeg/FFprobe.
- Durações originais: 30,30,30,40,40,30,30,30,40,40 ms. No Phaser 4 são durações absolutas, não adicionais.
- Gameplay: escala 0,65; playbackRate 0,5 na primeira fase; ciclo esperado 680 ms (média 14,7 quadros/s). A taxa acompanha proporcionalmente a velocidade das fases.
- Origem (0,5; 240/256), chão lógico Y=560; aproximadamente 130 px de altura visual.
- Hitbox Arcade 64 × 144 com offset (96,96), resultando em 41,6 × 93,6 no mundo.

Implementação: [native-player.mjs](../../../js/native-player.mjs). Validação de pixels: `npm run test:visual`. Integração, duração real, pulos e viewport: `npm run test:player-native`.

O asset está ativo na gameplay normal; o aceite visual final continua sendo do usuário. O chão é neutro e temporário nesta etapa.
