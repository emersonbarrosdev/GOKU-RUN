# Auditoria de corrida v19

O defeito encontrado no atlas v10 não era falta de FPS: as duas metades do ciclo repetiam quase a mesma leitura de pernas. As poses de passagem continuavam abertas e não mostravam a mesma perna viajando da frente para trás.

Correção aplicada:

- 8 poses em grid 4 × 2, com células de 512 × 512 px;
- ordem: contato A → apoio A → passagem → voo → contato B → apoio B → passagem → voo;
- a perna próxima e a perna distante trocam frente/trás com oclusão correta no quadril;
- braços em oposição às pernas;
- uma única escala anatômica para os oito quadros, sem inflar poses recolhidas;
- torso estabilizado no eixo X;
- contatos atingem a baseline, passagens aliviam o apoio e voos saem do piso;
- cadência dinâmica de 10,51 a 13,49 FPS, calculada pela distância percorrida (255 px por ciclo);
- pulo permanece em animação separada.

## Quantidade de frames

Oito quadros são suficientes para este runner porque Goku aparece com cerca de 108 px e não há zoom de câmera. O requisito é desenhar as quatro fases funcionais de cada lado; duplicar silhuetas não acrescenta suavidade. Doze quadros só passam a valer a pena com personagem maior ou breakdowns realmente novos.

Não há crossfade entre sprites. A suavidade vem da sequência biomecânica, do espaçamento, do pivô e da cadência ligada ao deslocamento.

## Resultado medido no runtime

- variação horizontal do torso: 0,437 px;
- maior transição horizontal do torso: 0,431 px;
- contato: bottom 139 px;
- passagem: bottom 137–138 px;
- voo: bottom 133 px, sem pixels no piso;
- menor diferença entre fases equivalentes dos dois lados: 1.936 pixels;
- proporções equivalentes entre os dois lados dentro de 10 px na largura e 8 px na altura;
- cadência: 10,51 FPS em Namek e 13,49 FPS na fase 5.

O teste também reprova um atlas que duplique a primeira passada na segunda metade ou que deixe de recolher as pernas na passagem.
