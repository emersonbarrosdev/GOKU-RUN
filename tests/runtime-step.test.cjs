const test = require('node:test');
const assert = require('node:assert/strict');
const { Player, Track, Game, GROUND } = require('../js/game.js');

const STEP = 1 / 60;

function makeRuntimeGame() {
  const game = Object.create(Game.prototype);
  game.player = new Player();
  game.track = new Track();
  game.audio = { play() {}, stopMusic() {}, startMusic() {} };
  game.best = 0;
  game.reset();
  game.state = 'playing';
  game.encounterTimer = Infinity;
  game.orbTimer = Infinity;
  game.track.segments = [{ start: -1000, end: 1000000 }];
  game.collisions = () => {};
  game.spawnEncounter = () => {};
  game.spawnOrbs = () => {};
  return game;
}

test('60 Hz runtime step preserves the intended jump and landing envelope', () => {
  const player = new Player();
  const track = new Track();
  player.queueJump();

  let maxHeight = 0;
  let landed = false;
  let elapsed = 0;

  for (let i = 0; i < 90; i++) {
    const motion = player.update(STEP, track, 335);
    elapsed += STEP;
    maxHeight = Math.max(maxHeight, GROUND - player.foot);
    if (motion.landed) {
      landed = true;
      break;
    }
  }

  assert.equal(landed, true);
  assert.ok(maxHeight >= 115 && maxHeight <= 135, `unexpected jump height: ${maxHeight}`);
  assert.ok(elapsed >= 0.5 && elapsed <= 0.7, `unexpected airtime: ${elapsed}`);
  assert.equal(player.foot, GROUND);
  assert.equal(player.grounded, true);
});

test('60 Hz runtime step still completes all five 30-second phases', () => {
  const game = makeRuntimeGame();
  const seen = new Set();

  for (let i = 0; i < 9200 && game.state === 'playing'; i++) {
    seen.add(game.phaseIndex);
    game.update(STEP);
  }

  assert.deepEqual([...seen], [0, 1, 2, 3, 4]);
  assert.equal(game.state, 'victory');
  assert.ok(game.time >= 149.9 && game.time <= 150.2, `unexpected finish time: ${game.time}`);
});
