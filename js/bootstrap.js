import './game.js';
import './goku-visual-config.js';
import './campaign-config.js';

let activeRuntime;

export async function bootGame(uiBridge) {
  if (activeRuntime) return activeRuntime;
  const params = new URLSearchParams(location.search);
  const qaMode = params.get('debug') === '1' || params.get('autostart') === '1';

  // O modo de QA mantém a simulação histórica de cinco fases para preservar os
  // testes determinísticos existentes. A campanha completa é o fluxo normal.
  const storyModule = qaMode ? null : await import('./story-runtime.js');
  if (!qaMode) await import('./campaign-patch.js');
  const { createRunnerGame } = await import('./main.js');
  const runner = createRunnerGame(uiBridge);
  const campaignModule = qaMode ? null : await import('./campaign-runtime.js');

  let stopStory = () => {};
  let stopCampaign = () => {};
  let destroyed = false;

  // Phaser 4.2.1 não expõe mais Phaser.GAMES. O runtime visual legado ainda
  // usa essa ponte apenas durante a descoberta inicial da Scene, então
  // fornecemos a instância recém-criada e aguardamos a instalação completa
  // antes de liberar o menu para impedir corrida entre JOGAR e o loading.
  if (campaignModule) {
    const { default: Phaser } = await import('phaser');
    const previousGames = Phaser.GAMES;
    Phaser.GAMES = [runner.game];
    try {
      stopCampaign = await campaignModule.bootCampaignRuntime();
    } finally {
      if (previousGames === undefined) delete Phaser.GAMES;
      else Phaser.GAMES = previousGames;
    }
  }

  activeRuntime = {
    start: () => runner.start(),
    pause: () => runner.pause(),
    activateKi: () => runner.activateKi(),
    toggleSound: () => runner.toggleSound(),
    destroy() {
      destroyed = true;
      stopStory();
      stopCampaign();
      runner.destroy();
      activeRuntime = undefined;
    },
  };

  storyModule?.bootStoryRuntime()
    .then(cleanup => { if (destroyed) cleanup(); else stopStory = cleanup; })
    .catch(error => console.error(error));

  return activeRuntime;
}
