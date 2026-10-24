// Node preload usado pelos testes para aplicar a mesma configuração visual v9.
const C = require('./game.js');
const replace = (target, values) => target.splice(0, target.length, ...values);

Object.assign(C.PATHS, {
  run: './assets/spritesheets/goku_run_v9.png',
  jump: './assets/spritesheets/goku_jump_v9.png',
});

replace(C.RUN_FRAMES, [
  [0,0,105,115],[105,0,105,115],[210,0,105,115],[315,0,105,115],
  [0,115,105,115],[105,115,105,115],[210,115,105,115],[315,115,105,115],
]);
replace(C.JUMP_FRAMES, [
  [0,0,105,115],[105,0,105,115],[210,0,105,115],[315,0,105,115],
]);
replace(C.RUN_PIVOTS, [
  [52.5,109.5],[157.5,109.5],[262.5,109.5],[367.5,109.5],
  [52.5,224.5],[157.5,224.5],[262.5,224.5],[367.5,224.5],
]);
replace(C.JUMP_PIVOTS, [
  [52.5,109.5],[157.5,109.5],[262.5,109.5],[367.5,109.5],
]);
C.PLAYER_SCALE.run = 1.05;
C.PLAYER_SCALE.jump = 1.05;
module.exports = C;
