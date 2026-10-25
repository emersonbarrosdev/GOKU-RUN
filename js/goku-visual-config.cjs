// Node preload: espelha paths, grid e pivôs visuais v17 usados no navegador.
// O Node não rasteriza pixels; os gates de navegador validam a escala/cadência real.
const C = require('./game.js');
const replace = (target, values) => target.splice(0, target.length, ...values);

Object.assign(C.PATHS, {
  run: './assets/spritesheets/goku_run_cycle_v17.png',
  jump: './assets/spritesheets/goku_stride_v8.png',
});

const RUN_CELL = 128;
replace(C.RUN_FRAMES, Array.from({ length: 8 }, (_, frame) => [frame * RUN_CELL, 0, RUN_CELL, RUN_CELL]));

replace(C.JUMP_FRAMES, [
  [102,730,202,282],
  [468,692,222,320],
  [890,694,152,279],
  [1261,729,196,284],
]);

replace(C.RUN_PIVOTS, Array.from({ length: 8 }, (_, frame) => [frame * RUN_CELL + 64, 118]));

replace(C.JUMP_PIVOTS, [
  [183,1012],
  [573,1012],
  [949,1012],
  [1340,1013],
]);

// O teste Node histórico compara a unidade lógica de escala entre estados e não
// rasteriza PNG. O Gate D mede a escala visual real do navegador.
C.PLAYER_SCALE.run = 108 / 112;
C.PLAYER_SCALE.jump = 108 / 112;

module.exports = C;
