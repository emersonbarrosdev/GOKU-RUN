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
        let orangeCount = 0, orangeX = 0, orangeY = 0, solid = 0;
        for (let y = 0; y < 160; y++) {
          for (let x = 0; x < 160; x++) {
            const i = (y * canvas.width + x0 + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a >= 180) {
              solid++;
              minX = Math.min(minX, x); maxX = Math.max(maxX, x);
              minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
            if (a >= 180 && r >= 130 && g >= 35 && g <= 185 && b <= 105) {
              orangeCount++; orangeX += x; orangeY += y;
            }
          }
        }
        frames.push({ frame, bbox: [minX, minY, maxX, maxY], solid,
          torsoCenter: [orangeX / orangeCount, orangeY / orangeCount], orangeCount });
      }
      const transitions = frames.map((frame, i) => {
        const next = frames[(i + 1) % frames.length];
        return { from: i, to: (i + 1) % frames.length,
          torsoDx: next.torsoCenter[0] - frame.torsoCenter[0],
          torsoDy: next.torsoCenter[1] - frame.torsoCenter[1],
          bottomDy: next.bbox[3] - frame.bbox[3] };
      });
      return { frames, transitions };
    });

    console.log('RUN_ANIMATION_AUDIT ' + JSON.stringify(result));
    const torsoXs = result.frames.map(frame => frame.torsoCenter[0]);
    const torsoSpread = Math.max(...torsoXs) - Math.min(...torsoXs);
    const maxTorsoJump = Math.max(...result.transitions.map(t => Math.abs(t.torsoDx)));
    const bottoms = result.frames.map(frame => frame.bbox[3]);
    const bottomSpread = Math.max(...bottoms) - Math.min(...bottoms);

    assert.ok(torsoSpread <= 1,
      `torso deve permanecer no mesmo eixo X; variação=${torsoSpread.toFixed(3)}px`);
    assert.ok(maxTorsoJump <= 1,
      `troca de frame não pode teleportar o torso; salto=${maxTorsoJump.toFixed(3)}px`);
    assert.ok(bottomSpread <= 1,
      `baseline da corrida precisa ficar estável; variação=${bottomSpread}px`);
    for (const frame of result.frames) {
      assert.ok(frame.solid >= 3000, `frame ${frame.frame} precisa conter corpo sólido completo`);
      assert.ok(frame.orangeCount >= 1200, `frame ${frame.frame} precisa conter gi laranja suficiente`);
    }

    console.log(`PASS: corrida registrada (torso ${torsoSpread.toFixed(3)}px, salto ${maxTorsoJump.toFixed(3)}px, baseline ${bottomSpread}px).`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
