// Visual v19: ciclo biomecânico completo em grid regular, PNG transparente e pivô estável.
// Este arquivo roda DEPOIS de game.js e ANTES de main.js.
const C = window.GokuCore;
if (!C) throw new Error('GokuCore não inicializado antes do visual-config');

const replace = (target, values) => target.splice(0, target.length, ...values);

// Corrida de produção em grid 4x2: 8 poses biomecânicas completas.
// O pulo continua no atlas anterior, separado da corrida.
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

// Pivô horizontal comum estabiliza quadril/torso. O eixo Y preserva contato,
// compressão, passagem e voo: os frames 3/7 ficam realmente fora do chão.
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

// Escala anatômica única: o corpo ocupa ~321 px no atlas e chega a ~108 px no
// jogo. Nunca normalizar pose por pose, pois isso faria Goku pulsar de tamanho.
C.PLAYER_SCALE.run = 108 / 321;
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
C.Assets.prototype.prepareGround = function prepareGroundV19() {
  originalPrepareGround.call(this);
  for (const tile of this.groundTiles) {
    const ctx = tile.getContext('2d', { willReadFrequently: true });
    const height = tile.height;
    const firstColumn = ctx.getImageData(0, 0, 1, height);
    ctx.putImageData(firstColumn, tile.width - 1, 0);
    const centerLeft = ctx.getImageData(tile.width / 2 - 1, 0, 1, height);
    ctx.putImageData(centerLeft, tile.width / 2, 0);
  }

  // Tileset explícito de três peças: canto esquerdo, meio repetível e canto
  // direito. Os cantos são derivados uma única vez do próprio meio já tingido,
  // então nunca há mudança de paleta nem upload de textura durante a corrida.
  this.groundCaps = this.groundTiles.map(tile => {
    const makeCap = side => {
      const cap = document.createElement('canvas');
      cap.width = 40; cap.height = tile.height;
      const ctx = cap.getContext('2d');
      const sourceX = side === 'left' ? 0 : tile.width - cap.width;
      ctx.drawImage(tile, sourceX, 0, cap.width, tile.height, 0, 0, cap.width, tile.height);
      const outerX = side === 'left' ? 0 : cap.width;
      const innerX = side === 'left' ? cap.width : 0;
      const shade = ctx.createLinearGradient(outerX, 0, innerX, 0);
      shade.addColorStop(0, 'rgba(7,12,17,.48)');
      shade.addColorStop(1, 'rgba(7,12,17,0)');
      ctx.fillStyle = shade; ctx.fillRect(0, 0, cap.width, cap.height);
      ctx.strokeStyle = 'rgba(12,20,25,.68)'; ctx.lineWidth = 2;
      const dir = side === 'left' ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(outerX + dir, 0);
      for (let y = 16; y < cap.height; y += 16) {
        ctx.lineTo(outerX + dir * (2 + ((y / 16) % 3) * 3), y);
      }
      ctx.stroke();
      return cap;
    };
    return { left: makeCap('left'), right: makeCap('right') };
  });
};
