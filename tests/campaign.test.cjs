const test = require('node:test');
const assert = require('node:assert/strict');
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
