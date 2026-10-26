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
  campaignModule?.bootCampaignRuntime()
    .then(cleanup => { if (destroyed) cleanup(); else stopCampaign = cleanup; })
    .catch(error => console.error(error));

  return activeRuntime;
}
