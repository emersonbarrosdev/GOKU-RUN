# Task 1 — player polido

## Resultado

A referência animada escolhida pelo usuário está na gameplay normal. O Goku permanece na escala **0,65**, com altura visual aproximada de 130 px e hitbox de 41,6 × 93,6. A física não é alterada pelo cabelo, pelos braços nem pelo acabamento visual.

A corrida usa os dez quadros reais da referência, ciclo base aproximado de **0,55 s** e cerca de **18,2 quadros distintos por segundo**. A taxa acompanha a velocidade das fases. Para reduzir a troca dura entre poses sem inventar membros ou interpolar anatomia, o renderer aplica:

- eco do quadro anterior por no máximo 42 ms, com opacidade máxima 0,14;
- balanço contínuo de até 0,32° em torno do contato do pé;
- origem fixa em Y=240 da célula, mantendo os pés em Y=560 sem deriva.

Os dois lados da passada estão presentes no GIF escolhido. Pulos usam poses aéreas da mesma folha; Arcade Physics controla pulo, queda, pulo duplo e colisões.

## Arte e implementação

- [Folha do player](../assets/game/player/goku-run.png): 1280 × 512, grid 5 × 2, dez células de 256 × 256.
- [Referência preservada](../assets/game/player/goku-running-source.gif): dez quadros transparentes.
- [Implementação Phaser](../js/native-player.mjs): player, animação, corpo Arcade e chão repetível.
- [Teste de integração](../tests/native-player.cjs): duração real, poses, suavização, pés, hitbox, pulo, pausa e viewport.
- [Teste de fidelidade](../tests/gif-fidelity.cjs): comparação RGBA de cada quadro.

As folhas procedurais experimentais antigas não são carregadas pela aplicação.
