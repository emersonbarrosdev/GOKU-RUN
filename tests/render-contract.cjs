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
            if (a >= 180 && r >= 130 && g >= 35 && g <= 190 && b <= 110) orangePixels++;
            if (a >= 180 && b >= 45 && b > r * .72 && b > g * .88) bluePixels++;
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

      const runPairDiffs = () => {
        const source = scene.textures.get('hero').getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width; canvas.height = source.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const diffs = [];
        for (let pair = 0; pair < 4; pair++) {
          let changed = 0;
          for (let y = 0; y < 160; y++) {
            for (let x = 0; x < 160; x++) {
              const a = (y * canvas.width + pair * 160 + x) * 4;
              const b = (y * canvas.width + (pair + 4) * 160 + x) * 4;
              const delta = Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) +
                Math.abs(data[a + 2] - data[b + 2]) + Math.abs(data[a + 3] - data[b + 3]);
              if (delta > 120) changed++;
            }
          }
          diffs.push(changed / (160 * 160));
        }
        return diffs;
      };

      const cadenceSample = speed => {
        const player = new core.Player();
        const track = { supports: () => true };
        let changes = 0, lastFrame = player.frame;
        const visited = new Set([lastFrame]);
        for (let i = 0; i < 60; i++) {
          player.update(1 / 60, track, speed);
          const frame = player.frame;
          visited.add(frame);
          if (frame !== lastFrame) { changes++; lastFrame = frame; }
        }
        return {
          speed, changes, visited: [...visited], runTime: player.runTime,
          theoreticalFps: speed / core.RUN_STRIDE * 8,
          cycleSeconds: core.RUN_STRIDE / speed,
        };
      };

      const hero = textureStats('hero');
      const heroFrames = frameStats('hero', 12);
      const soldier = textureStats('soldier');
      const flyer = textureStats('flyer');
      const cadence = {
        stride: core.RUN_STRIDE,
        phase1: cadenceSample(335),
        phase5: cadenceSample(430),
      };

      const player = game.player;
      player.grounded = true; player.landTime = 0;
      player.runTime = 0; scene.renderWorld(); const run0 = Number(scene.hero.frame.name);
      player.runTime = 3.2; scene.renderWorld(); const run3 = Number(scene.hero.frame.name);
      player.runTime = 7.2; scene.renderWorld(); const run7 = Number(scene.hero.frame.name);

      player.grounded = false; player.airTime = .03; player.vy = -500;
      scene.renderWorld(); const jumpStart = Number(scene.hero.frame.name);
      player.airTime = .25; player.vy = -100; scene.renderWorld(); const jumpUp = Number(scene.hero.frame.name);
      player.vy = 300; scene.renderWorld(); const jumpDown = Number(scene.hero.frame.name);
      player.grounded = true; player.landTime = .05; scene.renderWorld(); const landing = Number(scene.hero.frame.name);

      const enemy = new core.Enemy('soldier', 700, core.GROUND);
      enemy.runPhase = .76; game.enemies = [enemy]; scene.renderWorld();
      const enemyFrame = Number(scene.views.get(enemy)?.frame?.name);

      game.track.distance = 839.8; scene.renderWorld(); const terrain839 = scene.terrain.tilePositionX;
      game.track.distance = 840.2; scene.renderWorld(); const terrain840 = scene.terrain.tilePositionX;

      return {
        hero, heroFrames, soldier, flyer, cadence,
        pairDiffs: runPairDiffs(),
        runFrames: core.RUN_FRAMES.map(frame => [...frame]),
        runPivots: core.RUN_PIVOTS.map(pivot => [...pivot]),
        runPath: core.PATHS.run,
        heroRuntime: { visible: scene.hero.visible, alpha: scene.hero.alpha, texture: scene.hero.texture.key },
        frames: { run0, run3, run7, jumpStart, jumpUp, jumpDown, landing, enemyFrame },
        terrain: { terrain839, terrain840 },
      };
    });

    console.log('RENDER_CONTRACT', JSON.stringify(result));

    assert.equal(result.runPath, './assets/spritesheets/goku_run_cycle_v17.png');
    assert.deepEqual(result.runFrames, Array.from({ length: 8 }, (_, i) => [i * 128, 0, 128, 128]),
      'corrida v17 deve usar grid horizontal regular de 8 células 128x128');
    assert.equal(new Set(result.runPivots.map(([, y]) => y)).size, 1,
      'todos os frames devem compartilhar a mesma origem de chão');

    for (const [name, value] of Object.entries({ hero: result.hero, soldier: result.soldier, flyer: result.flyer })) {
      assert.ok(value.maxAlpha >= 245, `${name} precisa conter pixels realmente opacos`);
      assert.ok(value.visiblePixels >= 300, `${name} precisa ter área visual suficiente`);
      assert.ok(value.solidPixels >= 80, `${name} não pode ser apenas um fantasma translúcido`);
    }

    assert.ok(result.hero.orangePixels >= 1500, 'atlas do Goku precisa conter o gi laranja real');
    assert.ok(result.hero.bluePixels >= 300, 'atlas do Goku precisa conter detalhes azuis reais');
    for (const frame of result.heroFrames.slice(0, 8)) {
      assert.ok(frame.visiblePixels >= 650, `run frame ${frame.frame} precisa conter o corpo completo`);
      assert.ok(frame.solidPixels >= 280, `run frame ${frame.frame} precisa ser opaco`);
      assert.ok(frame.orangePixels >= 140, `run frame ${frame.frame} precisa mostrar o gi laranja`);
      assert.ok(frame.bluePixels >= 20, `run frame ${frame.frame} precisa mostrar detalhes azuis`);
    }

    // O bug do v16 repetia praticamente as mesmas quatro poses na segunda metade.
    // Cada passo oposto precisa mudar a silhueta de forma material.
    for (let i = 0; i < result.pairDiffs.length; i++) {
      assert.ok(result.pairDiffs[i] > .06,
        `frames ${i} e ${i + 4} estão parecidos demais (${result.pairDiffs[i].toFixed(3)}); o ciclo voltou a repetir poses`);
    }

    assert.equal(result.cadence.stride, 246, 'corrida v17 deve usar 246px por ciclo completo');
    assert.ok(result.cadence.phase1.theoreticalFps >= 10.7 && result.cadence.phase1.theoreticalFps <= 11.1,
      `fase 1 deve ficar em ~10,9 FPS, recebido ${result.cadence.phase1.theoreticalFps}`);
    assert.ok(result.cadence.phase5.theoreticalFps >= 13.8 && result.cadence.phase5.theoreticalFps <= 14.1,
      `fase 5 deve ficar em ~14 FPS, recebido ${result.cadence.phase5.theoreticalFps}`);
    assert.ok(result.cadence.phase1.cycleSeconds > .72 && result.cadence.phase1.cycleSeconds < .75,
      `fase 1 deve completar o ciclo em ~0,734 s, recebido ${result.cadence.phase1.cycleSeconds}`);
    assert.ok(result.cadence.phase5.cycleSeconds > .56 && result.cadence.phase5.cycleSeconds < .59,
      `fase 5 deve completar o ciclo em ~0,572 s, recebido ${result.cadence.phase5.cycleSeconds}`);
    assert.ok(result.cadence.phase1.changes >= 10 && result.cadence.phase1.changes <= 11,
      `fase 1 deve avançar ~11 poses/s: ${result.cadence.phase1.changes}`);
    assert.ok(result.cadence.phase5.changes >= 13 && result.cadence.phase5.changes <= 14,
      `fase 5 deve avançar ~14 poses/s: ${result.cadence.phase5.changes}`);
    assert.equal(result.cadence.phase1.visited.length, 8, 'fase 1 precisa usar as 8 poses');
    assert.equal(result.cadence.phase5.visited.length, 8, 'fase 5 precisa usar as 8 poses');

    assert.equal(result.heroRuntime.visible, true);
    assert.equal(result.heroRuntime.alpha, 1);
    assert.equal(result.heroRuntime.texture, 'hero');
    assert.deepEqual(result.frames, {
      run0: 0, run3: 3, run7: 7,
      jumpStart: 8, jumpUp: 9, jumpDown: 10, landing: 11, enemyFrame: 3,
    });
    assert.equal(result.terrain.terrain839, 839);
    assert.equal(result.terrain.terrain840, 840);

    console.log('PASS: 8 poses únicas, grid 128x128, corrida 10,9–14 FPS, pulo separado e terreno alinhado.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
