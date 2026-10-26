# Chão definitivo

[ground-tile.png](ground-tile.png) é a única textura carregada pelo runtime: 1024 × 256, RGB opaco, repetição horizontal infinita via `Phaser.GameObjects.TileSprite`.

A base foi gerada com a ferramenta integrada de imagem a partir de um pedido de chão anime 2D com grama, terra, pedras e raízes. Depois, uma metade foi espelhada deterministicamente para que as colunas esquerda e direita sejam idênticas. Isso elimina a costura matemática sem criar arquivos separados de canto/meio.

A faixa visível tem 160 px e começa exatamente em Y=560. O corpo Arcade é estático e independente da imagem, permitindo buracos e plataformas sem usar a altura da textura como hitbox.

Validação: `npm run test:visual` compara cada pixel das duas bordas e confirma opacidade/dimensões.
