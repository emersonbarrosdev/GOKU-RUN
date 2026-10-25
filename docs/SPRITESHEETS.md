# Arte da versão Phaser

| Arquivo | Uso |
| --- | --- |
| [goku_run_v10.png](../assets/spritesheets/goku_run_v10.png) | 8 quadros de corrida: contato, compressão, passagem e voo para cada perna |
| [goku_stride_v8.png](../assets/spritesheets/goku_stride_v8.png) | 4 quadros de salto usados pelo runtime |
| [enemies_fullbody_v7.png](../assets/spritesheets/enemies_fullbody_v7.png) | Corrida para esquerda, voo, carga e disparo |
| [friends_motion_v4.png](../assets/spritesheets/friends_motion_v4.png) | 4 gestos por aliado; sem nomes |
| [terrain_ground_v4.png](../assets/spritesheets/terrain_ground_v4.png) | Chão contínuo, pré-colorido por fase |
| [ground_enemy_sheet.png](../assets/spritesheets/ground_enemy_sheet.png) | Cristal e rocha |
| [menu_clean_v4.png](../assets/ui/menu_clean_v4.png) | Menu com botões HTML independentes |

Panoramas separados, não pequenos recortes de um atlas:

- [Namek](../assets/backgrounds/namek_panorama_v7.png): 2048 × 768.
- [Floresta](../assets/backgrounds/forest_panorama_v7.png): 2170 × 725.
- [Cânion](../assets/backgrounds/canyon_panorama_v7.png): 2172 × 724.
- [Cidade](../assets/backgrounds/city_panorama_v7.png): 2172 × 724.
- [Vulcão](../assets/backgrounds/lava_panorama_v7.png): 2048 × 768.

Recortes e pivôs ficam em [game.js](../js/game.js). Escala de Goku: `108/307` em corrida e salto. Poses encolhidas não são ampliadas por altura do recorte. A silhueta muda com a postura.

[main.js](../js/main.js) prepara células de 160 × 160 com quadros completos. A corrida usa oito quadros e acompanha a velocidade da fase. O salto seleciona quatro poses conforme a física. Aliados usam 0–1–2–3–2–1. Remoção de halo e preparação das texturas acontecem uma vez no carregamento.

O terreno repete textura de 840 px em coordenadas do mundo. A máscara abre somente buracos físicos, mostrando fundo e paredes. Cada panorama avança uma vez ao longo da fase.

Folhas antigas, o experimento de membros separados e o atlas de baixa resolução não são carregados nem copiados para o APK. Documentos V4/V5 são históricos.
