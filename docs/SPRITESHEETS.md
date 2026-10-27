# Arte ativa

| Arquivo | Uso |
| --- | --- |
| [goku-run.png](../assets/game/player/goku-run.png) | Goku: dez frames, grid 5 × 2, células 256 × 256 |
| [goku-running-source.gif](../assets/game/player/goku-running-source.gif) | Fonte visual preservada do Goku |
| [ground-tile.png](../assets/game/ground/ground-tile.png) | Chão definitivo único, 1024 × 256, repetição horizontal |
| [raditz-spritesheet.png](../assets/game/bosses/raditz-spritesheet.png) | Raditz: oito frames raster, grid 4 × 2, células 256 × 256; idle, investida, disparo e mergulho |
| [story-raditz.png](../assets/game/story/story-raditz.png) | Retrato do Raditz usado na introdução e loading da fase |
| [story-combat.png](../assets/game/story/story-combat.png) | Emblema de padrões de combate |
| [story-tournament.png](../assets/game/story/story-tournament.png) | Emblema do Torneio do Outro Mundo |
| [enemies_fullbody_v7.png](../assets/spritesheets/enemies_fullbody_v7.png) | Inimigos existentes |
| [friends_motion_v4.png](../assets/spritesheets/friends_motion_v4.png) | Aliados existentes |
| [ground_enemy_sheet.png](../assets/spritesheets/ground_enemy_sheet.png) | Cristal e rocha existentes |

`NativePlayer` usa spritesheet, animação Phaser, corpo Arcade e `TileSprite` para o terreno. O player mantém escala 0,65, origem no contato do pé e ciclo base de aproximadamente 548 ms.

O Raditz da primeira fase não usa `Graphics`/vetor procedural: o runtime carrega `raditz-spritesheet.png` e troca frames conforme o padrão do chefe.

`npm run art:import-gif` reproduz a conversão do player. `npm run test:visual` compara os pixels visíveis com o GIF e verifica que as duas bordas do chão são exatamente iguais.

As experiências `goku_run_v12`, `terrain_tiles_v5` e folhas procedurais não são copiadas para o build nem carregadas pelo runtime.
