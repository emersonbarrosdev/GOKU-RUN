import Phaser from 'phaser';
import '../css/story.css';

const params = new URLSearchParams(location.search);
const qaMode = params.get('debug') === '1' || params.get('autostart') === '1';
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const STORY = [
  {
    kicker: 'CAPÍTULO 1 · O FRUTO PROIBIDO',
    title: 'O dia em que Goku perdeu seus poderes',
    text: 'Durante uma expedição, Goku encontrou um fruto roxo dentro de um templo abandonado. Uma placa dizia para não tocá-lo. Naturalmente, ele comeu mesmo assim.',
  },
  {
    kicker: 'CAPÍTULO 2 · O SILÊNCIO DO KI',
    title: 'Alguma coisa estava muito errada',
    text: 'Na manhã seguinte, Goku não conseguia voar, não sentia seu ki e nem mesmo um Kamehameha saía de suas mãos. Era como se alguém tivesse roubado — ou selado — todo o seu poder.',
  },
  {
    kicker: 'CAPÍTULO 3 · A ÚNICA PISTA',
    title: 'Uma energia familiar ao longe',
    text: 'Restava apenas um rastro de energia atravessando cinco mundos. Sem voo e sem seus golpes, Goku só tinha uma opção: correr até a origem daquele sinal e descobrir quem estava por trás de tudo.',
  },
];

function waitForScene() {
  return new Promise(resolve => {
    const probe = () => {
      const game = Phaser.GAMES.find(Boolean);
      const scene = game?.scene?.getScene?.('runner');
      if (scene?.model && scene?.textures?.exists('hero')) return resolve(scene);
      requestAnimationFrame(probe);
    };
    probe();
  });
}

function animateSheetPreview(node) {
  if (!node) return () => {};
  let frame = 0;
  const timer = setInterval(() => {
    const x = -(frame % 4) * 105;
    const y = -Math.floor(frame / 4) * 115;
    node.style.backgroundPosition = `${x}px ${y}px`;
    frame = (frame + 1) % 8;
  }, 86);
  return () => clearInterval(timer);
}

function showStory(scene) {
  const overlay = $('story-overlay');
  const panel = $('panel');
  const title = $('story-title');
  const kicker = $('story-kicker');
  const text = $('story-text');
  const next = $('story-next');
  const progress = $('story-progress');
  if (!overlay || !panel || !next) return;

  panel.style.visibility = 'hidden';
  overlay.hidden = false;
  let page = 0;
  const stopPreview = animateSheetPreview($('story-runner-preview'));

  const render = () => {
    const item = STORY[page];
    kicker.textContent = item.kicker;
    title.textContent = item.title;
    text.textContent = item.text;
    progress.textContent = `${page + 1} / ${STORY.length}`;
    next.textContent = page === STORY.length - 1 ? 'COMEÇAR CORRIDA' : 'CONTINUAR';
  };

  next.addEventListener('click', () => {
    if (page < STORY.length - 1) {
      page++;
      render();
      return;
    }
    stopPreview();
    overlay.hidden = true;
    panel.style.visibility = '';
    scene.startRun();
  }, { once: false });

  render();
}

