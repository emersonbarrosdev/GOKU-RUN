import Phaser from 'phaser';
import { GROUND_ART } from './native-player.mjs';

const C = window.GokuCore;
const Campaign = window.GokuCampaign;
const $ = id => document.getElementById(id);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const ATTACK_CYCLE = 6;
const RADITZ_TEXTURE = 'boss-raditz';
const RADITZ_SHEET = './assets/game/bosses/raditz-spritesheet.webp';

const BOSS_STYLE = {
  nappa:{skin:0xd4a071,hair:0x2b241f,body:0x24262d,accent:0xc6a83b,scale:1.14,hairMode:'bald'},
  vegeta:{skin:0xd5a074,hair:0x11131a,body:0x183c8e,accent:0xf2e7d2,scale:.98,hairMode:'spike'},
  recoome:{skin:0xd5a074,hair:0xb44532,body:0x2f2c37,accent:0xf4ead6,scale:1.12,hairMode:'crest'},
  'burter-jeice':{skin:0x4c78b6,hair:0xe8e8e8,body:0x2c2c38,accent:0xe6dbcb,scale:1.0,hairMode:'dual'},
  ginyu:{skin:0x8e64a7,hair:0x1c1b22,body:0x2a2b35,accent:0xede4d5,scale:1.08,hairMode:'horns'},
  freeza:{skin:0xf1eee9,hair:0x9a5bb5,body:0xf1eee9,accent:0x8f4fb2,scale:.96,hairMode:'smooth'},
  'android-19':{skin:0xe7ddd0,hair:0x15161c,body:0xc17b3b,accent:0x2c2b31,scale:1.02,hairMode:'hat'},
  cell:{skin:0x7aa84f,hair:0x1f3f2b,body:0x4d7d3c,accent:0x1f2524,scale:1.08,hairMode:'crest'},
  yakon:{skin:0x6f8f44,hair:0x1c261e,body:0x31382f,accent:0x9aae59,scale:1.18,hairMode:'monster'},
  'majin-vegeta':{skin:0xd4a074,hair:0x11131a,body:0x173d83,accent:0xd7c7a5,scale:.98,hairMode:'spike'},
  'fat-buu':{skin:0xd884a7,hair:0xd884a7,body:0xf3eee4,accent:0x6b426f,scale:1.20,hairMode:'round'},
  'super-buu':{skin:0xd25f8f,hair:0xd25f8f,body:0xf1eee8,accent:0x35333b,scale:1.06,hairMode:'smooth'},
  'buu-illusions':{skin:0xb9c6d0,hair:0x243c30,body:0x5b6c92,accent:0xcad7e0,scale:1.02,hairMode:'illusion'},
  'kid-buu':{skin:0xd45588,hair:0xd45588,body:0xf1eee8,accent:0x33323a,scale:.92,hairMode:'smooth'},
  caterpy:{skin:0x7fae5f,hair:0x305b32,body:0x6c934d,accent:0xd0c86f,scale:1.13,hairMode:'monster'},
  maraikoh:{skin:0x8c6e54,hair:0x31353a,body:0x5d493c,accent:0xb89a70,scale:1.15,hairMode:'crest'},
  paikuhan:{skin:0x75a670,hair:0x1d2b22,body:0x243d5c,accent:0xd2c29a,scale:1.04,hairMode:'hat'},
};

function waitForScene() {
  return new Promise(resolve => {
    const probe = () => {
      const game = Phaser.GAMES?.find?.(Boolean);
      const scene = game?.scene?.getScene?.('runner');
      if (scene?.model && scene?.nativePlayer) return resolve(scene);
      requestAnimationFrame(probe);
    };
    probe();
  });
}

function loadCampaignBossAssets(scene) {
  if (scene.textures.exists(RADITZ_TEXTURE)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onComplete = () => {
      scene.load.off('loaderror', onError);
      resolve();
    };
    const onError = file => {
      if (file?.key !== RADITZ_TEXTURE) return;
      scene.load.off('complete', onComplete);
      reject(new Error(`Não foi possível carregar ${RADITZ_SHEET}`));
    };
    scene.load.once('complete', onComplete);
    scene.load.on('loaderror', onError);
    scene.load.spritesheet(RADITZ_TEXTURE, RADITZ_SHEET, { frameWidth: 128, frameHeight: 128 });
    scene.load.start();
  });
}

