# Arte ativa na Task 1

O player usa o GIF escolhido pelo usuário, convertido em uma única folha transparente sem alterar os pixels das poses.

| Arquivo | Uso |
| --- | --- |
| [goku-run.png](../assets/game/player/goku-run.png) | 10 frames, grid 5 × 2, células 256 × 256 |
| [goku-running-source.gif](../assets/game/player/goku-running-source.gif) | Referência preservada e preview da introdução |
| [enemies_fullbody_v7.png](../assets/spritesheets/enemies_fullbody_v7.png) | Inimigos existentes |
| [friends_motion_v4.png](../assets/spritesheets/friends_motion_v4.png) | Aliados existentes |
| [ground_enemy_sheet.png](../assets/spritesheets/ground_enemy_sheet.png) | Cristal e rocha existentes |

[NativePlayer](../js/native-player.mjs) usa spritesheet, animação Phaser e corpo Arcade. Escala 0,65; origem (0,5; 240/256); ciclo base de 680 ms com tempos relativos originais. Não existe atlas manual de baixa resolução para o novo player. Pulos usam poses aéreas 3 e 8.

`npm run art:import-gif` reproduz a conversão com FFmpeg. `npm run test:visual` compara todos os pixels visíveis com o GIF. [Contrato e procedência](../assets/game/player/README.md).

## Chão e etapas posteriores

O chão atual é **neutro e temporário**, com corpos estáticos por plataforma. Não é a entrega do chão definitivo. O tileset experimental v5 e a folha procedural v12 foram rejeitados e não são carregados pela gameplay atual.

A reestruturação (Task 2) e o chão definitivo (Task 3) aguardam aprovação explícita do player. [Estado da Task 1](TASK1-PLAYER-STATUS.md).
