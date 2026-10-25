# Auditoria de corrida v18

Problema observado: o atlas de trote usava células de apenas 48 × 96 px, passada curta e oito poses com os pés praticamente colados ao chão. A cadência correta não conseguia compensar uma mecânica corporal incorreta, por isso o movimento continuava robótico.

Correção alvo:
- 8 poses distintas em grid 4 × 2, com células de 512 × 512 px;
- ordem: contact L -> down L -> passing L -> flight L -> contact R -> down R -> passing R -> flight R;
- braços em oposição às pernas;
- torso estabilizado no eixo X;
- contatos atingem a baseline, passagens aliviam o apoio e voos ficam sem pixels no piso;
- cadência dinâmica de ~10,5 a 13,5 FPS entre fase 1 e fase 5;
- ciclo calculado pela distância percorrida (255 px), mantendo pernas e terreno sincronizados independentemente do FPS de renderização;
- uma única escala anatômica para todos os frames, sem aumentar poses comprimidas;
- cabelo, faixa e tecido com follow-through discreto;
- pulo permanece separado;
- CI deve reprovar regressões de ordem, jitter ou cadência.

## Critério de quantidade de frames

Oito frames são suficientes para este runner porque o personagem aparece com cerca de 108 px de altura e a câmera nunca aproxima. O ciclo precisa conter as quatro fases funcionais de cada lado; duplicar desenhos sem acrescentar novas fases não melhora a animação. Doze frames passam a valer a pena quando o personagem é maior na tela ou quando há orçamento para breakdowns intermediários desenhados individualmente.

Não há crossfade entre sprites: misturar dois desenhos cria fantasma e perde leitura de silhueta. A suavidade vem de poses corretas, espaçamento coerente, pivô estável e cadência ligada à distância.

## Resultado medido no runtime

- variação horizontal do torso: 0,466 px;
- maior deslocamento lateral entre quadros: 0,466 px;
- contato/compressão: bottom 139 px;
- passagem: bottom 137 px;
- voo: bottom 134 px, sem pixels no piso;
- menor diferença entre qualquer par de poses: 2.055 pixels;
- cadência: 10,51 FPS em Namek e 13,49 FPS na fase 5.