function drawHair(g, style) {
  g.fillStyle(style.hair, 1);
  switch (style.hairMode) {
    case 'bald': break;
    case 'horns':
      g.fillTriangle(-25,-157,-45,-185,-10,-166).fillTriangle(25,-157,45,-185,10,-166);
      break;
    case 'hat':
      g.fillRoundedRect(-31,-169,62,18,5).fillRect(-22,-183,44,18);
      break;
    case 'round':
      g.fillCircle(0,-160,26);g.fillTriangle(10,-175,28,-210,20,-160);
      break;
    case 'smooth':
      g.fillEllipse(0,-160,50,30);g.fillTriangle(15,-174,37,-208,25,-154);
      break;
    case 'monster':
      g.fillTriangle(-22,-160,-43,-190,-8,-170).fillTriangle(22,-160,43,-190,8,-170);
      break;
    case 'crest':
      g.fillTriangle(-12,-164,0,-201,10,-165).fillTriangle(2,-165,20,-195,20,-160);
      break;
    default:
      for (const x of [-28,-14,0,14,28]) g.fillTriangle(x-10,-156,x,-196-Math.abs(x)/2,x+10,-154);
  }
}

function drawFighter(scene, style, label, offsetX = 0, alpha = 1) {
  const root = scene.add.container(offsetX, 0).setAlpha(alpha);
  const aura = scene.add.graphics();
  aura.fillStyle(style.accent, .12).fillEllipse(0,-78,108,190);
  const g = scene.add.graphics();
  g.fillStyle(style.body, 1).fillRoundedRect(-27,-112,54,72,13);
  g.fillStyle(style.accent, .95).fillRoundedRect(-31,-104,62,18,7);
  g.fillStyle(style.body, 1).fillRoundedRect(-26,-49,20,51,8).fillRoundedRect(6,-49,20,51,8);
  g.fillStyle(style.skin, 1).fillRoundedRect(-43,-105,15,62,7).fillRoundedRect(28,-105,15,62,7);
  g.fillStyle(style.skin, 1).fillCircle(0,-145,27);
  g.lineStyle(3,0x22232a,.8).lineBetween(-11,-145,-4,-145).lineBetween(4,-145,11,-145);
  g.fillStyle(style.accent, .9).fillCircle(-8,-146,2.4).fillCircle(8,-146,2.4);
  drawHair(g, style);
  if (style.hairMode === 'illusion') g.lineStyle(3,0xaad5ff,.7).strokeCircle(0,-145,34);
  const name = scene.add.text(0,-219,label,{
    fontFamily:'Arial Black, Arial',fontSize:'13px',color:'#ffffff',stroke:'#161a22',strokeThickness:4
  }).setOrigin(.5);
  root.add([aura,g,name]);
  root.setScale(style.scale || 1);
  return root;
}

function createRaditzActor(scene, stage) {
  const container = scene.add.container(0, 0).setVisible(false).setName('campaign-boss-raditz');
  const sprite = scene.add.sprite(0, 8, RADITZ_TEXTURE, 0)
    .setOrigin(.5, 1)
    .setScale(1.42)
    .setName('raditz-sprite');
  const name = scene.add.text(0,-207,stage.boss,{
    fontFamily:'Arial Black, Arial',
    fontSize:'13px',
    color:'#fff7e5',
    stroke:'#161a22',
    strokeThickness:4,
  }).setOrigin(.5);
  container.add([sprite,name]);
  container.setData('sprite', sprite);
  container.setData('rasterBoss', true);
  return container;
}

function createBossActor(scene, stage) {
  let container;
  if (stage.id === 'raditz') {
    container = createRaditzActor(scene, stage);
  } else {
    container = scene.add.container(0, 0).setVisible(false);
    const style = BOSS_STYLE[stage.id] || BOSS_STYLE.vegeta;
    if (stage.id === 'burter-jeice') {
      const left = drawFighter(scene, {...style,skin:0x4d78ba,hair:0xf1f1ef,accent:0xc2d0f1}, 'BURTER', -37, 1);
      const right = drawFighter(scene, {...style,skin:0xb95852,hair:0xf1e4db,accent:0xf0c06d}, 'JEICE', 37, 1);
      left.setScale(.83);right.setScale(.83);container.add([left,right]);
    } else if (stage.id === 'buu-illusions') {
      const a = drawFighter(scene, {...style,skin:0xd1b085,hair:0x1b1b20,body:0x65418d}, 'GOHAN', -52, .9);
      const b = drawFighter(scene, {...style,skin:0xd1b085,hair:0x191a20,body:0x244b8f}, 'GOTENKS', 0, .9);
      const c = drawFighter(scene, {...style,skin:0x68a86a,hair:0x233726,body:0x5b4a85}, 'PICCOLO', 52, .9);
      a.setScale(.70);b.setScale(.70);c.setScale(.70);container.add([a,b,c]);
    } else {
      container.add(drawFighter(scene, style, stage.boss));
    }
  }

  scene.world.add(container);
  scene.world.bringToTop(container);
  scene.world.bringToTop(scene.hero);
  scene.world.bringToTop(scene.foreground);
  scene.labels.forEach(label => scene.world.bringToTop(label));
  return container;
}

