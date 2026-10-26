const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    page.on('pageerror', error => console.error('STORY_PAGE_ERROR', error.message));
    const url = process.env.TEST_URL || 'http://127.0.0.1:4173/';

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('goku-run-campaign-intro-seen-v1'));
    await page.reload({ waitUntil: 'networkidle' });

    const story = page.locator('#story-overlay');
    await story.waitFor({ state: 'visible', timeout: 15000 });
    await expectText(page, '#story-kicker', 'SAGA DOS SAIYAJINS');
    await expectText(page, '#story-title', 'Raditz');
    await expectText(page, '#story-text', '15 fases');
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).waitFor({ state: 'visible' });

    const previewImage = page.locator('#story-runner-preview img');
    await previewImage.waitFor({ state: 'visible', timeout: 5000 });
    const src = await previewImage.getAttribute('src');
    assert.ok(src?.includes('goku-running-source.gif'), 'a introdução deve preservar o GIF aprovado do Goku');

    const panelVisibility = await page.locator('#panel').evaluate(el => getComputedStyle(el).visibility);
    assert.equal(panelVisibility, 'hidden');
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    assert.equal(await story.isVisible(), true, 'Espaço não pode iniciar o jogo por trás da introdução');

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'CHEFES EM MOVIMENTO');
    await expectText(page, '#story-text', 'rochas');

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'OUTRO MUNDO');
    await expectText(page, '#story-text', 'Kid Boo');

    await page.getByRole('button', { name: 'IR PARA O MENU' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });
    let start = page.getByRole('button', { name: 'JOGAR' });
    await start.waitFor({ state: 'visible', timeout: 5000 });
    const replayStory = page.getByRole('button', { name: 'VER HISTÓRIA' });
    await replayStory.waitFor({ state: 'visible', timeout: 5000 });

    await start.click();
    await story.waitFor({ state: 'visible', timeout: 5000 });
    await expectText(page, '#story-kicker', 'SAGA DOS SAIYAJINS');
    await expectText(page, '#story-title', 'RADITZ');
    await expectText(page, '#story-progress', 'NOVO CENÁRIO E CHÃO');
    await page.getByRole('button', { name: 'INICIAR FASE' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });
    await page.locator('#hud').waitFor({ state: 'visible', timeout: 5000 });
    await expectText(page, '#phase-name', 'RADITZ');

    // Depois de vista uma vez, a introdução não bloqueia todo boot.
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    assert.equal(await story.isVisible(), false, 'introdução já vista deve ser pulada automaticamente');
    start = page.getByRole('button', { name: 'JOGAR' });
    await start.waitFor({ state: 'visible', timeout: 5000 });
    await replayStory.waitFor({ state: 'visible', timeout: 5000 });

    // O menu continua permitindo rever a introdução.
    await replayStory.click();
    await story.waitFor({ state: 'visible', timeout: 5000 });
    await expectText(page, '#story-title', 'Raditz');
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    assert.equal(await story.isVisible(), true, 'replay da introdução também bloqueia início por teclado');
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });

    // O skip funciona também no primeiro acesso.
    await page.evaluate(() => localStorage.removeItem('goku-run-campaign-intro-seen-v1'));
    await page.reload({ waitUntil: 'networkidle' });
    await story.waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });
    await page.getByRole('button', { name: 'JOGAR' }).waitFor({ state: 'visible', timeout: 5000 });

    console.log('PASS: introdução da campanha, GIF do Goku, loading do Raditz, replay e persistência.');
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
