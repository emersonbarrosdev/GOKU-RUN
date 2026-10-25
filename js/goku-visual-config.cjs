// Node preload: espelha paths, grid e pivôs visuais v19.
// O Node não renderiza pixels; os gates de navegador validam a escala real.
const C = require('./game.js');
const replace = (target, values) => target.splice(0, target.length, ...values);

Object.assign(C.PATHS, {
  run: './assets/spritesheets/goku_run_v11.png',
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
  [259,416],
  [781,411],
  [1297,419],
  [1801,418],
  [265,924],
  [795,924],
  [1300,933],
  [1810,908],
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
