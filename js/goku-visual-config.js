// Visual v16: spritesheet técnica uniforme 8x4, PNG transparente e 20 estados.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);
const CELL = 256;
const GRID = './assets/spritesheets/goku_action_grid_v1.png';

Object.assign(C.PATHS, { run: GRID, jump: GRID });

replace(C.RUN_FRAMES, Array.from({ length: 8 }, (_, col) => [col * CELL, 0, CELL, CELL]));
replace(C.JUMP_FRAMES, [
  ...Array.from({ length: 4 }, (_, col) => [col * CELL, CELL, CELL, CELL]),
  ...Array.from({ length: 4 }, (_, col) => [col * CELL, CELL * 2, CELL, CELL]),
  ...Array.from({ length: 4 }, (_, col) => [col * CELL, CELL * 3, CELL, CELL]),
]);

replace(C.RUN_PIVOTS, [
  [132.35,236],[387.186,236],[643.883,236],[899.904,236],
  [1154.613,236],[1409.606,236],[1665.446,236],[1926.685,236],
]);
replace(C.JUMP_PIVOTS, [
  [128.94,492],[380.632,492],[637.494,492],[893.601,492],
  [126.769,748],[394.225,748],[649.243,748],[897.195,748],
  [122.277,1004],[370.908,1004],[641.722,1004],[901.551,1004],
]);

// Todas as poses foram geradas na mesma escala anatômica e remontadas com
// baseline comum. Nenhuma pose é esticada para preencher a célula.
C.PLAYER_SCALE.run = 108 / 150;
C.PLAYER_SCALE.jump = 108 / 150;

// Mantém a cadência calibrada da corrida: ~0,69 s -> ~0,53 s por ciclo.
if (!C.__runCadencePatched) {
  const BASE_RUN_STRIDE = C.RUN_STRIDE;
  const RUN_CYCLE_DISTANCE = 230;
  const cadenceRatio = BASE_RUN_STRIDE / RUN_CYCLE_DISTANCE;
  const originalPlayerUpdate = C.Player.prototype.update;
  C.RUN_STRIDE = RUN_CYCLE_DISTANCE;
  C.__runCadencePatched = true;
  C.Player.prototype.update = function updateWithGridCadence(dt, track, speed) {
    const beforeRunTime = this.runTime;
    const beforeFrame = Math.floor(beforeRunTime) % 8;
    const result = originalPlayerUpdate.call(this, dt, track, speed);
    const rawDelta = (this.runTime - beforeRunTime + 8) % 8;
    if (rawDelta > 0 && rawDelta < 1) {
      this.runTime = (beforeRunTime + rawDelta * cadenceRatio) % 8;
      const nextFrame = Math.floor(this.runTime) % 8;
      result.stepped = beforeFrame !== nextFrame && (nextFrame === 0 || nextFrame === 4);
    }
    return result;
  };
}

// `frame` continua retornando 0..7 durante corrida e 0..11 durante salto.
// main.js já soma +8 nos estados aéreos, produzindo hero frames 8..19.
Object.defineProperty(C.Player.prototype, 'frame', {
  configurable: true,
  get() {
    if (this.grounded && this.landTime <= 0) return Math.floor(this.runTime) % 8;
    if (this.grounded) {
      const progress = 1 - Math.min(1, this.landTime / .085);
      return 8 + Math.min(3, Math.floor(progress * 4));
    }
    if (this.airTime < .12) return Math.min(3, Math.floor(this.airTime / .03));
    if (this.vy < -180) return 4;
    if (this.vy < 70) return 5;
    if (this.vy < 360) return 6;
    return 7;
  },
});

Object.defineProperty(C.Player.prototype, 'pose', {
  configurable: true,
  get() {
    const running = this.grounded && this.landTime <= 0;
    const key = running ? 'run' : 'jump';
    const bounds = (running ? C.RUN_FRAMES : C.JUMP_FRAMES)[this.frame];
    const pivot = (running ? C.RUN_PIVOTS : C.JUMP_PIVOTS)[this.frame];
    return { key, bounds, pivot, scale: C.PLAYER_SCALE[key], height: bounds[3] * C.PLAYER_SCALE[key] };
  },
});

// O novo PNG já possui alpha limpo. Não aplique o antigo threshold de alpha
// ao Goku; ele criava contorno duro. Mantemos limpeza somente nos inimigos.
C.Assets.prototype.prepareSpriteCutouts = function prepareSpriteCutoutsV16() {
  const image = this.images.enemies;
  if (image) {
    const surface = document.createElement('canvas');
    surface.width = image.width; surface.height = image.height;
    const ctx = surface.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, surface.width, surface.height);
    for (let i = 3; i < pixels.data.length; i += 4) {
      pixels.data[i] = Math.max(0, Math.min(255, (pixels.data[i] - 232) * 255 / 16));
    }
    ctx.putImageData(pixels, 0, 0);
    this.images.enemies = surface;
  }
  this.images.jump = this.images.run;
};

const originalPrepareGround = C.Assets.prototype.prepareGround;
C.Assets.prototype.prepareGround = function prepareGroundV16() {
  originalPrepareGround.call(this);
  for (const tile of this.groundTiles) {
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    const height = tile.height;
    ctx.putImageData(ctx.getImageData(0, 0, 1, height), tile.width - 1, 0);
    ctx.putImageData(ctx.getImageData(tile.width / 2 - 1, 0, 1, height), tile.width / 2, 0);
  }
};
