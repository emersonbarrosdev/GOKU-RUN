// Node preload: espelha paths, grid e pivôs visuais v16.
// O Node não renderiza pixels; os gates de navegador validam a escala real.
const C = require('./game.js');
const replace = (target, values) => target.splice(0, target.length, ...values);

Object.assign(C.PATHS, {
  run: './assets/spritesheets/goku_run_v10.png',
  jump: './assets/spritesheets/goku_stride_v8.png',
});

replace(C.RUN_FRAMES, Array.from({ length: 8 }, (_, frame) => [
  (frame % 4) * 512,
  Math.floor(frame / 4) * 512,
  512,
  512,
]));

replace(C.JUMP_FRAMES, [
  [102,730,202,282],
  [468,692,222,320],
  [890,694,152,279],
  [1261,729,196,284],
]);

replace(C.RUN_PIVOTS, [
  [245,416],
  [768,411],
  [1279,418],
  [1803,420],
  [262,923],
  [776,925],
  [1286,931],
  [1791,932],
]);

replace(C.JUMP_PIVOTS, [
  [183,1012],
  [573,1012],
  [949,1012],
  [1340,1013],
]);

// O teste Node histórico compara apenas a unidade lógica de escala entre
// estados e não rasteriza os PNGs. A escala visual real é validada no Gate D.
C.PLAYER_SCALE.run = 108 / 321;
C.PLAYER_SCALE.jump = 108 / 331;

module.exports = C;
