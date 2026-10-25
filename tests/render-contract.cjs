const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const url = (process.env.TEST_URL || 'http://127.0.0.1:4173/') + '?debug=1';
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'JOGAR' }).click();

    const result = await page.evaluate(() => {
      const { scene, game, core } = window.__gokuRun;
      game.encounterTimer = Infinity;
      game.orbTimer = Infinity;
      game.friends = [];
      game.enemies = [];
      game.orbs = [];
      game.track.segments = [{ start: -10000, end: 100000 }];
      game.phaseBanner = 0;

      const pixelStats = (data, startX, startY, width, height, stride) => {
        let maxAlpha = 0, visiblePixels = 0, solidPixels = 0, orangePixels = 0, bluePixels = 0;
        for (let y = startY; y < startY + height; y++) {
          for (let x = startX; x < startX + width; x++) {
            const i = (y * stride + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            maxAlpha = Math.max(maxAlpha, a);
            if (a >= 40) visiblePixels++;
            if (a >= 220) solidPixels++;
            if (a >= 180 && r >= 130 && g >= 35 && g <= 185 && b <= 105) orangePixels++;
            if (a >= 180 && b >= 55 && b > r * .75 && b > g * .9) bluePixels++;
          }
        }
        return { maxAlpha, visiblePixels, solidPixels, orangePixels, bluePixels };
      };

      const textureStats = key => {
        const source = scene.textures.get(key).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width; canvas.height = source.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return { ...pixelStats(data, 0, 0, canvas.width, canvas.height, canvas.width), width: canvas.width, height: canvas.height };
      };

      const frameStats = (key, count, frameWidth = 160, frameHeight = 160) => {
        const source = scene.textures.get(key).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width; canvas.height = source.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return Array.from({ length: count }, (_, frame) => ({
          frame,
          ...pixelStats(data, frame * frameWidth, 0, frameWidth, frameHeight, canvas.width),
        }));
      };

      const cadenceSample = speed => {
        const player = new core.Player();
        const track = { supports: () => true };
        let changes = 0;
        let lastFrame = player.frame;
        const visited = new Set([lastFrame]);
        for (let i = 0; i < 60; i++) {
          player.update(1 / 60, track, speed);
          const frame = player.frame;
          visited.add(frame);
          if (frame !== lastFrame) { changes++; lastFrame = frame; }
        }
        return { speed, changes, visited: [...visited], runTime: player.runTime,
          theoreticalFps: speed / core.RUN_STRIDE * 8, cycleSeconds: core.RUN_STRIDE / speed };
      };

      const hero = textureStats('hero');
      const heroFrames = frameStats('hero', 20);
      const soldier = textureStats('soldier');
      const flyer = textureStats('flyer');
      const cadence = { stride: core.RUN_STRIDE, phase1: cadenceSample(335), phase5: cadenceSample(430) };

      const player = game.player;
      const show = state => {
        Object.assign(player, state);
        scene.renderWorld();
        return Number(scene.hero.frame.name);
      };
      const frames = {
        run0: show({ grounded: true, landTime: 0, runTime: 0 }),
        run3: show({ grounded: true, landTime: 0, runTime: 3.2 }),
        run7: show({ grounded: true, landTime: 0, runTime: 7.2 }),
        takeoff0: show({ grounded: false, airTime: .01, vy: -700 }),
        takeoff3: show({ grounded: false, airTime: .10, vy: -500 }),
        rise: show({ grounded: false, airTime: .25, vy: -300 }),
        apex: show({ grounded: false, airTime: .25, vy: -50 }),
        fall: show({ grounded: false, airTime: .25, vy: 200 }),
        fastFall: show({ grounded: false, airTime: .25, vy: 600 }),
        landing0: show({ grounded: true, landTime: .08 }),
        landing1: show({ grounded: true, landTime: .05 }),
        landing3: show({ grounded: true, landTime: .01 }),
      };

      const enemy = new core.Enemy('soldier', 700, core.GROUND);
      enemy.runPhase = .76; game.enemies = [enemy]; scene.renderWorld();
      frames.enemyFrame = Number(scene.views.get(enemy)?.frame?.name);

      game.track.distance = 839.8; scene.renderWorld(); const terrain839 = scene.terrain.tilePositionX;
      game.track.distance = 840.2; scene.renderWorld(); const terrain840 = scene.terrain.tilePositionX;

      return { hero, heroFrames, soldier, flyer, cadence, frames,
        heroRuntime: { visible: scene.hero.visible, alpha: scene.hero.alpha, texture: scene.hero.texture.key },
        terrain: { terrain839, terrain840 } };
    });

    console.log('RENDER_CONTRACT', JSON.stringify(result));

    for (const [name, value] of Object.entries({ hero: result.hero, soldier: result.soldier, flyer: result.flyer })) {
      assert.ok(value.maxAlpha >= 245, `${name} precisa conter pixels realmente opacos`);
      assert.ok(value.visiblePixels >= 300, `${name} precisa ter área visual suficiente`);
      assert.ok(value.solidPixels >= 80, `${name} não pode ser apenas um fantasma translúcido`);
    }

    assert.equal(result.heroFrames.length, 20, 'atlas hero precisa ter 20 frames');
    for (const frame of result.heroFrames) {
      assert.ok(frame.visiblePixels >= 2000, `hero frame ${frame.frame} precisa conter personagem completo`);
      assert.ok(frame.solidPixels >= 1500, `hero frame ${frame.frame} precisa ter corpo sólido`);
      assert.ok(frame.orangePixels >= 900, `hero frame ${frame.frame} precisa mostrar o gi laranja`);
      assert.ok(frame.bluePixels >= 250, `hero frame ${frame.frame} precisa mostrar detalhes azuis`);
    }

    assert.equal(result.cadence.stride, 230);
    assert.ok(result.cadence.phase1.cycleSeconds > .65 && result.cadence.phase1.cycleSeconds < .72);
    assert.ok(result.cadence.phase5.cycleSeconds > .50 && result.cadence.phase5.cycleSeconds < .56);
    assert.equal(result.cadence.phase1.visited.length, 8);
    assert.equal(result.cadence.phase5.visited.length, 8);

    assert.equal(result.heroRuntime.visible, true);
    assert.equal(result.heroRuntime.alpha, 1);
    assert.equal(result.heroRuntime.texture, 'hero');
    assert.deepEqual(result.frames, {
      run0: 0, run3: 3, run7: 7,
      takeoff0: 8, takeoff3: 11,
      rise: 12, apex: 13, fall: 14, fastFall: 15,
      landing0: 16, landing1: 17, landing3: 19,
      enemyFrame: 3,
    });
    assert.equal(result.terrain.terrain839, 839);
    assert.equal(result.terrain.terrain840, 840);

    console.log('PASS: grid hero 20 frames, corrida 8 poses, takeoff/ar/pouso completos e terreno alinhado.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
