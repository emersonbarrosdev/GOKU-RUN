const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Player, Track, Enemy, Friend, Game, Assets, PHASES, JUMP_FRAMES, RUN_FRAMES,
  overlap, GROUND, PLAYER_HEIGHT, PATHS, FRIEND_FRAMES, panoramaWindow,
  RUN_PIVOTS, JUMP_PIVOTS, SOLDIER_FRAMES, FLIGHT_FRAMES, RUN_STRIDE, GROUND_TILE_WIDTH,
  PLAYER_SCALE } = require('../js/game.js');

function makeGame() {
  const game = Object.create(Game.prototype);
  game.player = new Player(); game.track = new Track();
  game.audio = { play() {}, stopMusic() {}, startMusic() {} }; game.best = 0;
  game.reset(); game.state = 'playing';
  game.encounterTimer = Infinity; game.orbTimer = Infinity;
  game.track.segments = [{ start: -1000, end: 100000 }];
  return game;
}
function advance(game, seconds) {
  for (let i = 0; i < Math.round(seconds * 120); i++) game.update(1 / 120);
}

test('runtime artwork exists and every new animation crop stays inside its PNG', () => {
  const dimensions = {};
  for (const [key, relative] of Object.entries(PATHS)) {
    const png = fs.readFileSync(path.resolve(__dirname, '..', relative));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    dimensions[key] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  }
  for (const [key, frames] of [['run', RUN_FRAMES], ['jump', JUMP_FRAMES], ['friends', FRIEND_FRAMES],['enemies',[...SOLDIER_FRAMES,...FLIGHT_FRAMES]]]) {
    const [width, height] = dimensions[key];
    for (const [x,y,w,h] of frames) {
      assert.ok(x>=0 && y>=0 && w>0 && h>0 && x+w<=width && y+h<=height);
    }
  }
});

test('eight orbs charge KI; pickups during active mode become usable reserve', () => {
  const p = new Player(), track = new Track();
  for (let i = 0; i < 7; i++) p.addKi();
  assert.equal(p.kiReady, false); assert.equal(p.charge, 87.5);
  p.addKi(); assert.equal(p.activateKi(), true);
  p.addKi(); p.addKi(); p.addKi();
  assert.equal(p.reserve, 37.5);
  for (let i = 0; i < 721; i++) p.update(1 / 120, track, 335);
  assert.equal(p.kiActive, false); assert.equal(p.charge, 37.5);
  assert.equal(p.reserve, 0);
});

test('reserve caps at 100 and can activate a second KI cycle', () => {
  const p = new Player(); p.addKi(100); p.activateKi(); p.addKi(250); p.endKi();
  assert.equal(p.charge, 100); assert.equal(p.activateKi(), true);
  assert.equal(p.reserve, 0);
});

test('KI destroys enemy once and rewards exactly 180 points', () => {
  const g = makeGame(); g.player.addKi(100); g.player.activateKi();
  const e = new Enemy('soldier', g.player.x, GROUND); g.enemies.push(e);
  g.collisions(); g.collisions();
  assert.equal(g.score, 180); assert.equal(g.player.lives, 3); assert.equal(e.active, false);
});

test('ally collision costs a life with KI, once only, without destroying ally', () => {
  const g = makeGame(); g.player.addKi(100); g.player.activateKi();
  const friend = new Friend(g.player.x, 1); g.friends.push(friend);
  g.collisions(); g.collisions();
  assert.equal(g.player.lives, 2); assert.equal(friend.active, true);
  assert.equal(friend.touched, true); assert.equal(g.player.kiActive, true);
  assert.equal(g.score, 0);
});

test('grounded Goku passes beneath flyer AND its projectile without damage', () => {
  const g = makeGame(); g.enemies.push(new Enemy('flyer', 1100, GROUND - 160));
  let sawProjectile = false;
  for (let i = 0; i < 480; i++) {
    g.update(1 / 120);
    sawProjectile ||= g.enemies.some(e => e.type === 'blast');
    for (const e of g.enemies) assert.equal(overlap(g.player.box, e.box), false);
  }
  assert.equal(sawProjectile, true); assert.equal(g.player.lives, 3);
});

test('jumping into flight lane collides with the same overhead enemy', () => {
  const g = makeGame(); g.player.foot = GROUND - 120; g.player.grounded = false;
  g.enemies.push(new Enemy('flyer', g.player.x, GROUND - 160));
  g.collisions(); assert.equal(g.player.lives, 2);
});

test('flying bob remains time-based, bounded, and clear of grounded Goku', () => {
  const e = new Enemy('flyer', 5000, GROUND - 160), p = new Player(), track = new Track();
  for (let i = 0; i < 900; i++) {
    e.update(1 / 120, 335, track);
    assert.ok(Math.abs(e.foot - e.baseFoot) <= 3.00001);
    assert.ok(e.foot < p.foot - PLAYER_HEIGHT - 45);
  }
});

