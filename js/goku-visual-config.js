// Visual v12: sprites opacos, animação determinística e terreno realmente seamless.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);
const clamp255 = value => Math.max(0, Math.min(255, value));

Object.assign(C.PATHS, {
  run: './assets/spritesheets/goku_run_v9.png',
  jump: './assets/spritesheets/goku_jump_v9.png',
});

const runFrames = [
  [0,0,105,115],[105,0,105,115],[210,0,105,115],[315,0,105,115],
  [0,115,105,115],[105,115,105,115],[210,115,105,115],[315,115,105,115],
];
const jumpFrames = [
  [0,0,105,115],[105,0,105,115],[210,0,105,115],[315,0,105,115],
];
const runPivots = [
  [52.5,109.5],[157.5,109.5],[262.5,109.5],[367.5,109.5],
  [52.5,224.5],[157.5,224.5],[262.5,224.5],[367.5,224.5],
];
const jumpPivots = [
  [52.5,109.5],[157.5,109.5],[262.5,109.5],[367.5,109.5],
];

replace(C.RUN_FRAMES, runFrames);
replace(C.JUMP_FRAMES, jumpFrames);
replace(C.RUN_PIVOTS, runPivots);
replace(C.JUMP_PIVOTS, jumpPivots);
C.PLAYER_SCALE.run = 1.05;
C.PLAYER_SCALE.jump = 1.05;

function canvasFrom(source) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  return { canvas, ctx };
}

function restoreGeneratedSpriteAlpha(source) {
  const { canvas, ctx } = canvasFrom(source);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  let maxAlpha = 0;
  for (let i = 3; i < data.length; i += 4) maxAlpha = Math.max(maxAlpha, data[i]);

  if (maxAlpha > 0 && maxAlpha < 220) {
    const cutoff = Math.max(2, maxAlpha * 0.06);
    const solidAt = Math.max(cutoff + 1, maxAlpha * 0.28);
    const edgeSpan = Math.max(1, solidAt - cutoff);
    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i];
      if (alpha <= cutoff) data[i] = 0;
      else if (alpha >= solidAt) data[i] = 255;
      else data[i] = clamp255((alpha - cutoff) * 255 / edgeSpan);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(image, 0, 0);
  }
  return canvas;
}

function removeLegacyAlphaMatte(source) {
  const { canvas, ctx } = canvasFrom(source);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 3; i < data.length; i += 4) {
    data[i] = clamp255((data[i] - 232) * 255 / 16);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

C.Assets.prototype.prepareSpriteCutouts = function prepareSpriteCutoutsV12() {
  if (typeof document === 'undefined') return;
  if (this.images.run) this.images.run = restoreGeneratedSpriteAlpha(this.images.run);
  if (this.images.jump) this.images.jump = restoreGeneratedSpriteAlpha(this.images.jump);
  if (this.images.enemies) this.images.enemies = removeLegacyAlphaMatte(this.images.enemies);
};

// A tile já era espelhada, mas filtros e rasterização deixavam diferenças de
// frações de canal exatamente nas duas emendas. Uma coluna diferente é o
// suficiente para aparecer como uma linha/piscada recorrente durante o scroll.
// Geramos como antes e, uma única vez no load, tornamos as colunas de junção
// literalmente idênticas. Não há trabalho extra durante gameplay.
const originalPrepareGround = C.Assets.prototype.prepareGround;
C.Assets.prototype.prepareGround = function prepareGroundV12() {
  originalPrepareGround.call(this);
  for (const tile of this.groundTiles) {
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    const height = tile.height;

    // Limite de repetição: x=839 precisa ser idêntico a x=0.
    const firstColumn = ctx.getImageData(0, 0, 1, height);
    ctx.putImageData(firstColumn, tile.width - 1, 0);

    // Emenda do espelho no centro: x=420 recebe exatamente x=419.
    const centerLeft = ctx.getImageData(tile.width / 2 - 1, 0, 1, height);
    ctx.putImageData(centerLeft, tile.width / 2, 0);
  }
};
