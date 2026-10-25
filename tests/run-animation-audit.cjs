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
      canvas.width = source.width; canvas.height = source.height;
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
          from: i, to: (i + 1) % frames.length,
          torsoDx: next.torsoCenter[0] - frame.torsoCenter[0],
          torsoDy: next.torsoCenter[1] - frame.torsoCenter[1],
          bodyDx: next.bodyCenter[0] - frame.bodyCenter[0],
          bodyDy: next.bodyCenter[1] - frame.bodyCenter[1],
          bottomDy: next.bbox[3] - frame.bbox[3],
        };
      });

      // Compare every rendered pair, not only frame numbers. This prevents an
      // atlas with duplicated poses (rigid arms/legs) from passing the audit.
      const differences = [];
      for (let from = 0; from < 8; from++) {
        for (let to = from + 1; to < 8; to++) {
          let changedPixels = 0;
          for (let y = 20; y < 145; y++) {
            for (let x = 40; x < 120; x++) {
              const a = (y * canvas.width + from * 160 + x) * 4;
              const b = (y * canvas.width + to * 160 + x) * 4;
              const delta = Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) +
                Math.abs(data[a + 2] - data[b + 2]) + Math.abs(data[a + 3] - data[b + 3]);
              if (delta >= 120) changedPixels++;
            }
          }
          differences.push({ from, to, changedPixels });
        }
      }
      return { frames, transitions, differences };
    });

    console.log('RUN_ANIMATION_AUDIT ' + JSON.stringify(result));

    const torsoXs = result.frames.map(frame => frame.torsoCenter[0]);
    const torsoSpread = Math.max(...torsoXs) - Math.min(...torsoXs);
    const maxTorsoJump = Math.max(...result.transitions.map(t => Math.abs(t.torsoDx)));
    const bottoms = result.frames.map(frame => frame.bbox[3]);
    const bottomSpread = Math.max(...bottoms) - Math.min(...bottoms);
    const minimumPoseDifference = Math.min(...result.differences.map(pair => pair.changedPixels));

    assert.ok(torsoSpread <= 1.5,
      `torso deve permanecer no mesmo eixo X no jogging; variação=${torsoSpread.toFixed(3)}px`);
    assert.ok(maxTorsoJump <= 1.5,
      `nenhuma troca pode teleportar o torso; maior salto=${maxTorsoJump.toFixed(3)}px`);
    assert.ok(bottomSpread <= 2,
      `baseline dos pés precisa permanecer estável; variação=${bottomSpread}px`);
    assert.ok(minimumPoseDifference >= 350,
      `todos os frames devem ser poses visualmente distintas; menor diferença=${minimumPoseDifference}px`);

    for (const frame of result.frames) {
      assert.ok(frame.bbox[3] >= 137 && frame.bbox[3] <= 139,
        `frame ${frame.frame} precisa permanecer junto à baseline; bottom=${frame.bbox[3]}`);
      assert.ok(frame.groundPixels > 0,
        `frame ${frame.frame} deve possuir contato/rasante no piso para o trote`);
      assert.ok(frame.orangeCount > 150,
        `frame ${frame.frame} precisa conter torso laranja suficiente`);
    }

    console.log(`PASS: corrida alinhada e 8 poses distintas (torso ${torsoSpread.toFixed(3)}px, salto ${maxTorsoJump.toFixed(3)}px, baseline ${bottomSpread}px, diferença mínima ${minimumPoseDifference}px).`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
