// Visual v17: ciclo de corrida real em 8 poses, grid regular e cadence sincronizada ao chão.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);

// O v16 usava uma folha 384x96 com apenas ~4 poses visuais repetidas, o que
// fazia o Goku parecer marchar/dançar. O v17 usa 8 poses realmente distintas
// em células quadradas 128x128: contact -> down -> passing -> up, duas vezes.
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

// O sheet foi remontado com o centro do torso em X=64 em todas as células.
// A baseline de contato fica em Y=118. Nos quadros 3 e 7 a própria arte foi
// elevada dentro da célula, criando o pequeno voo da fase "up" sem mover o pivot.
replace(C.RUN_PIVOTS, Array.from({ length: 8 }, (_, frame) => [frame * RUN_CELL + 64, 118]));

replace(C.JUMP_PIVOTS, [
  [183,1012],
  [573,1012],
  [949,1012],
  [1340,1013],
]);

// O corpo ocupa aproximadamente 112 px dentro de cada célula 128x128.
// Escala única em todos os quadros: nada de redimensionar pose por pose.
C.PLAYER_SCALE.run = 108 / 112;
C.PLAYER_SCALE.jump = 108 / 331;

// O PNG v17 já possui transparência limpa. Não aplicar nele o threshold de alpha
// usado para recuperar os assets antigos, pois isso destrói contorno/anti-alias.
C.Assets.prototype.prepareSpriteCutouts = function prepareSpriteCutoutsV17() {
  for (const key of ['jump', 'enemies']) {
    const image = this.images[key];
    if (!image) continue;
    const surface = document.createElement('canvas');
    surface.width = image.width;
    surface.height = image.height;
    const ctx = surface.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, surface.width, surface.height);
    for (let i = 3; i < pixels.data.length; i += 4) {
      pixels.data[i] = Math.max(0, Math.min(255, (pixels.data[i] - 232) * 255 / 16));
    }
    ctx.putImageData(pixels, 0, 0);
    this.images[key] = surface;
  }
};

// Cadência vinculada à velocidade real do cenário. Com 246 px por ciclo:
// - Namek (335 px/s): 10,89 FPS, 0,734 s por ciclo;
// - fase 5 (430 px/s): 13,98 FPS, 0,572 s por ciclo.
// A faixa fica dentro de ~10-14 FPS e cada frame dura ~0,092 -> 0,072 s.
// O chão e as pernas continuam sincronizados porque o relógio segue distância.
if (!C.__runCadencePatched) {
  const BASE_RUN_STRIDE = C.RUN_STRIDE;
  const RUN_CYCLE_DISTANCE = 246;
  const cadenceRatio = BASE_RUN_STRIDE / RUN_CYCLE_DISTANCE;
  const originalPlayerUpdate = C.Player.prototype.update;

  C.RUN_STRIDE = RUN_CYCLE_DISTANCE;
  C.__runCadencePatched = true;

  C.Player.prototype.update = function updateWithRunCycleV17(dt, track, speed) {
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

// Mantém a correção de emenda do terreno já validada nos gates de flicker.
const originalPrepareGround = C.Assets.prototype.prepareGround;
C.Assets.prototype.prepareGround = function prepareGroundV17() {
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