function createDecor(scene) {
  const g = scene.add.graphics();
  scene.world.addAt(g, Math.min(2, scene.world.list.length));
  return g;
}

function renderDecor(g, stage) {
  g.clear();
  if (!stage) return;
  if (stage.chapterNumber === 1) {
    g.fillStyle(0x453925,.16);
    for (const [x,w,h] of [[80,250,150],[360,330,190],[760,360,170],[1120,280,150]])
      g.fillTriangle(x-w/2,520,x,520-h,x+w/2,520);
  } else if (stage.chapterNumber === 2) {
    g.fillStyle(0xd8f5ac,.16).fillCircle(1020,110,70).fillCircle(1160,175,38);
    g.fillStyle(0x184e42,.13);
    for (const x of [120,300,620,930,1180]) g.fillEllipse(x,475,46,115).fillEllipse(x+20,430,70,38);
  } else if (stage.chapterNumber === 3) {
    g.fillStyle(0x1f2a38,.16);
    for (const [x,w,h] of [[100,80,180],[230,100,240],[960,130,210],[1130,90,265]]) g.fillRect(x,560-h,w,h);
    g.lineStyle(4,0xd9c59c,.16).strokeRect(470,390,340,170);
  } else if (stage.id === 'buu-illusions') {
    g.fillStyle(0x8f4055,.18);
    for (let i=0;i<8;i++) g.fillEllipse(80+i*180,180+(i%2)*85,250,100);
  } else if (stage.chapterNumber === 4) {
    g.fillStyle(0x4c2530,.13).fillCircle(1080,150,120);
    g.lineStyle(5,0xffd9b0,.10);
    for (let x=100;x<1280;x+=180) g.lineBetween(x,500,x+80,390);
  } else {
    g.fillStyle(0xffffff,.13);
    for (const [x,y,w] of [[120,160,240],[420,115,210],[760,160,260],[1080,100,230]]) g.fillEllipse(x,y,w,55);
    g.lineStyle(3,0xffe59a,.22).strokeEllipse(1110,170,90,28);
  }
}

function installUiRewrite(scene) {
  const original = scene.ui.render.bind(scene.ui);
  scene.ui.render = patch => {
    const g = scene.model, stage = g?.campaignStage;
    const next = {...patch};
    if (stage) {
      const modeStages = g.campaignMode === 'bonus' ? Campaign.bonusStages : Campaign.mainStages;
      const globalIndex = g.campaignStageIndex + 1;
      next.phaseLabel = `CAP. ${stage.chapterNumber} · FASE ${stage.stage}/${stage.stageCountInChapter}`;
      next.phaseName = stage.boss;
      next.progress = `${Math.min(100, g.phaseTime / Campaign.stageSeconds * 100).toFixed(2)}%`;
      next.banner = `${stage.name} · ${stage.location}`;
      if (g.state === 'playing') next.bannerHidden = g.phaseBanner <= 0;
      if (g.state === 'campaign-transition') {
        next.panelHidden = true;next.hudHidden = true;next.kiHidden = true;
      }
      if (g.state === 'game-over') {
        next.title = 'VOCÊ CAIU DIANTE DE ' + stage.boss;
        next.subtitle = `${stage.chapterTitle} · fase ${stage.stage}/${stage.stageCountInChapter}`;
        next.startText = 'TENTAR NOVAMENTE';
      }
      if (g.state === 'victory' && g.campaignCompletion === 'main') {
        next.title = 'SAGAS PRINCIPAIS CONCLUÍDAS!';
        next.subtitle = 'O Torneio do Outro Mundo foi desbloqueado.';
        next.startText = 'JOGAR BÔNUS';
      } else if (g.state === 'victory' && g.campaignCompletion === 'bonus') {
        next.title = 'TORNEIO DO OUTRO MUNDO CONCLUÍDO!';
        next.subtitle = 'Você venceu Caterpy, Maraikoh e Paikuhan.';
        next.startText = 'JOGAR SAGAS';
      }
      if (g.state === 'menu') {
        next.subtitle = g.bonusUnlocked ? '4 sagas principais · Torneio do Outro Mundo desbloqueado' : '4 sagas principais · 15 fases · bônus após Kid Boo';
        next.startText = 'JOGAR';
      }
      if (g.state === 'playing') {
        next.result = '';
        next.instructions = g.campaignMode === 'bonus'
          ? `BÔNUS ${globalIndex}/${modeStages.length} · pule, leia os ataques e use o KI`
          : `FASE ${globalIndex}/${modeStages.length} · pule o chefe e os obstáculos · K ativa KI`;
      }
    }
    original(next);
  };
  scene.syncUI();
}

