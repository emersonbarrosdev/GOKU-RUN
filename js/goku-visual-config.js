// Visual v14: atlas real + cadência de corrida mais legível.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);

// O v9 foi uma regressão: os PNGs pequenos continham praticamente só contorno
// e exigiam hacks de alpha. O v8 é o atlas completo já usado anteriormente no
// projeto, com 8 poses reais de corrida + 4 poses reais de pulo/pouso.
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

// Pivôs absolutos do atlas. Eles são a referência do pé/solo; nunca alinhar
// os frames pelo centro do recorte porque a largura muda a cada passada.
replace(C.RUN_PIVOTS, [
  [187,338],
  [573,339],
  [948,339],
  [1347,339],
  [184,680],
  [573,683],
  [950,681],
  [1343,681],
]);

replace(C.JUMP_PIVOTS, [
  [183,1012],
  [573,1012],
  [949,1012],
  [1340,1013],
]);

// Mesma escala anatômica para corrida e pulo. Pose encolhida continua menor;
// não é ampliada artificialmente para preencher um frame.
C.PLAYER_SCALE.run = 108 / 331;
C.PLAYER_SCALE.jump = 108 / 331;

// A cadência anterior usava 200 px por ciclo completo de 8 poses.
// Nas velocidades atuais isso gerava 13,4 FPS em Namek e 17,2 FPS na fase 5,
// rápido demais para poses desenhadas bem diferentes entre si e visualmente
// parecido com flicker. O Phaser usa ~10 FPS em seus exemplos de run/walk.
// Com 320 px por ciclo ficamos em ~8,4 FPS na fase 1 e ~10,8 FPS na fase 5.
// A corrida continua sincronizada à distância/velocidade, só não troca pose
// rápido demais.
if (!C.__runCadencePatched) {
  const BASE_RUN_STRIDE = C.RUN_STRIDE;
  const RUN_CYCLE_DISTANCE = 320;
  const cadenceRatio = BASE_RUN_STRIDE / RUN_CYCLE_DISTANCE;
  const originalPlayerUpdate = C.Player.prototype.update;

  C.RUN_STRIDE = RUN_CYCLE_DISTANCE;
  C.__runCadencePatched = true;

  C.Player.prototype.update = function updateWithReadableRunCadence(dt, track, speed) {
    const beforeRunTime = this.runTime;
    const beforeFrame = Math.floor(beforeRunTime) % 8;
    const result = originalPlayerUpdate.call(this, dt, track, speed);

    // O núcleo ainda calcula a progressão usando o stride-base antigo. Como a
    // progressão por tick é pequena, escalamos somente o delta recém-adicionado
    // e preservamos física, salto, colisão e demais estados do Player.
    const rawDelta = (this.runTime - beforeRunTime + 8) % 8;
    if (rawDelta > 0 && rawDelta < 1) {
      this.runTime = (beforeRunTime + rawDelta * cadenceRatio) % 8;
      const nextFrame = Math.floor(this.runTime) % 8;
      result.stepped = beforeFrame !== nextFrame && (nextFrame === 0 || nextFrame === 4);
    }

    return result;
  };
}

// NÃO sobrescrever prepareSpriteCutouts aqui. O tratamento original de
// game.js foi criado para este atlas v8 e também mantém jump=run, pois ambos
// vivem na mesma imagem. Isso remove completamente o hack restoreAlpha do v9.

// Mantém a correção de seam do terreno adicionada depois: as colunas das
// emendas ficam literalmente idênticas e o scroll não pisca no wrap.
const originalPrepareGround = C.Assets.prototype.prepareGround;
C.Assets.prototype.prepareGround = function prepareGroundV14() {
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
