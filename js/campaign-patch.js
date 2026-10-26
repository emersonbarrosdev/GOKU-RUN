(() => {
  'use strict';

  const C = typeof window !== 'undefined' ? window.GokuCore : null;
  const Campaign = typeof window !== 'undefined' ? window.GokuCampaign : null;
  if (!C || !Campaign || C.__campaignPatched) return;

  const { Game, Enemy, GROUND } = C;
  const originalReset = Game.prototype.reset;
  const originalStart = Game.prototype.start;
  const originalUpdate = Game.prototype.update;
  const originalFinish = Game.prototype.finish;
  const originalSpawnEncounter = Game.prototype.spawnEncounter;

  const stagesFor = game => game.campaignMode === 'bonus' ? Campaign.bonusStages : Campaign.mainStages;
  const currentStage = game => stagesFor(game)[game.campaignStageIndex] || stagesFor(game)[0];

  const readBonus = () => {
    try { return localStorage.getItem(Campaign.storage.bonusUnlocked) === '1'; } catch { return false; }
  };

  const saveBonus = () => {
    try {
      localStorage.setItem(Campaign.storage.bonusUnlocked, '1');
      localStorage.setItem(Campaign.storage.mainComplete, '1');
    } catch {}
  };

  function clearStageObjects(game) {
    game.enemies = [];
    game.friends = [];
    game.orbs = [];
    game.particles = [];
    game.messages = [];
    game.groundImpacts = [];
    game.encounterTimer = 2.4;
    game.orbTimer = 1.35;
    game.lastLane = 'ground';
    game.laneRepeats = 0;
    game.encounters = 0;
    game.orbPatterns = 0;
    game.track.reset();
    game.player.foot = GROUND;
    game.player.vy = 0;
    game.player.grounded = true;
    game.player.jumps = 2;
    game.player.motionDriver?.reset();
  }

  function applyStage(game, index, transitionReason = 'stage') {
    const stages = stagesFor(game);
    const next = stages[index];
    if (!next) return false;

    const previous = game.campaignStage;
    const chapterChanged = !previous || previous.chapterNumber !== next.chapterNumber;
    game.previousPhase = Number.isFinite(game.phaseIndex) ? game.phaseIndex : next.environment;
    game.campaignStageIndex = index;
    game.campaignStage = next;
    game.phaseIndex = next.environment;
    game.phaseTime = 0;
    game.phaseBanner = 2.6;
    game.phaseFade = previous && previous.environment === next.environment ? .22 : 1;
    game.campaignBossCycle = -1;
    game.campaignBossShotKeys = new Set();
    clearStageObjects(game);
    game.campaignStageStartScore = game.score;

    if (chapterChanged && previous) {
      game.player.lives = 3;
      game.player.charge = 0;
      game.player.reserve = 0;
      game.player.kiTime = 0;
    }

    game.campaignTransition = {
      id: (game.campaignTransition?.id || 0) + 1,
      reason: transitionReason,
      chapterChanged,
      stage: next,
    };
    game.state = 'campaign-transition';
    return true;
  }

  function advanceStage(game) {
    const stages = stagesFor(game);
    const nextIndex = game.campaignStageIndex + 1;
    if (nextIndex >= stages.length) {
      game.finish(true);
      return;
    }
    applyStage(game, nextIndex, 'stage-complete');
    game.audio.play('phase', .3);
  }

  Object.defineProperty(Game.prototype, 'phase', {
    configurable: true,
    get() {
      return this.campaignStage || currentStage(this);
    },
  });

  Game.prototype.reset = function campaignReset() {
    const requestedMode = this.campaignMode === 'bonus' ? 'bonus' : 'main';
    originalReset.call(this);
    this.campaignMode = requestedMode;
    this.campaignStageIndex = 0;
    this.campaignStage = stagesFor(this)[0];
    this.phaseIndex = this.campaignStage.environment;
    this.previousPhase = this.phaseIndex;
    this.phaseTime = 0;
    this.campaignTransition = null;
    this.campaignCompletion = null;
    this.bonusUnlocked = readBonus();
    this.campaignBossCycle = -1;
    this.campaignBossShotKeys = new Set();
  };

  Game.prototype.start = function campaignStart() {
    const priorState = this.state;
    const retryStageIndex = priorState === 'game-over' ? (this.campaignStageIndex || 0) : 0;
    const retryMode = this.campaignMode === 'bonus' ? 'bonus' : 'main';
    const retryScore = priorState === 'game-over' ? (this.campaignStageStartScore || 0) : 0;
    if (priorState === 'victory' && this.campaignNextMode) {
      this.campaignMode = this.campaignNextMode;
      this.campaignNextMode = null;
    } else if (!this.campaignMode) {
      this.campaignMode = 'main';
    }

    originalStart.call(this);
    this.bonusUnlocked = readBonus();
    if (priorState === 'game-over') { this.campaignMode = retryMode; this.score = retryScore; }
    const targetStage = priorState === 'game-over' ? retryStageIndex : 0;
    applyStage(this, targetStage, priorState === 'game-over' ? 'retry-stage' : (this.campaignMode === 'bonus' ? 'bonus-start' : 'campaign-start'));
  };

  Game.prototype.setPhase = function campaignSetPhase() {
    advanceStage(this);
  };

  Game.prototype.spawnEncounter = function campaignSpawnEncounter() {
    const stage = this.phase;
    const x = 1280 + 100;
    if (stage?.rockChance && Math.random() < stage.rockChance && this.track.clearRunway(x, 360)) {
      const conflict = this.enemies.some(e => e.active && e.type !== 'blast' && e.x > x - 560) ||
        this.friends.some(f => f.active && f.x > x - 560);
      if (!conflict) {
        this.enemies.push(new Enemy('boulder', x, GROUND));
        this.encounterTimer = Math.max(1.35, stage.interval * .78);
        this.encounters++;
        this.lastLane = 'ground';
        return;
      }
    }
    originalSpawnEncounter.call(this);
  };

  Game.prototype.update = function campaignUpdate(dt) {
    if (this.state !== 'playing') return;
    const beforeIndex = this.campaignStageIndex;
    originalUpdate.call(this, dt);
    if (beforeIndex !== this.campaignStageIndex || this.state !== 'playing') return;
    this.bonusUnlocked = this.bonusUnlocked || readBonus();
  };

  Game.prototype.finish = function campaignFinish(won) {
    if (won) {
      if (this.campaignMode === 'main') {
        saveBonus();
        this.bonusUnlocked = true;
        this.campaignCompletion = 'main';
        this.campaignNextMode = 'bonus';
      } else {
        this.campaignCompletion = 'bonus';
        this.campaignNextMode = 'main';
      }
    } else {
      this.campaignCompletion = null;
      this.campaignNextMode = null;
    }
    originalFinish.call(this, won);
  };

  C.CAMPAIGN = Campaign;
  C.__campaignPatched = true;
})();