function ensureBonusButton(scene) {
  const start = $('start-button');
  if (!start?.parentElement) return null;
  let button = $('bonus-button');
  if (!button) {
    button = document.createElement('button');
    button.id = 'bonus-button';button.type = 'button';button.textContent = 'TORNEIO DO OUTRO MUNDO';button.hidden = true;
    button.style.cssText = 'display:block;width:100%;min-height:42px;margin:11px 0 0;padding:9px 16px;border:1px solid #b8e7ff88;border-radius:999px;background:#17344ddd;color:#dff5ff;font-size:clamp(10px,1.05vw,13px);letter-spacing:.06em;box-shadow:0 4px 14px #0005';
    start.insertAdjacentElement('afterend', button);
    button.addEventListener('click', event => {
      event.preventDefault();event.stopPropagation();
      if (!scene.model.bonusUnlocked) return;
      scene.model.campaignMode = 'bonus';scene.model.campaignNextMode = null;scene.startRun();
    });
  }
  return button;
}

function installGroundSnap(scene) {
  const native = scene.nativePlayer;
  const CHUNK_WIDTH = 256;
  native.syncFloor = track => {
    const chunks = [];
    const visibleSegments = track.segments.filter(segment =>
      segment.end - track.distance > -CHUNK_WIDTH && segment.start - track.distance < 1280 + CHUNK_WIDTH);

    for (const segment of visibleSegments) {
      let cursor = segment.start;
      while (cursor < segment.end - .01) {
        const width = Math.min(CHUNK_WIDTH, segment.end - cursor);
        chunks.push({ worldX: cursor, width });
        cursor += width;
      }
    }

    const tint = scene.model?.campaignStage?.groundTint || 0xffffff;
    chunks.forEach((chunk, index) => {
      let floor = native.floorViews[index];
      if (!floor) {
        floor = scene.add.tileSprite(0, native.ground, CHUNK_WIDTH, GROUND_ART.visibleHeight, GROUND_ART.key).setOrigin(0);
        scene.groundLayer.add(floor);
        native.floors.add(floor);
        floor.body.checkCollision.left = false;
        floor.body.checkCollision.right = false;
        floor.body.checkCollision.down = false;
        native.floorViews.push(floor);
      }
      const drawX = Math.round(chunk.worldX - track.distance);
      const drawWidth = Math.max(1, Math.round(chunk.width));
      floor.setVisible(true).setPosition(drawX, native.ground).setSize(drawWidth, GROUND_ART.visibleHeight);
      floor.tilePositionX = Math.round(chunk.worldX) % GROUND_ART.width;
      floor.tilePositionY = 0;
      floor.setTint(tint);
      floor.body.enable = true;
      floor.body.updateFromGameObject();
    });
    native.floorViews.slice(chunks.length).forEach(floor => {
      floor.setVisible(false);
      floor.body.enable = false;
    });
  };
  scene.cameras.main.setRoundPixels(true);
}

function renderGroundCaps(scene, graphics) {
  const g = scene.model, tint = g.campaignStage?.groundTint || 0xffffff;
  graphics.clear();
  const color = Phaser.Display.Color.IntegerToColor(tint);
  const dark = Phaser.Display.Color.GetColor(Math.round(color.red*.55),Math.round(color.green*.55),Math.round(color.blue*.55));
  const grass = Phaser.Display.Color.GetColor(Math.min(255,Math.round(color.red*1.08)),Math.min(255,Math.round(color.green*1.12)),Math.min(255,Math.round(color.blue*.86)));
  for (const segment of g.track.segments) {
    const left = Math.round(segment.start - g.track.distance), right = Math.round(segment.end - g.track.distance);
    if (right < -20 || left > 1300) continue;
    graphics.fillStyle(dark,.92);
    graphics.fillTriangle(left,560,left+13,560,left+2,690);
    graphics.fillTriangle(right,560,right-13,560,right-2,690);
    graphics.fillStyle(grass,.95).fillRect(left,558,14,6).fillRect(right-14,558,14,6);
  }
}

