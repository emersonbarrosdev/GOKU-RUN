// Visual v9: novos spritesheets do Goku com células regulares e gutters seguros.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);

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

// Os novos PNGs já têm transparência real. Só o atlas de inimigos ainda
// precisa do tratamento de matte legado. Não copie mais RUN para JUMP.
C.Assets.prototype.prepareSpriteCutouts = function prepareSpriteCutoutsV9() {
  const key = 'enemies';
  const source = this.images[key];
  if (!source || typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = Math.max(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.max(0, Math.min(255, (alpha - 232) * 255 / 16));
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(image, 0, 0);
  this.images[key] = canvas;
};
