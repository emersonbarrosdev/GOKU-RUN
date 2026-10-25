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
            if (a >= 180 && r >= 130 && g >= 35 && g <= 190 && b <= 110) {
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
      return { frames, transitions };
    });

    console.log('RUN_ANIMATION_AUDIT ' + JSON.stringify(result));

    const torsoXs = result.frames.map(frame => frame.torsoCenter[0]);
    const torsoSpread = Math.max(...torsoXs) - Math.min(...torsoXs);
    const maxTorsoJump = Math.max(...result.transitions.map(t => Math.abs(t.torsoDx)));
    const torsoYs = result.frames.map(frame => frame.torsoCenter[1]);
    const verticalArc = Math.max(...torsoYs) - Math.min(...torsoYs);

    assert.ok(torsoSpread <= 2.5,
      `torso deve permanecer registrado no eixo X; variação=${torsoSpread.toFixed(3)}px`);
    assert.ok(maxTorsoJump <= 2.5,
      `nenhuma troca pode teleportar o torso; maior salto=${maxTorsoJump.toFixed(3)}px`);
    assert.ok(verticalArc >= 2 && verticalArc <= 14,
      `corrida precisa ter arco vertical natural sem quicar; arco=${verticalArc.toFixed(3)}px`);

    // Contact/down/passing mantêm apoio junto ao chão. Frames 3 e 7 são os dois
    // "up" do ciclo e ficam alguns pixels no ar antes do contato do pé oposto.
    const groundedFrames = result.frames.filter(({ frame }) => ![3, 7].includes(frame));
    const flightFrames = result.frames.filter(({ frame }) => [3, 7].includes(frame));
    const groundedBottoms = groundedFrames.map(frame => frame.bbox[3]);
    const groundedSpread = Math.max(...groundedBottoms) - Math.min(...groundedBottoms);
    const groundBaseline = Math.max(...groundedBottoms);

    assert.ok(groundedSpread <= 3,
      `frames de apoio precisam compartilhar baseline; variação=${groundedSpread}px`);
    for (const frame of groundedFrames) {
      assert.ok(frame.bbox[3] >= groundBaseline - 3,
        `frame ${frame.frame} deve permanecer junto ao chão; bottom=${frame.bbox[3]}`);
      assert.ok(frame.groundPixels > 0,
        `frame ${frame.frame} precisa ter pixels de contato/rasante no piso`);
      assert.ok(frame.orangeCount > 130,
        `frame ${frame.frame} precisa conter torso laranja suficiente`);
    }
    for (const frame of flightFrames) {
      assert.ok(frame.bbox[3] <= groundBaseline - 3,
        `frame ${frame.frame} é fase up e deve sair do chão; bottom=${frame.bbox[3]}, baseline=${groundBaseline}`);
      assert.ok(frame.orangeCount > 130,
        `frame ${frame.frame} precisa conter torso laranja suficiente`);
    }

    // Os dois contatos opostos não podem ser a mesma figura repetida.
    assert.ok(Math.abs(result.frames[0].bodyCenter[0] - result.frames[4].bodyCenter[0]) > .5 ||
      Math.abs(result.frames[0].bodyCenter[1] - result.frames[4].bodyCenter[1]) > .5,
      'contatos 0 e 4 precisam representar passos opostos, não a mesma pose duplicada');

    console.log(`PASS: ciclo contact/down/passing/up registrado (X ${torsoSpread.toFixed(2)}px, arco Y ${verticalArc.toFixed(2)}px).`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
