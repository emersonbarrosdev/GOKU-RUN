const $ = id => document.getElementById(id);
const STORY_SEEN_KEY = 'goku-run-campaign-intro-seen-v1';
const params = new URLSearchParams(location.search);
const qaMode = params.get('debug') === '1' || params.get('autostart') === '1';

let storyUnlocked = qaMode;

const STORY = [
  {
    kicker: 'CAPÍTULO 1 · SAGA DOS SAIYAJINS',
    title: 'Raditz abre a nova campanha',
    text: 'Goku vai atravessar quatro grandes sagas em 15 fases. Cada fase termina com um vilão próprio, começando por Raditz, Nappa e Vegeta.',
  },
  {
    kicker: 'CHEFES EM MOVIMENTO',
    title: 'Cada vilão muda o jeito de sobreviver',
    text: 'Alguns chefes avançam pelo chão, outros voam, mergulham, disparam energia ou usam sequências de ataques. As rochas, buracos e obstáculos ficam mais frequentes conforme a campanha avança.',
  },
  {
    kicker: 'BÔNUS · OUTRO MUNDO',
    title: 'O torneio só abre depois da batalha final',
    text: 'Derrote Kid Boo para desbloquear o Torneio do Outro Mundo. Depois disso, Caterpy, Maraikoh e Paikuhan ficam disponíveis como três fases bônus.',
  },
];

function hasSeenStory() {
  try { return localStorage.getItem(STORY_SEEN_KEY) === '1'; } catch { return false; }
}

function markStorySeen() {
  try { localStorage.setItem(STORY_SEEN_KEY, '1'); } catch {}
}

function blockPrematureStart(event) {
  if (storyUnlocked || qaMode) return;
  if (event.type === 'click') {
    const target = event.target instanceof Element ? event.target.closest('#start-button') : null;
    if (!target) return;
  } else if (event.type === 'keydown') {
    const key = String(event.key || '').toLowerCase();
    if (![' ', 'arrowup', 'w'].includes(key)) return;
  } else return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
}

function lockStoryGate() {
  if (qaMode) return;
  storyUnlocked = false;
  document.addEventListener('click', blockPrematureStart, true);
  window.addEventListener('keydown', blockPrematureStart, true);
}

function unlockStoryGate() {
  if (qaMode) return;
  storyUnlocked = true;
  document.removeEventListener('click', blockPrematureStart, true);
  window.removeEventListener('keydown', blockPrematureStart, true);
}

if (!qaMode) lockStoryGate();

function waitForMenuReady() {
  return new Promise(resolve => {
    const probe = () => {
      const panel = $('panel');
      const start = $('start-button');
      if (panel?.dataset?.mode === 'menu' && start && !start.hidden) return resolve();
      requestAnimationFrame(probe);
    };
    probe();
  });
}

function animateGifPreview(node) {
  if (!node) return () => {};
  const image = new Image();
  image.alt = 'Goku correndo';
  image.width = 160;
  image.height = 160;
  image.style.objectFit = 'contain';
  image.src = './assets/game/player/goku-running-source.gif';
  node.replaceChildren(image);
  return () => node.replaceChildren();
}

function restoreMenu(panel) {
  panel.hidden = false;
  panel.dataset.mode = 'menu';
  panel.style.display = '';
  panel.style.visibility = 'visible';
  const start = $('start-button');
  const replayStory = $('story-replay');
  if (start) {
    start.hidden = false;
    start.textContent = 'JOGAR';
    start.removeAttribute('aria-hidden');
  }
  if (replayStory) replayStory.hidden = false;
  $('hud')?.setAttribute('hidden', '');
  $('ki-button')?.setAttribute('hidden', '');
  unlockStoryGate();
  start?.focus({ preventScroll: true });
}

function showStory() {
  const overlay = $('story-overlay');
  const panel = $('panel');
  const title = $('story-title');
  const kicker = $('story-kicker');
  const text = $('story-text');
  const next = $('story-next');
  const skip = $('story-skip');
  const progress = $('story-progress');
  const replayStory = $('story-replay');
  if (!overlay || !panel || !next || !title || !kicker || !text || !progress) {
    unlockStoryGate();
    return;
  }

  lockStoryGate();
  if (replayStory) replayStory.hidden = true;
  panel.style.visibility = 'hidden';
  overlay.hidden = false;
  overlay.dataset.mode = 'intro';
  if (skip) skip.hidden = false;
  let page = 0;
  let stopPreview = () => {};

  const render = () => {
    const item = STORY[page];
    kicker.textContent = item.kicker;
    title.textContent = item.title;
    text.textContent = item.text;
    progress.textContent = `${page + 1} / ${STORY.length}`;
    next.textContent = page === STORY.length - 1 ? 'IR PARA O MENU' : 'CONTINUAR';
  };

  const finishStory = () => {
    stopPreview();
    next.onclick = null;
    if (skip) skip.onclick = null;
    overlay.hidden = true;
    overlay.dataset.mode = '';
    markStorySeen();
    restoreMenu(panel);
  };

  next.onclick = () => {
    if (page < STORY.length - 1) {
      page++;
      render();
    } else finishStory();
  };
  if (skip) skip.onclick = finishStory;

  render();
  stopPreview = animateGifPreview($('story-runner-preview'));
}

export async function bootStoryRuntime() {
  if (qaMode) return () => {};
  await waitForMenuReady();

  const replayStory = $('story-replay');
  if (replayStory) replayStory.onclick = () => showStory();

  if (hasSeenStory()) {
    unlockStoryGate();
    if (replayStory) replayStory.hidden = false;
  } else showStory();

  return () => {
    if (replayStory) replayStory.onclick = null;
    unlockStoryGate();
  };
}
