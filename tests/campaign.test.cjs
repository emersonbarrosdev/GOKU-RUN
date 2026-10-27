const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../js/campaign-config.js');

const mainBosses = [
  'raditz','nappa','vegeta',
  'recoome','burter-jeice','ginyu','freeza',
  'android-19','cell',
  'yakon','majin-vegeta','fat-buu','super-buu','buu-illusions','kid-buu',
];
const bonusBosses = ['caterpy','maraikoh','paikuhan'];

test('campaign has four main chapters and exactly 15 story stages', () => {
  assert.equal(Campaign.chapters.length, 4);
  assert.equal(Campaign.mainStages.length, 15);
  assert.deepEqual(Campaign.mainStages.map(s => s.id), mainBosses);
  assert.deepEqual(Campaign.mainStages.slice(0, 3).map(s => s.boss), ['RADITZ','NAPPA','VEGETA']);
});

test('Other World bonus stays separate and unlocks only after the main game', () => {
  assert.equal(Campaign.bonusStages.length, 3);
  assert.deepEqual(Campaign.bonusStages.map(s => s.id), bonusBosses);
  assert.ok(Campaign.bonusStages.every(s => s.bonus === true));
  assert.ok(Campaign.mainStages.every(s => !s.bonus));
});

test('every stage has a 30 second runner window and escalating playable values', () => {
  for (const [index, stage] of Campaign.mainStages.entries()) {
    assert.equal(stage.duration, 30, `duration stage ${index + 1}`);
    assert.ok(stage.speed >= 300 && stage.speed <= 540);
    assert.ok(stage.gap >= 0 && stage.gap < .5);
    assert.ok(stage.interval >= 1.4 && stage.interval <= 4);
    assert.ok(stage.bossAttacks.length >= 2);
    assert.ok(stage.environment >= 0 && stage.environment <= 4);
    if (index > 0) assert.ok(stage.speed >= Campaign.mainStages[index - 1].speed);
  }
});

test('Kid Boo is the story finale and bonus never uses lava environment index 4', () => {
  const finale = Campaign.mainStages.at(-1);
  assert.equal(finale.id, 'kid-buu');
  assert.equal(finale.boss, 'KID BOO');
  assert.equal(finale.environment, 4);
  assert.ok(Campaign.bonusStages.every(s => s.environment !== 4));
});

test('Raditz gameplay uses a real raster spritesheet instead of the procedural fighter vector', () => {
  const spritePath = path.join(__dirname, '..', 'assets', 'game', 'bosses', 'raditz-spritesheet.webp');
  const webp = fs.readFileSync(spritePath);
  assert.equal(webp.subarray(0, 4).toString('ascii'), 'RIFF', 'Raditz asset must be WebP/RIFF');
  assert.equal(webp.subarray(8, 12).toString('ascii'), 'WEBP', 'Raditz asset must be WebP');

  const runtime = fs.readFileSync(path.join(__dirname, '..', 'js', 'campaign-runtime.js'), 'utf8');
  assert.match(runtime, /RADITZ_TEXTURE\s*=\s*'boss-raditz'/);
  assert.match(runtime, /scene\.add\.sprite\(0,\s*8,\s*RADITZ_TEXTURE/);
  assert.match(runtime, /frameWidth:\s*64,\s*frameHeight:\s*64/);
  assert.match(runtime, /\.setScale\(2\.65\)/);
  assert.doesNotMatch(runtime, /\braditz:\{skin:/, 'Raditz must not use the generic procedural BOSS_STYLE');
});
