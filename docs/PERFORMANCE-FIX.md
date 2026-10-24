# Correção de travamentos e flicker

## Diagnóstico

O runtime Phaser acumulava o delta de cada frame e avançava o modelo em passos fixos de 1/120 s sem limite de catch-up. Em um dispositivo que atrasasse um frame, o próximo frame podia executar várias atualizações de física, colisões, spawns, filtros de arrays e efeitos antes de renderizar novamente. Isso aumentava o custo do frame seguinte e podia formar uma espiral de atraso perceptível como travadas.

A renderização também solicitava `powerPreference: low-power`, reconstruía a geometria da máscara do chão a cada frame e criava objetos temporários no caminho quente de renderização.

## Alterações

- runtime fixo de 60 Hz, suficiente para a física deste runner;
- no máximo três passos de recuperação por frame;
- descarte de dívida excessiva de tempo para impedir catch-up spiral;
- renderer solicitado em `high-performance`;
- `roundPixels` habilitado para reduzir shimmering/flicker de elementos em movimento;
- máscara do chão reconstruída somente quando a topologia dos segmentos muda;
- cache das larguras dos panoramas;
- reutilização do `Set` usado para views vivas;
- cache da conversão de cores das partículas;
- redução de atualizações DOM redundantes no HUD;
- CI para executar testes e build em pushes de correção e pull requests.

## O que não mudou

As regras de gameplay, velocidades das fases, gravidade, força do salto, colisões, KI, vidas, encontros e progressão não foram redesenhadas. O modelo continua próprio e não foi migrado para Arcade Physics.

## Dívida técnica observada

`js/game.js` ainda concentra o modelo determinístico e o renderizador Canvas legado. O Canvas legado não é iniciado pela versão atual, mas sua presença aumenta o acoplamento e o tamanho do módulo. Separar modelo e renderizador em módulos distintos é uma refatoração recomendada, porém foi deixada fora desta correção para não misturar uma mudança arquitetural grande com o diagnóstico de performance.
