# GOKU RUN — Campanha por sagas

A campanha normal possui 15 fases de 30 segundos distribuídas em quatro capítulos. O runtime continua sendo Angular + Phaser + Capacitor; não existe backend e a progressão do bônus fica no `localStorage`.

## Capítulo 1 — Saga dos Saiyajins

1. Raditz — montanhas. Investidas de chão e disparos básicos.
2. Nappa — deserto. Mais rochas e ataques de carga.
3. Vegeta — deserto/área rochosa. Alterna voo, mergulho, posição parada com rajadas e investidas.

## Capítulo 2 — Saga de Freeza

1. Recoome — Namekusei.
2. Burter e Jeice — Namekusei, encontro duplo.
3. Capitão Ginyu — Namekusei.
4. Freeza — Namekusei, pressão maior e barragens.

## Capítulo 3 — Androides e Cell

1. Androide 19 — Ilha Amenbo.
2. Cell — Arena dos Jogos de Cell.

## Capítulo 4 — Majin Boo

1. Yakon — nave de Babidi.
2. Majin Vegeta — área desértica.
3. Majin Boo Gordo — Cidade do Oeste.
4. Super Boo — Terra.
5. Ilusões de Gohan, Gotenks e Piccolo — interior de Boo.
6. Kid Boo — Planeta Sagrado dos Kaiohs, final da campanha.

## Bônus desbloqueável

O Torneio do Outro Mundo só fica disponível depois da vitória sobre Kid Boo. O botão aparece no menu e inicia três fases próprias: Caterpy, Maraikoh e Paikuhan.

## Progressão de dificuldade

Cada fase aumenta ou mantém a velocidade da anterior e combina quatro variáveis: chance de buraco, intervalo entre encontros, frequência de inimigos aéreos e chance de rochas. O chefe entra em ciclos de aproximadamente seis segundos e alterna padrões como investida, voo/mergulho, disparo, barragem, rochas e encontros duplos.

## Chão sem flick

A física continua baseada em segmentos independentes da arte. O `ground-tile.png` existente permanece como centro repetível e matematicamente seamless. O runtime divide cada plataforma em blocos rígidos de 256 px, ancora a fase da textura nas coordenadas de mundo inteiras, ativa `roundPixels` na câmera e desenha capas de canto esquerdo/direito nas extremidades visíveis. Assim o chão funciona como um tileset lógico de três peças (left/middle/right), sem TileSprites gigantes e sem alterar a hitbox dos buracos.

## Arte dos chefes

Os 18 encontros têm sprites vetoriais de runtime próprios, com silhueta, paleta, cabelo/chifres e escala distintos. Burter + Jeice e as ilusões são renderizados como grupos múltiplos. O Goku não foi redesenhado: o jogo preserva `assets/game/player/goku-running-source.gif` e a spritesheet já derivada dele.

## Deploy

O deploy continua compatível com Cloudflare (`wrangler.jsonc` -> `./dist`). Não foram adicionadas dependências de runtime nem backend. O CI existente permanece válido; `npm test` passa a incluir também a validação estrutural da campanha.
