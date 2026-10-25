// Fast deterministic visual inspection; artifacts are written outside the source tree.
const { chromium } = require('playwright-core');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const out = process.env.QA_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'goku-visual-'));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto((process.env.TEST_URL || 'http://127.0.0.1:5173/') + '?debug=1', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'JOGAR' }).click();

    const atlas = await page.evaluate(() => window.__gokuRun.scene.textures.get('hero').getSourceImage().toDataURL());
    fs.writeFileSync(path.join(out, 'hero-atlas.png'), Buffer.from(atlas.split(',')[1], 'base64'));
    console.log('ARTIFACTS ' + out);

    const runtime = await page.evaluate(async () => {
      const { scene: s, game: g } = window.__gokuRun;
      g.encounterTimer = g.orbTimer = Infinity;
      g.enemies = []; g.orbs = []; g.friends = [];
      g.track.segments = [{ start: -10000, end: 100000 }];
      g.phaseBanner = 0;

      let uploads = 0;
      const original = s.game.renderer.canvasToTexture;
      s.game.renderer.canvasToTexture = function (...args) {
        uploads++;
        return original.apply(this, args);
      };
      await new Promise(resolve => setTimeout(resolve, 1000));
      s.game.renderer.canvasToTexture = original;

      const columnDiff = (data, width, height, ax, bx) => {
        let diff = 0;
        for (let y = 0; y < height; y++) {
          for (let c = 0; c < 4; c++) {
            diff += Math.abs(data[(y * width + ax) * 4 + c] - data[(y * width + bx) * 4 + c]);
          }
        }
        return diff / (height * 4);
      };

      const seams = [];
      for (let phase = 0; phase < 5; phase++) {
        const source = s.textures.get('terrain-' + phase).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        seams.push({
          phase,
          width: canvas.width,
          edgeDiff: columnDiff(pixels, canvas.width, canvas.height, 0, canvas.width - 1),
          mirrorDiff: columnDiff(pixels, canvas.width, canvas.height, canvas.width / 2 - 1, canvas.width / 2),
        });
      }

      g.track.distance = 500;
      g.track.segments = [{ start: -500, end: 850 }, { start: 1000, end: 4000 }];
      s.renderWorld();
      const visibleCaps = s.groundEdgeViews.filter(view => view.visible).map(view => ({
        x: view.x, y: view.y, key: view.texture.key,
      }));
      const caps = [];
      for (let phase = 0; phase < 5; phase++) {
        for (const side of ['left', 'right']) {
          const source = s.textures.get(`terrain-cap-${side}-${phase}`).getSourceImage();
          caps.push({ phase, side, width: source.width, height: source.height });
        }
      }

      return { uploadsPerSecond: uploads, seams, caps, visibleCaps };
    });

    console.log('TERRAIN_RUNTIME', JSON.stringify(runtime));
    assert.equal(runtime.uploadsPerSecond, 0, 'scrolling must not re-upload terrain textures');
    for (const seam of runtime.seams) {
      assert.equal(seam.width, 840, `phase ${seam.phase} terrain tile must remain 840px`);
      assert.ok(seam.edgeDiff < 0.1, `phase ${seam.phase} tile edges must be seamless`);
      assert.ok(seam.mirrorDiff < 0.1, `phase ${seam.phase} mirrored center must be seamless`);
    }
    assert.equal(runtime.caps.length, 10, 'tileset deve ter cantos esquerdo/direito nas cinco fases');
    for (const cap of runtime.caps) {
      assert.deepEqual([cap.width, cap.height], [40, 164],
        `canto ${cap.side} da fase ${cap.phase} deve manter tamanho rígido`);
    }
    assert.deepEqual(runtime.visibleCaps.map(cap => cap.key).sort(),
      ['terrain-cap-left-0', 'terrain-cap-right-0'],
      'as duas bordas do buraco devem usar peças explícitas do tileset');
    assert.ok(runtime.visibleCaps.every(cap => Number.isInteger(cap.x) && Number.isInteger(cap.y)),
      'cantos do chão devem permanecer alinhados a pixels inteiros');

    // Freeze model updates but keep Phaser rendering. We only need three real
    // browser captures to prove the renderer crosses the 840px wrap cleanly.
    await page.evaluate(() => {
      const { scene: s, game: g } = window.__gokuRun;
      g.state = 'paused';
      s.lastState = 'paused';
      g.track.segments = [{ start: -10000, end: 100000 }];
      document.querySelector('#panel').hidden = true;
      document.querySelector('#hud').hidden = false;
    });

    const snapshots = [];
    for (const distance of [839, 840, 841]) {
      await page.evaluate(async distance => {
        const { scene: s, game: g } = window.__gokuRun;
        g.phaseIndex = 0;
        g.previousPhase = 0;
        g.phaseFade = 0;
        g.track.distance = distance;
        s.renderWorld();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, distance);
      const png = await page.screenshot({ clip: { x: 0, y: 590, width: 1280, height: 100 } });
      snapshots.push(png.toString('base64'));
    }

    const wrap = await page.evaluate(async encoded => {
      const decode = async value => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + value;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 1280; canvas.height = 100;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, 1280, 100).data;
      };
      const images = [];
      for (const value of encoded) images.push(await decode(value));
      const compareShift = (a, b) => {
        let diff = 0, max = 0, count = 0;
        for (let y = 0; y < 100; y++) {
          for (let x = 0; x < 1000; x++) {
            for (let c = 0; c < 3; c++) {
              const delta = Math.abs(a[(y * 1280 + x + 1) * 4 + c] - b[(y * 1280 + x) * 4 + c]);
              diff += delta; max = Math.max(max, delta); count++;
            }
          }
        }
        return { mean: diff / count, max };
      };
      return { before: compareShift(images[0], images[1]), after: compareShift(images[1], images[2]) };
    }, snapshots);

    console.log('WRAP_RENDER', JSON.stringify(wrap));
    assert.ok(wrap.before.mean < 0.1, 'terrain must move continuously into the 840px wrap');
    assert.ok(wrap.after.mean < 0.1, 'terrain must move continuously out of the 840px wrap');

    await page.screenshot({ path: path.join(out, 'terrain-wrap-841.png') });
    console.log('PASS: middle tiles are seamless, left/right caps are pixel-aligned, zero runtime uploads, and browser wrap is continuous.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
