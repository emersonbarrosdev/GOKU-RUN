// Visual v16: jogging/trote em grid regular, PNG transparente e pivô de torso estável.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);

// Corrida nova em grid técnico horizontal: 8 células idênticas de 48x96.
// O pulo continua no atlas anterior, separado da corrida.
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

// O torso foi medido frame a frame no PNG final. Estes pivôs deixam o centro
// do gi praticamente no mesmo X durante todo o ciclo e usam uma baseline comum.
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

// O corpo ocupa ~80 px dentro da célula de 96 px. Escala fixa para chegar a
// ~108 px no jogo sem normalizar cada pose separadamente.
C.PLAYER_SCALE.run = 108 / 80;
C.PLAYER_SCALE.jump = 108 / 331;

// PNG novo já possui alpha limpo. Não aplicar o antigo threshold de matte nele.
// Jump/enemies continuam com o tratamento legado por serem assets antigos.
C.Assets.prototype.prepareSpriteCutouts = function prepareSpriteCutoutsV16() {
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

// Cadência definida no núcleo (RUN_STRIDE=255): ~10,5 FPS em Namek e ~13,5 FPS
// na fase 5. Como o relógio deriva da distância, pernas e terreno não perdem
// a sincronização mesmo quando o FPS de renderização oscila.

// Mantém a correção de emenda do terreno já validada nos gates de flicker.
const originalPrepareGround = C.Assets.prototype.prepareGround;
C.Assets.prototype.prepareGround = function prepareGroundV16() {
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
