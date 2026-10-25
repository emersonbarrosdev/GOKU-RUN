// Node preload: espelha exatamente a configuração visual v15 do navegador.
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

if (!C.__runCadencePatched) {
  const BASE_RUN_STRIDE = C.RUN_STRIDE;
  const RUN_CYCLE_DISTANCE = 230;
  const cadenceRatio = BASE_RUN_STRIDE / RUN_CYCLE_DISTANCE;
  const originalPlayerUpdate = C.Player.prototype.update;

  C.RUN_STRIDE = RUN_CYCLE_DISTANCE;
  C.__runCadencePatched = true;

  C.Player.prototype.update = function updateWithRegisteredRunCadence(dt, track, speed) {
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

module.exports = C;