test('ground projectile hits a runner and is clearable by jumping', () => {
  const g = makeGame(); g.enemies.push(new Enemy('blast', g.player.x, GROUND - 36));
  g.collisions(); assert.equal(g.player.lives, 2);
  const h = makeGame(); h.player.foot -= 100;
  h.enemies.push(new Enemy('blast', h.player.x, GROUND - 36));
  h.collisions(); assert.equal(h.player.lives, 3);
});

test('a normal jump traverses widest pit at slowest phase speed', () => {
  const g = makeGame();
  g.track.segments = [{ start: -1000, end: 260 }, { start: 405, end: 100000 }];
  g.player.queueJump(); advance(g, 1.1);
  assert.equal(g.player.lives, 3); assert.equal(g.player.grounded, true);
  assert.equal(g.player.foot, GROUND);
});

test('running into a real pit falls, loses one life and recovers on ground', () => {
  const g = makeGame();
  g.track.segments = [{ start: -1000, end: 180 }, { start: 650, end: 100000 }];
  advance(g, 1.2);
  assert.equal(g.player.lives, 2); assert.equal(g.player.grounded, true);
});

test('air encounters are deferred near pits and do not overlap existing ground encounter', () => {
  const g = makeGame(); g.encounterTimer = 0;
  g.track.segments = [{ start: -1000, end: 1400 }, { start: 1545, end: 5000 }];
  g.spawnEncounter(); assert.equal(g.enemies.length, 0);
  g.track.segments = [{ start: -1000, end: 100000 }];
  g.enemies.push(new Enemy('soldier', 1050, GROUND));
  g.spawnEncounter(); assert.equal(g.enemies.length, 1);
});

test('native player frames share one cell, scale and explicit foot pivot', () => {
  assert.equal(RUN_FRAMES.length,10);assert.equal(JUMP_FRAMES.length,4);
  assert.equal(PLAYER_SCALE.run,.65);assert.equal(PLAYER_SCALE.jump,.65);
  for(let i=0;i<RUN_FRAMES.length;i++){
    const [x,y,w,h]=RUN_FRAMES[i];assert.deepEqual([w,h],[256,256]);
    assert.deepEqual(RUN_PIVOTS[i],[x+128,y+240]);
  }
  for(let i=0;i<JUMP_FRAMES.length;i++){
    const [x,y,w,h]=JUMP_FRAMES[i];assert.deepEqual([w,h],[256,256]);
    assert.deepEqual(JUMP_PIVOTS[i],[x+128,y+240]);
  }
});

test('each ally cycles through four actual sprite frames', () => {
  for (let variant = 0; variant < 3; variant++) {
    const friend = new Friend(1000, variant), frames = new Set();
    for (let i = 0; i < 180; i++) { friend.update(1 / 120, 0); frames.add(friend.frame); }
    assert.equal(frames.size, 4);
  }
});

test('death freezes animation, camera, scoring and phase state', () => {
  const g = makeGame(); g.player.lives = 1;
  g.enemies.push(new Enemy('soldier', g.player.x, GROUND)); g.collisions();
  assert.equal(g.state, 'game-over');
  const before = JSON.stringify({ t:g.time, s:g.score, d:g.track.distance, a:g.player.runTime });
  advance(g, 3);
  assert.equal(JSON.stringify({ t:g.time, s:g.score, d:g.track.distance, a:g.player.runTime }), before);
});

test('all five phases select different background panels and finish at 150s', () => {
  const g = makeGame(), panels = new Set();
  g.collisions = () => {}; g.spawnEncounter = () => {}; g.spawnOrbs = () => {};
  for (let i = 0; i < 5; i++) {
    panels.add(g.phaseIndex); advance(g, 30.02);
  }
  assert.equal(panels.size, 5); assert.equal(g.state, 'victory');
});

test('jump has a shorter falling phase and reports a finite landing impulse', () => {
  const p = new Player(), track = new Track(); p.queueJump();
  let ascent=0, descent=0, height=0, impact=0, landed=false;
  for(let i=0;i<120;i++) {
    const result=p.update(1/120,track,335);
    height=Math.max(height,GROUND-p.foot);
    if(p.vy<0)ascent++; else if(!p.grounded)descent++;
    if(result.landed){impact=result.impact;landed=true;break;}
  }
  assert.ok(landed); assert.ok(descent<ascent);
  assert.ok(height>115 && height<135);
  assert.ok(impact>.7 && impact<=1);
});

test('run cycle advances all poses and cadence follows distance, not display FPS', () => {
  for(const speed of [335,430]) {
    const theoreticalFps=speed/RUN_STRIDE*RUN_FRAMES.length;
    assert.ok(theoreticalFps>=14&&theoreticalFps<=19,
      `10-pose reference cycle at ${speed}px/s must preserve its cadence; got ${theoreticalFps}`);

    const samples=[];
    for(const updateRate of [30,60,120]) {
      const p=new Player(),track=new Track(),frames=new Set();
      for(let i=0;i<updateRate*2;i++){p.update(1/updateRate,track,speed);frames.add(p.frame);}
      assert.equal(frames.size,RUN_FRAMES.length);
      samples.push(p.runTime);
    }
    const expected=(speed*2/RUN_STRIDE*RUN_FRAMES.length)%RUN_FRAMES.length;
    assert.ok(samples.every(runTime=>Math.abs(runTime-expected)<.000001));
    assert.ok(Math.max(...samples)-Math.min(...samples)<.000001,
      '30/60/120 Hz updates must produce the same distance-driven animation phase');
  }
});

