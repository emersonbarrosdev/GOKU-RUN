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
      const source = window.__gokuRun.scene.textures.get('hero').getSourceImage();
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(source, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      const frames = [];
      for (let frame = 0; frame < 8; frame++) {
        const x0 = frame * 160;
        let minX = 160, maxX = -1, minY = 160, maxY = -1;
        let alphaCount = 0, alphaX = 0, alphaY = 0;
        let orangeCount = 0, orangeX = 0, orangeY = 0;
        let groundPixels = 0;

        for (let y = 0; y < 160; y++) {
          for (let x = 0; x < 160; x++) {
            const i = (y * canvas.width + x0 + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a >= 180) {
              alphaCount++; alphaX += x; alphaY += y;
              minX = Math.min(minX, x); maxX = Math.max(maxX, x);
              minY = Math.min(minY, y); maxY = Math.max(maxY, y);
              if (y >= 137) groundPixels++;
            }
            if (a >= 180 && r >= 130 && g >= 35 && g <= 185 && b <= 105) {
              orangeCount++; orangeX += x; orangeY += y;
            }
          }
        }

        frames.push({
          frame,
          bbox: [minX, minY, maxX, maxY],
          bodyCenter: [alphaX / alphaCount, alphaY / alphaCount],
          torsoCenter: [orangeX / orangeCount, orangeY / orangeCount],
          orangeCount,
          groundPixels,
        });
      }

      const transitions = frames.map((frame, i) => {
        const next = frames[(i + 1) % frames.length];
        return {
          from: i,
          to: (i + 1) % frames.length,
          torsoDx: next.torsoCenter[0] - frame.torsoCenter[0],
          torsoDy: next.torsoCenter[1] - frame.torsoCenter[1],
          bodyDx: next.bodyCenter[0] - frame.bodyCenter[0],
          bodyDy: next.bodyCenter[1] - frame.bodyCenter[1],
          bottomDy: next.bbox[3] - frame.bbox[3],
        };
      });

      return { frames, transitions };
    });

    console.log('RUN_ANIMATION_AUDIT ' + JSON.stringify(result));

    const torsoXs = result.frames.map(frame => frame.torsoCenter[0]);
    const torsoSpread = Math.max(...torsoXs) - Math.min(...torsoXs);
    const maxTorsoJump = Math.max(...result.transitions.map(t => Math.abs(t.torsoDx)));

    assert.ok(torsoSpread <= .75,
      `torso deve permanecer registrado no mesmo eixo X; variação=${torsoSpread.toFixed(3)}px`);
    assert.ok(maxTorsoJump <= .75,
      `nenhuma troca pode teleportar o torso lateralmente; maior salto=${maxTorsoJump.toFixed(3)}px`);

    // Quadros 3 e 7 são as duas poses de voo. Os demais mantêm contato/rasante
    // junto ao piso. Isto preserva o sobe/desce natural sem deslocamento lateral.
    assert.equal(result.frames[3].bbox[3], 134);
    assert.equal(result.frames[7].bbox[3], 134);
    assert.equal(result.frames[3].groundPixels, 0);
    assert.equal(result.frames[7].groundPixels, 0);
    for (const frame of result.frames.filter(({ frame }) => frame !== 3 && frame !== 7)) {
      assert.equal(frame.bbox[3], 139, `frame ${frame.frame} deve permanecer junto ao chão`);
      assert.ok(frame.groundPixels > 0, `frame ${frame.frame} precisa ter pixels no contato/rasante`);
    }

    console.log(`PASS: torso registrado (spread ${torsoSpread.toFixed(3)}px, salto máximo ${maxTorsoJump.toFixed(3)}px) e voo preservado.`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
