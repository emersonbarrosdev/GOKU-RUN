# Arte ativa

| Arquivo | Uso |
| --- | --- |
| [goku-run.png](../assets/game/player/goku-run.png) | Goku: dez frames, grid 5 × 2, células 256 × 256 |
| [goku-running-source.gif](../assets/game/player/goku-running-source.gif) | Referência preservada e preview da introdução |
| [ground-tile.png](../assets/game/ground/ground-tile.png) | Chão definitivo único, 1024 × 256, repetição horizontal |
| [enemies_fullbody_v7.png](../assets/spritesheets/enemies_fullbody_v7.png) | Inimigos existentes |
| [friends_motion_v4.png](../assets/spritesheets/friends_motion_v4.png) | Aliados existentes |
| [ground_enemy_sheet.png](../assets/spritesheets/ground_enemy_sheet.png) | Cristal e rocha existentes |

[NativePlayer](../js/native-player.mjs) usa spritesheet, animação Phaser, corpo Arcade e `TileSprite` para o terreno. O player mantém escala 0,65, origem no contato do pé e ciclo base de aproximadamente 548 ms.

`npm run art:import-gif` reproduz a conversão do player. `npm run test:visual` compara os pixels visíveis com o GIF e verifica que as duas bordas do chão são exatamente iguais.

As experiências `goku_run_v12`, `terrain_tiles_v5` e folhas procedurais não são copiadas para o build nem carregadas pelo runtime.
