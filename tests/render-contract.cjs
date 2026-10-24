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

      const stats = key => {
        const source = scene.textures.get(key).getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let maxAlpha = 0, visiblePixels = 0, solidPixels = 0;
        for (let i = 3; i < data.length; i += 4) {
          maxAlpha = Math.max(maxAlpha, data[i]);
          if (data[i] >= 40) visiblePixels++;
          if (data[i] >= 220) solidPixels++;
        }
        return { maxAlpha, visiblePixels, solidPixels, width: canvas.width, height: canvas.height };
      };

      const hero = stats('hero');
      const soldier = stats('soldier');
      const flyer = stats('flyer');

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
        hero, soldier, flyer,
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

    console.log('PASS: Goku/inimigos opacos, corrida e pulo sincronizados com a simulação, terreno pixel-alinhado.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
