const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    const url = process.env.TEST_URL || 'http://127.0.0.1:4173/';

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('goku-run-story-seen-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    const story = page.locator('#story-overlay');
    await story.waitFor({ state: 'visible', timeout: 15000 });
    await expectText(page, '#story-kicker', 'CAPÍTULO 1');
    await expectText(page, '#story-title', 'Goku perdeu seus poderes');
    await expectText(page, '#story-text', 'fruto roxo');
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).waitFor({ state: 'visible' });

    // Regressão visual: texto/botões podiam estar corretos enquanto a miniatura
    // mostrava apenas um contorno quase invisível. Agora a própria história
    // precisa provar que está desenhando o atlas hero real e colorido.
    const previewCanvas = page.locator('#story-runner-preview canvas');
    await previewCanvas.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(150);
    const preview = await previewCanvas.evaluate(canvas => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let solid = 0;
      let orange = 0;
      let blue = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a >= 220) solid++;
        if (a >= 180 && r >= 130 && g >= 35 && g <= 185 && b <= 105) orange++;
        if (a >= 180 && b >= 55 && b > r * .75 && b > g * .9) blue++;
      }
      return { width: canvas.width, height: canvas.height, solid, orange, blue };
    });
    console.log('STORY_PREVIEW', JSON.stringify(preview));
    assert.equal(preview.width, 160, 'preview da história deve usar um frame 160x160 do atlas hero');
    assert.equal(preview.height, 160, 'preview da história deve usar um frame 160x160 do atlas hero');
    assert.ok(preview.solid >= 350, 'preview da história precisa conter corpo sólido do Goku');
    assert.ok(preview.orange >= 180, 'preview da história precisa mostrar o gi laranja do Goku');
    assert.ok(preview.blue >= 35, 'preview da história precisa mostrar detalhes azuis do Goku');

    const panelVisibility = await page.locator('#panel').evaluate(el => getComputedStyle(el).visibility);
    assert.equal(panelVisibility, 'hidden');

    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    assert.equal(await story.isVisible(), true, 'Espaço não pode iniciar o jogo por trás da introdução');

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'CAPÍTULO 2');
    await expectText(page, '#story-text', 'não conseguia voar');

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'CAPÍTULO 3');
    await expectText(page, '#story-text', 'cinco mundos');

    await page.getByRole('button', { name: 'IR PARA O MENU' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });
    let start = page.getByRole('button', { name: 'JOGAR' });
    await start.waitFor({ state: 'visible', timeout: 5000 });
    await start.click();
    await page.locator('#hud').waitFor({ state: 'visible', timeout: 5000 });

    // Depois de vista uma vez, a história não é obrigatória em todo boot.
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    assert.equal(await story.isVisible(), false, 'história já vista deve ser pulada automaticamente');
    start = page.getByRole('button', { name: 'JOGAR' });
    await start.waitFor({ state: 'visible', timeout: 5000 });

    // O botão PULAR HISTÓRIA também precisa funcionar no primeiro acesso.
    await page.evaluate(() => localStorage.removeItem('goku-run-story-seen-v1'));
    await page.reload({ waitUntil: 'networkidle' });
    await story.waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });
    await page.getByRole('button', { name: 'JOGAR' }).waitFor({ state: 'visible', timeout: 5000 });

    console.log('PASS: história, preview real do Goku, pular história e persistência.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function expectText(page, selector, expected) {
  await page.waitForFunction(
    ({ selector, expected }) => document.querySelector(selector)?.textContent?.includes(expected),
    { selector, expected },
  );
}
