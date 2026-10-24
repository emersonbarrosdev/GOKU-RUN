const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const url = process.env.TEST_URL || 'http://127.0.0.1:4173/';
    await page.goto(url, { waitUntil: 'networkidle' });

    const story = page.locator('#story-overlay');
    await story.waitFor({ state: 'visible', timeout: 15000 });

    await expectText(page, '#story-kicker', 'CAPÍTULO 1');
    await expectText(page, '#story-title', 'Goku perdeu seus poderes');
    await expectText(page, '#story-text', 'fruto roxo');

    // O menu pode existir no DOM, mas não pode ser usado antes da história.
    const panelVisibility = await page.locator('#panel').evaluate(el => getComputedStyle(el).visibility);
    assert.equal(panelVisibility, 'hidden');

    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    assert.equal(await story.isVisible(), true, 'Espaço não pode pular a introdução');

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'CAPÍTULO 2');
    await expectText(page, '#story-text', 'não conseguia voar');

    await page.getByRole('button', { name: 'CONTINUAR' }).click();
    await expectText(page, '#story-kicker', 'CAPÍTULO 3');
    await expectText(page, '#story-text', 'cinco mundos');

    await page.getByRole('button', { name: 'IR PARA O MENU' }).click();
    await story.waitFor({ state: 'hidden', timeout: 5000 });

    const start = page.getByRole('button', { name: 'JOGAR' });
    await start.waitFor({ state: 'visible', timeout: 5000 });
    assert.equal(await page.locator('#panel').evaluate(el => getComputedStyle(el).visibility), 'visible');

    await start.click();
    await page.locator('#hud').waitFor({ state: 'visible', timeout: 5000 });

    console.log('PASS: loading -> história -> menu -> JOGAR -> corrida.');
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
