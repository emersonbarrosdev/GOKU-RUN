// Visual v15: atlas real, torso registrado e passada calibrada.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

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

// Registro horizontal medido no atlas final de 160x160. Os pivôs anteriores
// prendiam o pé, mas faziam o centro do torso saltar ~10 px ao longo do ciclo,
// com transições individuais de até 6,85 px. Estes X mantêm o torso em ~81,7 px
// em todos os oito quadros sem alterar o Y do contato com o chão.
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

// Não comparar apenas FPS: o que importa é também a duração do ciclo inteiro.
// O Phaser usa 10 FPS num exemplo de corrida de 4 frames (ciclo de 0,4 s).
// Nosso ciclo tem 8 frames. 320 px/ciclo deixava a passada longa demais:
// ~0,96 s em Namek e ~0,74 s na fase 5, parecendo corrida em câmera lenta.
// 230 px/ciclo produz ~0,69 s -> ~0,53 s por ciclo conforme a fase acelera,
// ainda sincronizado à distância e sem retornar à agressividade de 200 px.
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

const originalPrepareGround = C.Assets.prototype.prepareGround;
C.Assets.prototype.prepareGround = function prepareGroundV15() {
  originalPrepareGround.call(this);
  for (const tile of this.groundTiles) {
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    const height = tile.height;
    const firstColumn = ctx.getImageData(0, 0, 1, height);
    ctx.putImageData(firstColumn, tile.width - 1, 0);
    const centerLeft = ctx.getImageData(tile.width / 2 - 1, 0, 1, height);
    ctx.putImageData(centerLeft, tile.width / 2, 0);
  }
};