function fireOnce(g, key, callback) {
  if (g.campaignBossShotKeys.has(key)) return;
  g.campaignBossShotKeys.add(key);callback();
}

function bossDamage(g, cycle, bossBox) {
  if (g._campaignBossHitCycle === cycle || !C.overlap(g.player.box, bossBox)) return;
  g._campaignBossHitCycle = cycle;
  const result = g.player.damage();
  if (result === 'ignored') return;
  if (result === 'shield') {
    g.audio.play('shield', .24);g.message('KI BLOQUEOU O CHEFE', g.player.x, g.player.foot - 130, '#ffe287');
  } else {
    g.audio.play('hit', .28);g.flash = .14;g.message('CHEFE! −1 VIDA', g.player.x, g.player.foot - 130, '#ffabb1');
    if (!g.player.lives) g.finish(false);
  }
}

function setRaditzFrame(actor, attack, local) {
  const sprite = actor?.getData?.('sprite');
  if (!sprite) return;
  let frame = Math.floor(local * 5) % 2;
  if (attack === 'charge') frame = 2 + (Math.floor(local * 8) % 2);
  else if (attack === 'fly-dive') frame = 6;
  else if (attack === 'blast') frame = local < 2 ? 4 : 5;
  else if (attack === 'rocks') frame = 4;
  sprite.setFrame(frame);
}

function renderBoss(scene, actor) {
  const g = scene.model, stage = g.campaignStage;
  if (!stage || !actor || g.state !== 'playing') {
    actor?.setVisible(false);
    return;
  }
  actor.setVisible(true).setAlpha(1).setAngle(0);
  const cycle = Math.floor(g.phaseTime / ATTACK_CYCLE);
  const local = g.phaseTime - cycle * ATTACK_CYCLE;
  let attack = stage.bossAttacks[cycle % stage.bossAttacks.length];
  if (attack === 'illusion') attack = ['charge','fly-dive','blast'][cycle % 3];
  let x = 1110, foot = C.GROUND, dangerous = false, width = 78, height = 148;

  if (local < .9) {
    x = lerp(1320,1110,local/.9);
  } else if (attack === 'charge') {
    const t = (local-.9)/2.65;x = lerp(1110,-170,t);dangerous = local < 3.65;
    actor.setAngle(Math.sin(t*Math.PI)*-5);
  } else if (attack === 'fly-dive') {
    if (local < 2.05) { x = lerp(1120,850,(local-.9)/1.15);foot = 335; }
    else if (local < 3.35) { const t=(local-2.05)/1.3;x=lerp(850,430,t);foot=lerp(335,555,t);dangerous=t>.48; }
    else { x=lerp(430,1180,(local-3.35)/1.3);foot=lerp(555,330,(local-3.35)/1.3); }
  } else if (attack === 'blast') {
    x=1080;foot=stage.id==='vegeta'||stage.id==='freeza'||stage.id==='cell'?390:C.GROUND;
    if(local>2.0)fireOnce(g,`${cycle}:blast`,()=>g.enemies.push(new C.Enemy('blast',1010,C.GROUND-38)));
  } else if (attack === 'barrage') {
    x=1060;foot=360;
    if(local>1.75)fireOnce(g,`${cycle}:b1`,()=>g.enemies.push(new C.Enemy('blast',1010,C.GROUND-155)));
    if(local>2.55)fireOnce(g,`${cycle}:b2`,()=>g.enemies.push(new C.Enemy('blast',1040,C.GROUND-38)));
    if(local>3.35)fireOnce(g,`${cycle}:b3`,()=>g.enemies.push(new C.Enemy('blast',1080,C.GROUND-155)));
  } else if (attack === 'rocks') {
    x=1100;foot=C.GROUND;
    if(local>1.7)fireOnce(g,`${cycle}:r1`,()=>g.enemies.push(new C.Enemy('boulder',1160,C.GROUND)));
    if(local>3.0)fireOnce(g,`${cycle}:r2`,()=>g.enemies.push(new C.Enemy('boulder',1280,C.GROUND)));
  } else if (attack === 'dual') {
    const t=(local-.9)/2.5;x=lerp(1130,-130,t);dangerous=local<3.5;width=126;
    if(local>2.05)fireOnce(g,`${cycle}:d1`,()=>g.enemies.push(new C.Enemy('blast',1050,C.GROUND-155)));
  }

  if (stage.id === 'raditz') {
    width = 86;
    height = 174;
    setRaditzFrame(actor, attack, local);
  }
  if (local > 4.7) actor.setAlpha(clamp((ATTACK_CYCLE-local)/1.3,0,1));
  actor.setPosition(Math.round(x),Math.round(foot));
  if (stage.id === 'fat-buu') { width=100;height=150; }
  if (stage.id === 'buu-illusions' || stage.id === 'burter-jeice') width=138;
  if (dangerous) bossDamage(g, cycle, {x:x-width/2,y:foot-height,w:width,h:height});
}

