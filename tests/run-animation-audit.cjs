const { chromium } = require('playwright-core');

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
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
