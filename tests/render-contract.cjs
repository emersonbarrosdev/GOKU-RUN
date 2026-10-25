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
        let maxAlpha = 0;
        let visiblePixels = 0;
        let solidPixels = 0;
        let orangePixels = 0;
        let bluePixels = 0;

        for (let y = startY; y < startY + height; y++) {
          for (let x = startX; x < startX + width; x++) {
            const i = (y * stride + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
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
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return {
          ...pixelStats(data, 0, 0, canvas.width, canvas.height, canvas.width),
          width: canvas.width,
          height: canvas.height,
        };
      };

      const frameStats = (key, count, frameWidth = 160, frameHeight = 160) => {
        const source = scene.textures.get(key).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
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
          if (frame !== lastFrame) {
            changes++;
            lastFrame = frame;
          }
        }

        return {
          speed,
          changes,
          visited: [...visited],
          runTime: player.runTime,
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
      player.grounded = true;
      player.landTime = 0;
      player.runTime = 0;
      scene.renderWorld();
      const run0 = Number(scene.hero.frame.name);
      player.runTime = 3.2;
      scene.renderWorld();
      const run3 = Number(scene.hero.frame.name);
      player.runTime = 7.2;
      scene.renderWorld();
      const run7 = Number(scene.hero.frame.name);

      player.grounded = false;
      player.airTime = .03;
      player.vy = -500;
      scene.renderWorld();
      const jumpStart = Number(scene.hero.frame.name);
      player.airTime = .25;
      player.vy = -100;
      scene.renderWorld();
      const jumpUp = Number(scene.hero.frame.name);
      player.vy = 300;
      scene.renderWorld();
      const jumpDown = Number(scene.hero.frame.name);
      player.grounded = true;
      player.landTime = .05;
      scene.renderWorld();
      const landing = Number(scene.hero.frame.name);

      const enemy = new core.Enemy('soldier', 700, core.GROUND);
      enemy.runPhase = .76;
      game.enemies = [enemy];
      scene.renderWorld();
      const enemyFrame = Number(scene.views.get(enemy)?.frame?.name);

      game.track.distance = 839.8;
      scene.renderWorld();
      const terrain839 = scene.terrain.tilePositionX;
      game.track.distance = 840.2;
      scene.renderWorld();
      const terrain840 = scene.terrain.tilePositionX;

      return {
        hero,
        heroFrames,
        soldier,
        flyer,
        cadence,
        heroRuntime: {
          visible: scene.hero.visible,
          alpha: scene.hero.alpha,
          x: scene.hero.x,
          y: scene.hero.y,
          texture: scene.hero.texture.key,
        },
        frames: { run0, run3, run7, jumpStart, jumpUp, jumpDown, landing, enemyFrame },
        terrain: { terrain839, terrain840 },
      };
    });

    console.log('RENDER_CONTRACT', JSON.stringify(result));

    for (const [name, value] of Object.entries({ hero: result.hero, soldier: result.soldier, flyer: result.flyer })) {
      assert.ok(value.maxAlpha >= 245, `${name} precisa conter pixels realmente opacos`);
      assert.ok(value.visiblePixels >= 300, `${name} precisa ter área visual suficiente`);
      assert.ok(value.solidPixels >= 80, `${name} não pode ser apenas um fantasma translúcido`);
    }

    assert.ok(result.hero.orangePixels >= 1500, 'atlas do Goku precisa conter o gi laranja real');
    assert.ok(result.hero.bluePixels >= 350, 'atlas do Goku precisa conter detalhes azuis reais');

    for (const frame of result.heroFrames.slice(0, 8)) {
      assert.ok(frame.visiblePixels >= 700, `corrida frame ${frame.frame} precisa conter o corpo completo`);
      assert.ok(frame.solidPixels >= 350, `corrida frame ${frame.frame} precisa ser opaco`);
      assert.ok(frame.orangePixels >= 180, `corrida frame ${frame.frame} precisa mostrar o gi laranja`);
      assert.ok(frame.bluePixels >= 35, `corrida frame ${frame.frame} precisa mostrar detalhes azuis`);
    }

    // Um ciclo de 8 poses deve parecer corrida, não câmera lenta. A faixa abaixo
    // mantém o ciclo completo entre ~0,69 s (fase 1) e ~0,53 s (fase 5).
    assert.equal(result.cadence.stride, 230, 'stride visual da corrida deve ser 230px por ciclo');
    assert.ok(result.cadence.phase1.cycleSeconds > .65 && result.cadence.phase1.cycleSeconds < .72,
      `fase 1 deve completar o ciclo em ~0,69 s, recebido ${result.cadence.phase1.cycleSeconds}`);
    assert.ok(result.cadence.phase5.cycleSeconds > .50 && result.cadence.phase5.cycleSeconds < .56,
      `fase 5 deve completar o ciclo em ~0,53 s, recebido ${result.cadence.phase5.cycleSeconds}`);
    assert.ok(result.cadence.phase1.changes >= 11 && result.cadence.phase1.changes <= 12,
      `fase 1 deve avançar ~12 poses/s: ${result.cadence.phase1.changes}`);
    assert.ok(result.cadence.phase5.changes >= 14 && result.cadence.phase5.changes <= 15,
      `fase 5 deve avançar ~15 poses/s: ${result.cadence.phase5.changes}`);
    assert.equal(result.cadence.phase1.visited.length, 8, 'fase 1 precisa usar as 8 poses da corrida');
    assert.equal(result.cadence.phase5.visited.length, 8, 'fase 5 precisa usar as 8 poses da corrida');

    assert.equal(result.heroRuntime.visible, true, 'sprite do Goku precisa estar visível durante gameplay');
    assert.equal(result.heroRuntime.alpha, 1, 'sprite do Goku precisa renderizar com alpha 1');
    assert.equal(result.heroRuntime.texture, 'hero', 'gameplay precisa usar o atlas hero validado');

    assert.deepEqual(result.frames, {
      run0: 0,
      run3: 3,
      run7: 7,
      jumpStart: 8,
      jumpUp: 9,
      jumpDown: 10,
      landing: 11,
      enemyFrame: 3,
    });
    assert.equal(result.terrain.terrain839, 839, 'terreno deve usar deslocamento inteiro');
    assert.equal(result.terrain.terrain840, 840, 'wrap do terreno não pode produzir salto fracionário');

    console.log('PASS: Goku real, 8 poses, passada em 0,69–0,53 s, pulo sincronizado e terreno alinhado.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