function stageVisual(stage) {
  if (stage.id === 'raditz') {
    return {
      src:'./assets/game/story/story-raditz.webp',
      alt:'Raditz em posição de combate',
      badge:'CHEFE · RADITZ',
    };
  }
  return {
    src:'./assets/game/story/story-combat.png',
    alt:`Indicador de combate contra ${stage.boss}`,
    badge:`CHEFE · ${stage.boss}`,
  };
}

function showTransition(scene, transition) {
  const overlay=$('story-overlay'), kicker=$('story-kicker'), title=$('story-title'), text=$('story-text');
  const next=$('story-next'), skip=$('story-skip'), progress=$('story-progress');
  const visual=$('story-visual-image'), badge=$('story-visual-badge');
  if (!overlay || !kicker || !title || !text || !next || !progress) {
    scene.model.state='playing';return () => {};
  }
  const stage=transition.stage;
  const art=stageVisual(stage);
  overlay.hidden=false;overlay.dataset.mode='campaign';
  kicker.textContent=`CAPÍTULO ${stage.chapterNumber} · ${stage.chapterTitle}`;
  title.textContent=`FASE ${stage.stage}/${stage.stageCountInChapter} · ${stage.boss}`;
  text.textContent=`${stage.location} — ${stage.description}`;
  progress.textContent=transition.chapterChanged?'CARREGANDO NOVO CENÁRIO E CHÃO…':'CARREGANDO FASE…';next.textContent='INICIAR FASE';
  if(skip)skip.hidden=true;
  if(visual){visual.src=art.src;visual.alt=art.alt;}
  if(badge)badge.textContent=art.badge;
  let closed=false;
  const close=()=>{
    if(closed)return;closed=true;clearTimeout(timer);next.onclick=null;overlay.hidden=true;overlay.dataset.mode='';if(skip)skip.hidden=false;
    scene.model.state='playing';scene.model.phaseBanner=2.6;scene.syncUI();
  };
  next.onclick=close;
  const timer=setTimeout(close,1250);
  return ()=>{clearTimeout(timer);next.onclick=null;};
}

export async function bootCampaignRuntime() {
  if (!C || !Campaign) return () => {};
  const scene = await waitForScene();
  await loadCampaignBossAssets(scene);
  installUiRewrite(scene);installGroundSnap(scene);
  const bonusButton = ensureBonusButton(scene);
  const decor = createDecor(scene);
  const caps = scene.add.graphics();scene.world.add(caps);scene.world.bringToTop(caps);scene.world.bringToTop(scene.hero);scene.world.bringToTop(scene.foreground);

  let bossActor = null, bossStageId = '', transitionId = -1, stopTransition = () => {}, raf = 0, disposed = false, lastDecorStage = '';
  const tick = () => {
    if (disposed) return;
    const g = scene.model, stage = g.campaignStage;
    if (stage && stage.id !== bossStageId) {
      bossActor?.destroy(true);bossActor=createBossActor(scene,stage);bossStageId=stage.id;
    }
    if (stage && stage.id !== lastDecorStage) { renderDecor(decor,stage);lastDecorStage=stage.id; }
    if (g.state === 'campaign-transition' && g.campaignTransition?.id !== transitionId) {
      transitionId=g.campaignTransition.id;stopTransition();stopTransition=showTransition(scene,g.campaignTransition);
    }
    renderBoss(scene,bossActor);
    renderGroundCaps(scene,caps);
    if (bonusButton) bonusButton.hidden = !(g.bonusUnlocked && (g.state === 'menu' || (g.state === 'victory' && g.campaignCompletion !== 'main')));
    raf=requestAnimationFrame(tick);
  };
  tick();

  return () => {
    disposed=true;cancelAnimationFrame(raf);stopTransition();bossActor?.destroy(true);decor.destroy();caps.destroy();
    if (bonusButton) bonusButton.remove();
  };
}
