# Player — referência GIF escolhida pelo usuário

Fonte: [Goku Dragon Ball, publicado por Skc03 no Tenor](https://tenor.com/view/goku-dragon-ball-dragon-ball-z-running-gif-8114153398015504637). A indicação da fonte não constitui licença comercial.

- [Original](goku-running-source.gif): 228 × 201, dez frames transparentes.
- [Folha](goku-run.png): 1280 × 512, grid 5 × 2, células 256 × 256 em ordem de leitura.
- Conversão sem redesenho ou reescala: padding fixo X=14, Y=40. `npm run art:import-gif` usa FFmpeg/FFprobe.
- Durações originais: 30,30,30,40,40,30,30,30,40,40 ms. No Phaser 4 são durações absolutas.
- Gameplay: escala 0,65; playbackRate 0,62 na primeira fase; ciclo esperado de aproximadamente 548 ms e 18,2 quadros distintos/s. A taxa acompanha a velocidade das fases.
- Origem (0,5; 240/256), chão lógico Y=560; aproximadamente 130 px de altura visual.
- Hitbox Arcade 64 × 144 com offset (96,96), resultando em 41,6 × 93,6 no mundo.
- Acabamento visual: eco anterior de 42 ms/opacidade 0,14 e balanço máximo de 0,32°, sem alterar o corpo físico.

Implementação: [native-player.mjs](../../../js/native-player.mjs). Validação de pixels: `npm run test:visual`. Integração, duração real, pulos e viewport: `npm run test:player-native`.
