# Task 1 — player executável, aguardando aceite visual

## Estado atual — 26/10/2026

A referência animada escolhida pelo usuário está na gameplay normal. As tentativas anteriores rejeitadas não são usadas. Não foi iniciada a Task 2 nem a Task 3; o chão continua neutro e temporário.

Após o feedback, a escala passou de 0,9 para **0,65** (27,8% menor). A animação usa metade da velocidade do GIF, com ciclo base de **680 ms**. A velocidade do cenário foi preservada.

O teste cronometrado descobriu um erro real: no Phaser 4 a duração individual é absoluta, não um acréscimo ao tempo base. Corrigida a configuração de `ms - 30` para `ms`. O navegador mediu ciclos de **684,2 e 684,5 ms** após a correção.

## Entrega técnica

- Phaser **4.2.1**, versão exata no manifesto e lockfile. Nenhum programa global novo; Chrome e FFmpeg já existiam.
- Folha 1280 × 512, grid 5 × 2: **10 quadros de 256 × 256** da referência, sem inventar poses para preencher 12 quadros.
- Tempos 30/40 ms reproduzidos a 0,5×: 60/80 ms na primeira fase; média **14,7 quadros/s**. Fases mais rápidas aumentam proporcionalmente a taxa.
- Altura visual aproximada 130 px; hitbox **41,6 × 93,6**, independente de cabelo/braços. Origem na linha de contato Y=240 da célula.
- Arcade controla pulo, queda e colisão. Pulo duplo preservado; terceiro bloqueado. Pulo simples medido em aproximadamente 105 px.
- Canvas lógico **1280 × 720**, FIT/CENTER_BOTH, uma instância, proporção 16:9 sem scroll. Portrait pausa e pede rotação.
- O repositório real usa Vite + JavaScript, não Angular. A migração/reestruturação não foi antecipada.

## Arquivos

Criados: [NativePlayer](../js/native-player.mjs), [especificação compartilhada](../js/visual-spec.js), [folha](../assets/game/player/goku-run.png), [GIF](../assets/game/player/goku-running-source.gif), [contrato e fonte](../assets/game/player/README.md), [importador](../tools/import-run-gif.cjs), [teste de integração](../tests/native-player.cjs), [teste de fidelidade](../tests/gif-fidelity.cjs).

Modificados: [main](../js/main.js), [modelo](../js/game.js), [configuração visual browser](../js/goku-visual-config.js), [configuração visual Node](../js/goku-visual-config.cjs), [história](../js/story-runtime.js), [CSS mobile](../css/mobile.css), [CSS história](../css/story.css), [build](../vite.config.mjs), [scripts/dependências](../package.json) e [lockfile](../package-lock.json). Testes de modelo, mobile e história foram adaptados.

## Validação

- `npm run build`: passou após a correção dos tempos.
- `npm test`: 29 testes e cinco simulações completas do modelo passaram. Simulações não substituem inspeção visual.
- `npm run test:visual`: passou; preservados todos os pixels RGBA visíveis dos dez quadros e a transparência.
- `npm run test:player-native`: passou na cena real; dez quadros, duração cronometrada, escala, hitbox, pés em Y=560 sem deriva, teclado, pulos, pausa e resize.
- `npm run test:mobile`: passou com toque, KI, pausa, orientação, corrida completa e ausência de erros JavaScript.
- Player, mobile e história também passaram no build de produção servido na porta 4173. Essa checagem detectou e corrigiu a publicação da configuração compartilhada após o empacotamento CommonJS do Vite.
- `npm run test:browser`: vitória em 150,08 s, cinco fases, duas vidas restantes, colisões ativas; frame p95 17 ms, renderização p95 0,4 ms. Reinício, pausa, áudio, pulo e KI passaram.
- O piloto automático antigo falhou inicialmente em três colisões com Piccolo: esperava a descida para acionar o segundo pulo, apesar de o obstáculo superar a altura do pulo simples. O teste foi ajustado para usar o pulo duplo existente antes do contato, sem alterar dificuldade, colisões ou física do jogo. Uma colisão continuou acontecendo na execução vitoriosa; não se afirma percurso sem dano.
- A sensação de corrida e o aceite estético final dependem do usuário; testes não aprovam automaticamente a arte.

## Próxima decisão

Player aprovado para seguir com a reestruturação do projeto ou deseja refazer/ajustar spritesheet, proporções ou animação?
