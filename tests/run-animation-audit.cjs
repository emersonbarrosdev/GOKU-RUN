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
    const contactFrames = [0, 1, 4, 5].map(index => result.frames[index]);
    const passingFrames = [2, 6].map(index => result.frames[index]);
    const flightFrames = [3, 7].map(index => result.frames[index]);
    const contactBottom = Math.max(...contactFrames.map(frame => frame.bbox[3]));
    const flightBottom = Math.max(...flightFrames.map(frame => frame.bbox[3]));
    const minimumPoseDifference = Math.min(...result.differences.map(pair => pair.changedPixels));
    const oppositePhaseDifferences = [[0, 4], [1, 5], [2, 6], [3, 7]].map(([from, to]) =>
      result.differences.find(pair => pair.from === from && pair.to === to).changedPixels);
    const boxSize = frame => ({
      width: frame.bbox[2] - frame.bbox[0],
      height: frame.bbox[3] - frame.bbox[1],
    });
    const phasePairs = [[0, 4], [1, 5], [2, 6], [3, 7]].map(pair => pair.map(i => boxSize(result.frames[i])));

    assert.ok(torsoSpread <= 1,
      `torso deve permanecer no mesmo eixo X na corrida; variação=${torsoSpread.toFixed(3)}px`);
    assert.ok(maxTorsoJump <= .75,
      `nenhuma troca pode teleportar o torso; maior salto=${maxTorsoJump.toFixed(3)}px`);
    assert.ok(contactBottom - flightBottom >= 4,
      `a corrida precisa de fase aérea real; contato=${contactBottom}px, voo=${flightBottom}px`);
    assert.ok(minimumPoseDifference >= 1000,
      `todos os frames devem ser poses visualmente distintas; menor diferença=${minimumPoseDifference}px`);
    assert.ok(Math.min(...oppositePhaseDifferences) >= 1800,
      `a segunda passada não pode repetir a primeira; menor diferença entre lados=${Math.min(...oppositePhaseDifferences)}px`);

    // As duas pernas executam as mesmas quatro fases em lados opostos sem o
    // corpo mudar de tamanho. Isso detecta tanto atlas duplicado quanto perna
    // que fica presa para sempre na frente/atrás.
    const tolerances = [{ width: 3, height: 2 }, { width: 10, height: 4 },
      { width: 7, height: 3 }, { width: 4, height: 8 }];
    phasePairs.forEach(([a, b], index) => {
      assert.ok(Math.abs(a.width - b.width) <= tolerances[index].width,
        `fases opostas ${index} devem manter proporção horizontal: ${a.width}px/${b.width}px`);
      assert.ok(Math.abs(a.height - b.height) <= tolerances[index].height,
        `fases opostas ${index} devem manter proporção vertical: ${a.height}px/${b.height}px`);
    });
    const contactWidth = (boxSize(result.frames[0]).width + boxSize(result.frames[4]).width) / 2;
    const passingWidth = (boxSize(result.frames[2]).width + boxSize(result.frames[6]).width) / 2;
    assert.ok(contactWidth - passingWidth >= 20,
      `passagem precisa recolher as pernas entre contatos; contato=${contactWidth}px, passagem=${passingWidth}px`);

    for (const frame of contactFrames) {
      assert.ok(frame.bbox[3] >= 138 && frame.bbox[3] <= 140,
        `contato/compressão ${frame.frame} precisa alcançar a baseline; bottom=${frame.bbox[3]}`);
      assert.ok(frame.groundPixels > 0,
        `contato/compressão ${frame.frame} precisa tocar o piso`);
    }
    for (const frame of passingFrames) {
      assert.ok(frame.bbox[3] >= 136 && frame.bbox[3] <= 138,
        `passagem ${frame.frame} deve aliviar o contato; bottom=${frame.bbox[3]}`);
    }
    for (const frame of flightFrames) {
      assert.ok(frame.bbox[3] <= 135,
        `voo ${frame.frame} precisa sair do chão; bottom=${frame.bbox[3]}`);
      assert.equal(frame.groundPixels, 0, `voo ${frame.frame} não pode conter pixels no piso`);
    }
    for (const frame of result.frames) {
      assert.ok(frame.orangeCount > 150,
        `frame ${frame.frame} precisa conter o gi laranja`);
    }

    console.log(`PASS: corrida alterna as duas pernas com proporção estável (torso ${torsoSpread.toFixed(3)}px, contato ${contactBottom}px, voo ${flightBottom}px, diferença oposta mínima ${Math.min(...oppositePhaseDifferences)}px).`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
