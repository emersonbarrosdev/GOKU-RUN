# Task 3 — chão definitivo

O runtime carrega apenas [ground-tile.png](../assets/game/ground/ground-tile.png): uma textura opaca de 1024 × 256 com grama, terra, pedras e raízes em estilo anime. Ela é repetida horizontalmente por `Phaser.GameObjects.TileSprite`.

A borda direita é a contraparte espelhada da esquerda e as colunas externas são idênticas pixel a pixel. Assim, a repetição não cria corte ou linha intermitente. O posicionamento usa dimensões inteiras, com topo lógico exato em Y=560.

Cada trecho visual acompanha um corpo Arcade estático independente. Buracos são ausência real de corpo e textura, não uma máscara sobre um bloco gigante. Os objetos são reutilizados em pool para evitar criação e destruição contínua durante a corrida.

`npm run test:visual` decodifica a imagem e valida dimensão, opacidade, detalhe vertical e igualdade exata entre as bordas.
