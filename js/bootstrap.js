import './game.js';
import './goku-visual-config.js';

let activeRuntime;

export async function bootGame(uiBridge) {
  if (activeRuntime) return activeRuntime;
  const params = new URLSearchParams(location.search);
  const qaMode = params.get('debug') === '1' || params.get('autostart') === '1';
  // Importar a narrativa primeiro registra o bloqueio do menu antes da cena.
  const storyModule = qaMode ? null : await import('./story-runtime.js');
  const { createRunnerGame } = await import('./main.js');
  const runner = createRunnerGame(uiBridge);
  let stopStory = () => {}, destroyed = false;

  activeRuntime = {
    start:()=>runner.start(),pause:()=>runner.pause(),activateKi:()=>runner.activateKi(),toggleSound:()=>runner.toggleSound(),
    destroy() {
      destroyed = true;
      stopStory();
      runner.destroy();
      activeRuntime = undefined;
    },
  };
  // A interface Angular recebe o runtime imediatamente. A narrativa aguarda o
  // menu e a cena em paralelo, com o bloqueio de início já registrado.
  storyModule?.bootStoryRuntime()
    .then(cleanup=>{if(destroyed)cleanup();else stopStory=cleanup;})
    .catch(error=>console.error(error));
  return activeRuntime;
}
