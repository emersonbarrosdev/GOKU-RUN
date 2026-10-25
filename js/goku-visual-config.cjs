// Node preload: espelha o grid visual v16 usado no navegador.
const C = require('./game.js');
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
C.PLAYER_SCALE.run = 108 / 150;
C.PLAYER_SCALE.jump = 108 / 150;

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

module.exports = C;
