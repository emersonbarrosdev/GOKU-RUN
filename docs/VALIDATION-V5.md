# Validação — movimento e impacto

## Resultado

- `node --check js/game.js`: passou.
- `node --test tests/game.test.cjs`: 21 testes passaram, nenhum falhou.
- `node tests/playthrough.cjs`: cinco simulações completas de 150 segundos chegaram à vitória; seeds 7, 31, 101, 509 e 2026.
- Colisões, KI, projéteis, buracos, aliados e vidas permaneceram ativos nas simulações. Nenhuma invencibilidade ou desativação de dano foi usada.
- `git diff --check`: sem erros de whitespace; apenas aviso de conversão LF/CRLF do Git no Windows.

## Conferência no navegador

- Início pelo botão real: estado `playing`.
- Amostra de 70 frames: todos os oito quadros da corrida avançaram, junto com o deslocamento do chão.
- Salto pela tecla Espaço: fase aérea e aterrissagem confirmadas; silhueta entre 101,8 e 109,5 px, sem mudar a escala entre poses de uma mesma folha.
- KI pela tecla K: ativação confirmada, coleta durante o efeito guardou 25% de reserva; aura visual revisada sem oval.
- Pausa pela tecla P: física congelada; botão Continuar retomou a partida.
- Colisão fatal: estado `game-over`, impacto e hit-stop zerados; botão Correr Novamente restaurou três vidas e zerou a carga.
- Cenários das cinco fases e novas sequências de Gohan, Piccolo e Kuririn revisados visualmente.
- Nenhum erro JavaScript observado durante a verificação de controles.

## Problemas encontrados e corrigidos na revisão

1. Normalizar poses pela altura aumentava o Goku com as pernas dobradas. O pulo foi redesenhado a partir da corrida final e cada folha passou a usar escala anatômica fixa.
2. A prévia podia ficar congelada na inspeção. A trava manual permanente foi removida; inspeção expira e qualquer entrada a cancela.
3. O salto precisava de peso. A queda usa aceleração maior que a subida, com impulso de aterrissagem, poeira e som; impacto de câmera é curto, vertical, limitado e não afeta o HUD.
4. A rajada terrestre chegava muito antes do inimigo com a nova curva de salto. O ponto de disparo foi aproximado, com preparação visual, para permitir uma sequência legível de pulos.
5. O KI tinha um contorno oval. Foi substituído por chamas e rastros de energia abertos, sem bolha.
6. Botões pintados e instruções antigas do menu foram removidos da arte. Início, pausa e reinício agora usam controles reais.

As simulações confirmam regras e trajetórias, mas não substituem a preferência do jogador sobre o ritmo. A arte e a sensação do movimento foram também conferidas no navegador.
