const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    const consoleMessages = [];
    page.on('console', message => consoleMessages.push(message.text()));
    page.on('pageerror', error => console.error('STORY_PAGE_ERROR', error.message));
    const url = process.env.TEST_URL || 'http://127.0.0.1:4173/';

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('goku-run-campaign-intro-seen-v2'));
    await page.reload({ waitUntil: 'networkidle' });

    const story = page.locator('#story-overlay');
    await story.waitFor({ state: 'visible', timeout: 15000 });
    await expectText(page, '#story-kicker', 'SAGA DOS SAIYAJINS');
    await expectText(page, '#story-title', 'Raditz');
    await expectText(page, '#story-text', 'montanhas');
    await expectText(page, '#story-visual-badge', 'RADITZ');
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).waitFor({ state: 'visible' });

    const visualImage = page.locator('#story-visual-image');
    await visualImage.waitFor({ state: 'visible', timeout: 5000 });
    assert.ok((await visualImage.getAttribute('src'))?.includes('story-raditz.png'));
    assert.equal(await page.locator('.story-fruit').count(), 0, 'a fruta antiga não pode existir na introdução');

    const panelVisibility = await page.locator('#panel').evaluate(el => getComputedStyle(el).visibility);
    assert.equal(panelVisibility, 'hidden');
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    assert.equal(await story.isVisible(), true, 'Espaço não pode iniciar o jogo por trás da introdução');

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'PADRÃO DO CHEFE');
    await expectText(page, '#story-text', 'Rajadas');
    assert.ok((await visualImage.getAttribute('src'))?.includes('story-combat.png'));

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'OUTRO MUNDO');
    await expectText(page, '#story-text', 'Kid Boo');
    assert.ok((await visualImage.getAttribute('src'))?.includes('story-tournament.png'));

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
    assert.ok((await visualImage.getAttribute('src'))?.includes('story-raditz.png'),
      'o loading inicial deve mostrar o chefe da fase, não o Goku correndo');
    await story.waitFor({ state: 'hidden', timeout: 5000 });
    await page.locator('#hud').waitFor({ state: 'visible', timeout: 5000 });
    await expectText(page, '#phase-name', 'RADITZ');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    assert.equal(await story.isVisible(), false, 'introdução já vista deve ser pulada automaticamente');
    start = page.getByRole('button', { name: 'JOGAR' });
    await start.waitFor({ state: 'visible', timeout: 5000 });
    await replayStory.waitFor({ state: 'visible', timeout: 5000 });

    await replayStory.click();
    await story.waitFor({ state: 'visible', timeout: 5000 });
    await expectText(page, '#story-title', 'Raditz');
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    assert.equal(await story.isVisible(), true, 'replay da introdução também bloqueia início por teclado');
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });

    await page.evaluate(() => localStorage.removeItem('goku-run-campaign-intro-seen-v2'));
    await page.reload({ waitUntil: 'networkidle' });
    await story.waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('button', { name: 'PULAR HISTÓRIA' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });
    await page.getByRole('button', { name: 'JOGAR' }).waitFor({ state: 'visible', timeout: 5000 });

    assert.equal(
      consoleMessages.some(message => message.includes('AudioContext was not allowed to start')),
      false,
      'o jogo não deve criar AudioContext bloqueado antes de gesto do usuário',
    );

    console.log('PASS: introdução sem fruta/GIF, visual do Raditz, loading da fase, replay, persistência e áudio sem AudioContext bloqueado.');
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
