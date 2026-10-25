// Node preload: espelha os assets/pivôs visuais v15 usados no navegador.
// A cadência de runtime continua validada nos testes de navegador, porque o
// núcleo Node mantém RUN_STRIDE=200 como contrato físico histórico.
const C = require('./game.js');
const replace = (target, values) => target.splice(0, target.length, ...values);

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

replace(C.RUN_PIVOTS, [
  [191,338],
  [571,339],
  [929,339],
  [1349,339],
  [180,680],
  [568,683],
  [959,681],
  [1355,681],
]);

replace(C.JUMP_PIVOTS, [
  [183,1012],
  [573,1012],
  [949,1012],
  [1340,1013],
]);

C.PLAYER_SCALE.run = 108 / 331;
C.PLAYER_SCALE.jump = 108 / 331;

module.exports = C;
