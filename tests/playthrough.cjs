const assert = require('node:assert/strict');
const { Game, Player, Track, GROUND } = require('../js/game.js');

// Deterministic end-to-end runner simulation: normal collisions, lives, KI,
// procedural ground, spawns and all five stages. No invincibility or disabled hits.
function play(seed) {
  let rng = seed >>> 0;
  const originalRandom = Math.random;
  Math.random = () => ((rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296);
  try {
    const g = Object.create(Game.prototype);
    g.player = new Player(); g.track = new Track(); g.best = 0;
    g.audio = { play() {}, stopMusic() {}, startMusic() {} };
    g.reset(); g.state = 'playing';
    const phases = new Set(), types = new Set();
    let jumps = 0, powers = 0, damage = 0;
    const hits = [];
    for (let step = 0; step < 200 * 120 && g.state === 'playing'; step++) {
      const p = g.player;
      if (p.kiReady) { p.activateKi(); powers++; }
      const dangers = [...g.enemies.filter(e => e.active && !e.airborne && (!p.kiActive || p.kiTime < .5)),
        ...g.friends.filter(f => f.active && !f.touched)];
      const nearby = dangers.some(e => e.x - p.x > -35 && e.x - p.x < (e.type === 'blast' ? 175 : 150));
      const nextBody = dangers.some(e => e.type !== 'blast' && e.x - p.x > -35 && e.x - p.x < 230);
      const pitAhead = !g.track.supports(p.x + 55, p.x + 65);
      if (p.grounded && (nearby || pitAhead)) { p.queueJump(); jumps++; }
      else if (!p.grounded && p.jumps > 0 && p.vy > 200 && nextBody) { p.queueJump(); jumps++; }
      const lives = p.lives;
      const snapshot = { time:+g.time.toFixed(2), foot:+p.foot.toFixed(1), vy:+p.vy.toFixed(1), ki:p.kiActive,
        enemies:g.enemies.filter(e=>Math.abs(e.x-p.x)<150).map(e=>({type:e.type,x:+e.x.toFixed(1),foot:e.foot})),
        friends:g.friends.filter(f=>Math.abs(f.x-p.x)<150).map(f=>({variant:f.variant,x:+f.x.toFixed(1)})) };
      g.update(1 / 120);
      damage += lives - p.lives;
      if(lives>p.lives)hits.push(snapshot);
      phases.add(g.phaseIndex);
      for (const e of g.enemies) types.add(e.type);
      assert.ok(Number.isFinite(p.foot) && Number.isFinite(p.vy) && Number.isFinite(g.score));
      assert.ok(g.enemies.length < 30 && g.orbs.length < 40 && g.particles.length < 150);
    }
    return { seed, state: g.state, phases: phases.size, lives: g.player.lives,
      types: [...types].sort(), jumps, powers, damage, seconds: +g.time.toFixed(2), hits };
  } finally { Math.random = originalRandom; }
}

const results = [7, 31, 101, 509, 2026].map(play);
for (const result of results) console.log(JSON.stringify(result));
for (const result of results) {
  assert.equal(result.state, 'victory', 'playthrough seed ' + result.seed);
  assert.equal(result.phases, 5);
  assert.ok(result.powers > 0);
  assert.ok(result.types.includes('flyer') && result.types.includes('blast') && result.types.includes('soldier'));
}
console.log('PASS: five seeded full playthroughs, normal damage and no invincibility.');
