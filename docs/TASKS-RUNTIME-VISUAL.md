# Tarefas — Runtime, Sprites e Continuidade Visual

## Objetivo
Eliminar falhas que podem passar despercebidas em testes puramente lógicos: personagem invisível, inimigos invisíveis, animação fora de sincronia, quebra/flicker no terreno e fluxo narrativo obrigatório em todo boot.

## T1 — Goku visível em todos os estados
- Normalizar o canal alpha dos spritesheets de corrida e pulo quando o PNG vier com faixa de alpha anormalmente baixa.
- Validar todos os 8 frames de corrida.
- Validar os 4 frames de salto: saída, subida/ápice, descida e pouso.
- Garantir pixels opacos reais no atlas final do Phaser.
- Bloquear merge se o atlas existir mas estiver vazio/quase transparente.

Critério de aceite:
- `hero` com alpha máximo >= 245.
- Área visível mínima validada automaticamente.
- Frames 0..7 usados na corrida e 8..11 usados no salto/pouso.

## T2 — Inimigos visíveis
- Restaurar recorte por alpha do atlas legado.
- Nunca derivar transparência da luminosidade RGB, pois roupas/cabelos/contornos escuros desaparecem.
- Validar atlas de soldado e inimigo voador no navegador real.

Critério de aceite:
- `soldier` e `flyer` têm pixels opacos e área visual mínima.
- O frame visual do soldado acompanha `runPhase` da simulação.
- O voador acompanha `flightFrame` da simulação.

## T3 — Uma única lógica de corrida
- A física já calcula `Player.runTime` pela distância percorrida.
- O Phaser não deve manter um segundo relógio independente para o Goku durante gameplay.
- O frame renderizado deve ser derivado diretamente de `Player.frame`.
- O personagem permanece em X fixo na tela; o mundo/terreno se move. Esse é o comportamento esperado de um endless runner.

Critério de aceite:
- `runTime=0` -> frame 0.
- `runTime=3.x` -> frame 3.
- `runTime=7.x` -> frame 7.
- Salto e pouso usam frames próprios e determinísticos.

## T4 — Terreno sem flicker ou reinício visível
- Manter o terreno como textura contínua, sem criar/destruir faixas durante a corrida.
- Pixel-alinhar `tilePositionX` e a máscara do solo para evitar amostragem fracionária no wrap.
- Validar múltiplos wraps, não apenas o primeiro.
- Não fazer upload/recriação da textura durante o scroll.

Critério de aceite:
- Zero uploads de textura durante scroll estável.
- Continuidade visual nos limites 840, 1680, 2520 e seguintes.
- Nenhum frame preto, vazio ou salto brusco de offset.

## T5 — História opcional após primeira visualização
- Mostrar a história no primeiro acesso.
- Adicionar botão `PULAR HISTÓRIA`.
- Marcar a história como vista ao terminar ou pular.
- Em boots posteriores, ir direto ao menu.
- Espaço/W/Seta não podem iniciar a gameplay por trás da história.

Critério de aceite:
- Primeiro acesso: loading -> história -> menu -> jogo.
- Pular história: história -> menu imediatamente.
- Segundo acesso: menu direto.

## T6 — Gate obrigatório antes da main
- Toda alteração de gameplay/visual deve nascer em branch.
- Executar a Bíblia de Testes completa no GitHub Actions.
- Só fazer merge na `main` quando todos os gates estiverem verdes.
- Se qualquer teste falhar, corrigir na branch e repetir o pipeline.
