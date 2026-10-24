// Visual v13: restaura o atlas real do Goku que já tinha corrida/pulo completos.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);

// O v9 foi uma regressão: os PNGs pequenos continham praticamente só contorno
// e exigiam hacks de alpha. O v8 é o atlas completo já usado anteriormente no
// projeto, com 8 poses reais de corrida + 4 poses reais de pulo/pouso.
Object.assign(C.PATHS, {
  run: './assets/spritesheets/goku_stride_v8.png',
  jump: './assets/spritesheets/goku_stride_v8.png',
});

replace(C.RUN_FRAMES, [
  [35,7,285,331],
  [448,16,247,323],
  [794,9,260,330],
  [1209,8,295,317],
  [31,364,287,316],
  [448,364,247,319],
  [820,355,242,326],
  [1217,358,292,310],
]);

replace(C.JUMP_FRAMES, [
  [102,730,202,282],
  [468,692,222,320],
  [890,694,152,279],
  [1261,729,196,284],
]);

// Pivôs absolutos do atlas. Eles são a referência do pé/solo; nunca alinhar
// os frames pelo centro do recorte porque a largura muda a cada passada.
replace(C.RUN_PIVOTS, [
  [187,338],
  [573,339],
  [948,339],
  [1347,339],
  [184,680],
  [573,683],
  [950,681],
  [1343,681],
]);

replace(C.JUMP_PIVOTS, [
  [183,1012],
  [573,1012],
  [949,1012],
  [1340,1013],
]);

// Mesma escala anatômica para corrida e pulo. Pose encolhida continua menor;
// não é ampliada artificialmente para preencher um frame.
C.PLAYER_SCALE.run = 108 / 331;
C.PLAYER_SCALE.jump = 108 / 331;

// NÃO sobrescrever prepareSpriteCutouts aqui. O tratamento original de
// game.js foi criado para este atlas v8 e também mantém jump=run, pois ambos
// vivem na mesma imagem. Isso remove completamente o hack restoreAlpha do v9.

// Mantém a correção de seam do terreno adicionada depois: as colunas das
// emendas ficam literalmente idênticas e o scroll não pisca no wrap.
const originalPrepareGround = C.Assets.prototype.prepareGround;
C.Assets.prototype.prepareGround = function prepareGroundV13() {
  originalPrepareGround.call(this);
  for (const tile of this.groundTiles) {
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    const height = tile.height;
    const firstColumn = ctx.getImageData(0, 0, 1, height);
    ctx.putImageData(firstColumn, tile.width - 1, 0);
    const centerLeft = ctx.getImageData(tile.width / 2 - 1, 0, 1, height);
    ctx.putImageData(centerLeft, tile.width / 2, 0);
  }
};
