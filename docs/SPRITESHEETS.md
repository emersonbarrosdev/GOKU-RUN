# Arte da versão Phaser

| Arquivo | Uso |
| --- | --- |
| [goku_run_v11.png](../assets/spritesheets/goku_run_v11.png) | 8 quadros biomecânicos: contato, apoio, passagem e voo para cada perna |
| [goku_stride_v8.png](../assets/spritesheets/goku_stride_v8.png) | 4 quadros de salto usados pelo runtime |
| [enemies_fullbody_v7.png](../assets/spritesheets/enemies_fullbody_v7.png) | Corrida para esquerda, voo, carga e disparo |
| [friends_motion_v4.png](../assets/spritesheets/friends_motion_v4.png) | 4 gestos por aliado |
| [terrain_ground_v4.png](../assets/spritesheets/terrain_ground_v4.png) | Fonte visual do chão, pré-colorida por fase no carregamento |
| [ground_enemy_sheet.png](../assets/spritesheets/ground_enemy_sheet.png) | Cristal e rocha |
| [menu_clean_v4.png](../assets/ui/menu_clean_v4.png) | Menu com botões HTML independentes |

Panoramas separados:

- [Namek](../assets/backgrounds/namek_panorama_v7.png): 2048 × 768.
- [Floresta](../assets/backgrounds/forest_panorama_v7.png): 2170 × 725.
- [Cânion](../assets/backgrounds/canyon_panorama_v7.png): 2172 × 724.
- [Cidade](../assets/backgrounds/city_panorama_v7.png): 2172 × 724.
- [Vulcão](../assets/backgrounds/lava_panorama_v7.png): 2048 × 768.

Os recortes e pivôs finais ficam em [goku-visual-config.js](../js/goku-visual-config.js). A corrida usa uma única escala `108/321`; poses recolhidas não são ampliadas para preencher a célula.

[main.js](../js/main.js) prepara células de 160 × 160 com quadros completos. A corrida acompanha a distância do mundo, o salto seleciona quatro poses pela física e toda preparação de textura ocorre uma vez no carregamento.

## Tileset do chão

O runtime usa três peças explícitas por fase:

1. canto esquerdo de 40 × 164 px;
2. meio repetível de 840 × 164 px;
3. canto direito de 40 × 164 px.

O meio é construído por espelhamento e tem pixels idênticos nas duas emendas. O deslocamento usa `Math.floor(distance)` e os cantos também recebem coordenadas inteiras. A máscara geométrica das plataformas é independente da imagem: ela abre os buracos físicos, enquanto os cantos apenas desenham o acabamento. Assim, a altura da arte não interfere na colisão.

Folhas antigas e o atlas de baixa resolução não são carregados pelo jogo.