test('double jump can clear the tallest friend and cannot be repeated a third time', () => {
  const g=makeGame(); g.player.queueJump();advance(g,.15);
  g.player.queueJump();advance(g,.15);
  assert.ok(GROUND-g.player.foot>150);
  const velocity=g.player.vy;g.player.queueJump();g.player.update(1/120,g.track,335);
  assert.ok(g.player.vy>velocity); assert.equal(g.player.jumps,0);
});

test('landing impact expires and never shakes the final screen', () => {
  const g=makeGame();g.player.queueJump();advance(g,.6);
  assert.ok(g.groundImpacts.length>0);
  advance(g,.5);assert.equal(g.impactTime,0);assert.equal(g.groundImpacts.length,0);
  g.impactTime=.14;g.hitStop=.05;g.finish(false);
  assert.equal(g.impactTime,0);assert.equal(g.hitStop,0);
});

test('pause freezes physics and restarting clears powers, encounters and effects', () => {
  const g=makeGame();g.player.queueJump();advance(g,.1);g.state='paused';
  const foot=g.player.foot;advance(g,1);assert.equal(g.player.foot,foot);
  g.player.addKi(100);g.player.activateKi();g.player.addKi(25);g.hitStop=.05;g.score=500;
  g.start();assert.equal(g.state,'playing');assert.equal(g.player.foot,GROUND);
  assert.equal(g.score,0);assert.equal(g.player.charge,0);assert.equal(g.player.reserve,0);
  assert.equal(g.hitStop,0);assert.equal(g.enemies.length,0);
});

test('ground tiles cover the complete viewport on both sides of every wrap', () => {
  const track=new Track();
  for(const distance of [0, .1, 839.99,840,840.01,1679.99,1680,50000.1]) {
    track.distance=distance;const tiles=track.visibleTiles();
    assert.ok(tiles[0].x<=0);assert.ok(tiles.at(-1).x+GROUND_TILE_WIDTH>=1280);
    for(let i=1;i<tiles.length;i++)assert.ok(Math.abs(tiles[i].x-tiles[i-1].x-GROUND_TILE_WIDTH)<1e-8);
  }
});

test('tile wrap is only indexing: a world point keeps moving at constant speed', () => {
  const t=new Track(),screen=[];
  for(const d of [839.5,839.75,840,840.25,840.5]){t.distance=d;screen.push(1000-t.distance);}
  for(let i=1;i<screen.length;i++)assert.equal(screen[i]-screen[i-1],-.25);
});

test('impact does not stop scrolling or the animation clock', () => {
  const g=makeGame();g.hitStop=.055;
  const distance=g.track.distance,time=g.player.runTime;
  g.update(1/120);
  assert.ok(g.track.distance>distance);assert.ok(g.player.runTime>time);
});

test('soldier announces its shot and fires at least 600px ahead of Goku', () => {
  for(const type of ['soldier','flyer']) {
    const e=new Enemy(type,1380,type==='flyer'?GROUND-160:GROUND),t=new Track();
    let charged=0,fired=false;
    for(let i=0;i<400;i++){
      e.update(1/120,430,t);if(e.chargeTime>0)charged++;
      if(e.prepareShot(1/120)){assert.ok(e.x>835&&e.x<1001);fired=true;break;}
    }
    assert.ok(fired);assert.ok(charged>=44);assert.equal(e.prepareShot(1),false);
  }
});

test('orb patterns include elevated rewards but stay low in a threat corridor', () => {
  const g=makeGame(),heights=new Set();
  for(let i=0;i<4;i++){g.spawnOrbs();for(const o of g.orbs)heights.add(GROUND-o.y);g.orbs=[];}
  assert.ok(heights.has(49));assert.ok(heights.has(165));assert.ok(heights.size>=5);
  g.enemies=[new Enemy('flyer',1200,GROUND-160)];g.spawnOrbs();
  assert.ok(g.orbs.every(o=>GROUND-o.y===49));
});

test('panorama progresses monotonically without wrapping inside a stage', () => {
  for(let stage=0;stage<5;stage++){
    const start=panoramaWindow(stage,0),mid=panoramaWindow(stage,.5),end=panoramaWindow(stage,1);
    assert.ok(start[0]<mid[0]&&mid[0]<end[0]);
    assert.deepEqual(panoramaWindow(stage,2),end);
    assert.deepEqual(panoramaWindow(stage,-1),start);
  }
});
