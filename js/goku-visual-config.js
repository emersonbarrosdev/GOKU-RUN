// Visual v11: spritesheets separados do Goku, alpha restaurado e recortes determinísticos.
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

  // Os sheets v9 foram exportados com o desenho inteiro sem atingir opacidade.
  // Uma normalização linear ainda deixava o corpo final em ~184/255 porque o
  // maior alpha do arquivo não pertencia ao miolo do personagem. Tratamos
  // pixels muito fracos como antialias e tornamos o corpo real opaco.
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

  // O atlas antigo de inimigos usa o próprio canal alpha para separar
  // personagem e matte. Usar luminosidade RGB apagava cabelo/roupas escuras.
  for (let i = 3; i < data.length; i += 4) {
    data[i] = clamp255((data[i] - 232) * 255 / 16);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

C.Assets.prototype.prepareSpriteCutouts = function prepareSpriteCutoutsV11() {
  if (typeof document === 'undefined') return;
  if (this.images.run) this.images.run = restoreGeneratedSpriteAlpha(this.images.run);
  if (this.images.jump) this.images.jump = restoreGeneratedSpriteAlpha(this.images.jump);
  if (this.images.enemies) this.images.enemies = removeLegacyAlphaMatte(this.images.enemies);
};
