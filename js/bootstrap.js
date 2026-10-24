// Ordem explícita: núcleo -> configuração visual v9 -> Phaser.
import './game.js';
import './goku-visual-config.js';
import './main.js';

// QA e autostart precisam enxergar apenas o runtime do jogo. A narrativa
// (e seu CSS/overlays) só é carregada para a experiência normal do jogador.
const params = new URLSearchParams(location.search);
const qaMode = params.get('debug') === '1' || params.get('autostart') === '1';
if (!qaMode) import('./story-runtime.js');