function buildParty(scene) {
  const party = scene.add.container(0, 0).setDepth(5000);
  const bg = scene.add.image(0, 0, 'world0').setOrigin(0).setDisplaySize(1280, 720).setTint(0xb889a3);
  const shade = scene.add.rectangle(640, 360, 1280, 720, 0x130c1c, .28);
  party.add([bg, shade]);

  const confetti = scene.add.graphics();
  const pieces = [
    [92,110,0xffd24a],[170,190,0x66d7ff],[262,100,0xff6b6b],[360,168,0x8cff80],
    [470,86,0xff9bdd],[590,150,0xffd24a],[710,88,0x66d7ff],[820,175,0xff6b6b],
    [930,104,0x8cff80],[1040,160,0xff9bdd],[1160,92,0xffd24a],[1220,210,0x66d7ff],
  ];
  for (const [x,y,color] of pieces) confetti.fillStyle(color, .95).fillRect(x, y, 8, 18);
  party.add(confetti);

  const headline = scene.add.text(640, 72, 'SURPRESA, GOKU!', {
    fontFamily: 'Arial Black, Arial', fontSize: '48px', fontStyle: 'bold', color: '#fff4ba',
    stroke: '#4b2030', strokeThickness: 8,
  }).setOrigin(.5);
  const sub = scene.add.text(640, 123, 'A energia misteriosa sempre esteve vindo dos seus amigos.', {
    fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', stroke: '#241429', strokeThickness: 4,
  }).setOrigin(.5);
  party.add([headline, sub]);

  const hero = scene.add.sprite(245, 557, 'hero', 11).setOrigin(.5, 140/160).setScale(1.28);
  party.add(hero);

  const friendData = [
    { frame: 0, x: 760, label: 'VEGETA', scale: 1.23 },
    { frame: 4, x: 935, label: 'PICCOLO', scale: 1.12 },
    { frame: 8, x: 1085, label: 'KURIRIN', scale: 1.35 },
  ];
  for (const item of friendData) {
    const sprite = scene.add.sprite(item.x, 555, 'allies', item.frame).setOrigin(.5, 140/160).setScale(item.scale);
    const label = scene.add.text(item.x, 400, item.label, {
      fontFamily: 'Arial Black, Arial', fontSize: '16px', color: '#ffffff',
      stroke: '#241429', strokeThickness: 4,
    }).setOrigin(.5);
    party.add([sprite, label]);
  }

  const more = scene.add.text(935, 620, 'GOHAN · BULMA · MESTRE KAME · E TODO MUNDO', {
    fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: '#ffeac2',
    stroke: '#241429', strokeThickness: 3,
  }).setOrigin(.5);
  party.add(more);

  // Bolo simples desenhado em runtime: não cria mais uma textura pesada.
  const cake = scene.add.graphics();
  cake.fillStyle(0xf5c27a).fillRoundedRect(515, 502, 215, 70, 14);
  cake.fillStyle(0xfff2db).fillRoundedRect(515, 490, 215, 32, 14);
  cake.fillStyle(0xff6d70).fillCircle(555, 505, 8).fillCircle(620, 505, 8).fillCircle(685, 505, 8);
  for (const x of [550,590,630,670,710]) {
    cake.fillStyle(0xffe173).fillRect(x, 458, 5, 34);
    cake.fillStyle(0xff9138).fillCircle(x + 2, 453, 5);
  }
  party.add(cake);

  return party;
}

async function beginEnding(scene) {
  const overlay = $('ending-overlay');
  const panel = $('panel');
  const hud = $('hud');
  const ki = $('ki-button');
  const loading = $('ending-loading');
  const dialogue = $('ending-dialogue');
  const replay = $('ending-replay');
  if (!overlay || !panel) return null;

  panel.style.display = 'none';
  hud.hidden = true;
  ki.hidden = true;
  scene.world.setAlpha(0);

  const runScene = scene.add.container(0, 0).setDepth(5000);
  const bg = scene.add.image(0, 0, 'world4').setOrigin(0).setDisplaySize(1280, 720);
  const tint = scene.add.rectangle(640, 360, 1280, 720, 0x16090d, .18);
  const caption = scene.add.text(640, 110, 'A energia estava logo à frente…', {
    fontFamily: 'Arial Black, Arial', fontSize: '28px', color: '#ffffff',
    stroke: '#1a0d11', strokeThickness: 5,
  }).setOrigin(.5);
  const runner = scene.add.sprite(170, 560, 'hero', 0).setOrigin(.5, 140/160).setScale(1.1);
  runner.play('run', true); runner.anims.timeScale = 1.15;
  runScene.add([bg, tint, caption, runner]);

  await new Promise(resolve => scene.tweens.add({
    targets: runner, x: 1390, duration: 2100, ease: 'Sine.easeIn', onComplete: resolve,
  }));
  runScene.destroy(true);

  overlay.hidden = false;
  overlay.dataset.mode = 'loading';
  loading.hidden = false;
  dialogue.hidden = true;
  await sleep(1250);

  loading.hidden = true;
  overlay.dataset.mode = 'party';
  dialogue.hidden = false;
  const party = buildParty(scene);

  const onReplay = () => {
    replay.removeEventListener('click', onReplay);
    party.destroy(true);
    overlay.hidden = true;
    overlay.dataset.mode = '';
    dialogue.hidden = true;
    panel.style.display = '';
    scene.world.setAlpha(1);
    scene.startRun();
  };
  replay.addEventListener('click', onReplay);
  return party;
}

async function bootStoryRuntime() {
  if (qaMode) return;
  const scene = await waitForScene();
  while (scene.model.state !== 'menu') await sleep(30);
  showStory(scene);

  let endingStarted = false;
  const watch = () => {
    if (!endingStarted && scene.model?.state === 'victory') {
      endingStarted = true;
      beginEnding(scene).catch(console.error);
    }
    if (scene.model?.state === 'playing') endingStarted = false;
    requestAnimationFrame(watch);
  };
  watch();
}

bootStoryRuntime().catch(console.error);
