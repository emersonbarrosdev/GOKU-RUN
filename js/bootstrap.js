// Ordem explícita: núcleo -> configuração visual v9 -> narrativa -> Phaser.
//
// A narrativa precisa registrar o bloqueio do botão/teclado ANTES de main.js
// criar a cena. Assim o jogador nunca consegue entrar na corrida antes da
// introdução terminar de carregar.
import './game.js';
import './goku-visual-config.js';

const params = new URLSearchParams(location.search);
const qaMode = params.get('debug') === '1' || params.get('autostart') === '1';

async function boot() {
  // Os modos automatizados continuam sem narrativa para preservar os testes
  // determinísticos do runtime principal.
  if (!qaMode) await import('./story-runtime.js');
  await import('./main.js');
}

boot().catch(error => {
  console.error(error);
  const subtitle = document.getElementById('panel-subtitle');
  if (subtitle) subtitle.textContent = 'Falha ao iniciar o jogo. Recarregue a página.';
});
