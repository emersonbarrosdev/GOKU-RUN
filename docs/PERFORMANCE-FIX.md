# Correção de travamentos e flicker

## Diagnóstico

O runtime Phaser acumulava o delta de cada frame e avançava o modelo em passos fixos de 1/120 s sem um limite real de catch-up. Em um dispositivo que atrasasse um frame, o próximo frame podia executar várias atualizações completas de física, colisões, spawns, filtros de arrays e efeitos antes de renderizar novamente. Isso aumentava o custo do frame seguinte e podia formar uma espiral de atraso perceptível como travadas.

A renderização também solicitava `powerPreference: low-power`, reconstruía a geometria da máscara do chão a cada frame e criava objetos temporários no caminho quente de renderização.

O flicker/instabilidade visual do chão era um problema separado. A versão anterior reciclava três imagens de terreno e reposicionava essas faixas conforme a distância avançava. O teste visual existente também não congelava a Scene do Phaser corretamente: substituir `scene.update` depois do boot não remove o callback já registrado pelo Phaser, portanto o mundo continuava avançando entre screenshots e o próprio teste misturava estados diferentes.

## Alterações

- runtime fixo de 60 Hz, suficiente para a física deste runner;
- no máximo três passos de recuperação por frame;
- descarte de dívida excessiva de tempo para impedir catch-up spiral;
- renderer solicitado em `high-performance`;
- `roundPixels` permanece desabilitado para preservar o deslocamento contínuo/subpixel do cenário;
- terreno trocado de três faixas recicladas para um `TileSprite` contínuo;
- máscara do chão reconstruída somente quando a topologia dos segmentos muda e deslocada junto com o mundo;
- cache das larguras dos panoramas;
- reutilização do `Set` usado para views vivas;
- cache da conversão de cores das partículas;
- redução de atualizações DOM redundantes no HUD;
- teste de regressão específico para o runtime em 60 Hz;
- audit visual corrigido para pausar a Scene pelo `ScenePlugin` antes de comparar pixels;
- CI para executar testes, build, audit visual e smoke mobile em pull requests e na `main`.

## Validação

A correção foi validada no GitHub Actions com:

- 29 testes de lógica/runtime aprovados;
- cinco playthroughs completos com seeds diferentes chegando à vitória em aproximadamente 150 segundos;
- build de produção do Vite aprovado;
- audit visual com zero reuploads de textura do terreno durante o scroll;
- continuidade do terreno aprovada nos pontos de wrap, com diferenças médias abaixo de 0,001 por canal e diferença máxima de 1;
- smoke mobile aprovado para toque, pulo duplo, KI sem disparar pulo, pausa, landscape, pausa em portrait, execução offline e ausência de erros JavaScript.

A `main` original também falhava no audit visual antigo; portanto aquela falha não foi introduzida pela otimização. O teste foi tornado determinístico e, junto com o terreno contínuo, agora passa.

## O que não mudou

As regras de gameplay, velocidades das fases, gravidade, força do salto, colisões, KI, vidas, encontros e progressão não foram redesenhadas. O modelo continua próprio e não foi migrado para Arcade Physics.

## Dívida técnica observada

`js/game.js` ainda concentra o modelo determinístico e o renderizador Canvas legado. O Canvas legado não é iniciado pela versão atual, mas sua presença aumenta o acoplamento e o tamanho do módulo. Além disso, `js/main.js` cria o modelo com `Object.create(Game.prototype)` e inicializa dependências manualmente, o que é funcional, porém frágil para manutenção.

Uma próxima refatoração recomendada é separar o modelo puro, o renderizador legado e a camada Phaser em módulos distintos, além de expor uma construção explícita do modelo em vez de depender de inicialização manual. Essa refatoração foi deixada fora desta correção para não misturar uma mudança arquitetural grande com a estabilização de performance/renderização.

## Pendências não bloqueantes

O `npm ci` reporta três vulnerabilidades moderadas em dependências. Elas não foram alteradas automaticamente com `npm audit fix --force`, pois isso pode introduzir atualizações quebráveis e deve ser tratado em uma revisão separada de dependências.

A validação automatizada cobre navegador desktop e viewport mobile, mas um teste final em aparelho Android real ainda é recomendado para observar temperatura, frame pacing e comportamento específico da GPU/WebView do dispositivo.
