// Node preload: espelha os assets/pivôs visuais v16 usados no navegador.
const C = require('./game.js');
const replace = (target, values) => target.splice(0, target.length, ...values);

Object.assign(C.PATHS, {
  run: './assets/spritesheets/goku_jog_run_v1.png',
  jump: './assets/spritesheets/goku_stride_v8.png',
});

replace(C.RUN_FRAMES, Array.from({ length: 8 }, (_, frame) => [frame * 48, 0, 48, 96]));

replace(C.JUMP_FRAMES, [
  [102,730,202,282],
  [468,692,222,320],
  [890,694,152,279],
  [1261,729,196,284],
]);

replace(C.RUN_PIVOTS, [
  [23.864,90],
  [71.820,90],
  [119.682,90],
  [167.661,90],
  [215.897,90],
  [264.036,90],
  [311.697,90],
  [359.378,90],
]);

replace(C.JUMP_PIVOTS, [
  [183,1012],
  [573,1012],
  [949,1012],
  [1340,1013],
]);

C.PLAYER_SCALE.run = 108 / 80;
C.PLAYER_SCALE.jump = 108 / 331;

module.exports = C;
