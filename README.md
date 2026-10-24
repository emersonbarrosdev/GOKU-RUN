# Goku Run — Cinco Mundos

Runner para PC e Android, com Phaser 3, Vite e Capacitor 8.

## Jogar no PC

Abra [ABRIR_JOGO.bat](ABRIR_JOGO.bat), ou execute `npm install` e `npm run dev`, depois acesse http://localhost:5173. Requer Node.js 22 ou superior. Não abra o HTML diretamente: a versão atual usa módulos e precisa do servidor.

## Android

Transfira [releases/goku-run-debug.apk](releases/goku-run-debug.apk) para o celular e abra para instalar. Se solicitado, autorize temporariamente a instalação pelo aplicativo usado para abrir o arquivo.

Android mínimo: 7.0 (API 24). Imagens, sons e bibliotecas ficam dentro do APK, sem CDN ou servidor de desenvolvimento. Orientação deitada, com pausa ao sair do aplicativo. É uma versão de teste assinada em modo debug, não uma publicação na loja.

Para gerar novamente: [GERAR_APK.bat](GERAR_APK.bat) ou `npm run android:apk`. Requer JDK 21 e Android SDK com plataforma 36 e licenças aceitas. O script procura o SDK em `%LOCALAPPDATA%/Android/Sdk` ou `ANDROID_HOME`. A primeira compilação precisa de internet para dependências.

Nenhum aparelho estava conectado durante a validação. Desempenho, som e retomada ainda precisam ser conferidos no celular real.

## Controles e regras

- Celular: toque na área do jogo para pular; outro toque no ar dá pulo duplo. Botões separados para KI e pausa, sem disparar pulo junto.
- PC: Espaço, seta para cima ou W para pular; K ativa KI; P pausa; M alterna som. Clique na área do jogo também pula.
- Oito esferas completam o KI. Dura seis segundos e triplica pontos. Energia coletada durante o efeito fica na reserva; contato com inimigo durante KI o destrói e dá 180 pontos.
- Aliados tiram uma vida por contato mesmo com KI: pule sobre eles.
- Voadores e disparos aéreos permitem passar por baixo. Esferas têm alturas variadas; soldados preparam os disparos antes de chegar perto.
- Cinco etapas de 30 segundos: Namek, floresta, cânion, cidade e vulcão, com panoramas próprios e dificuldade crescente.

## Implementação

[js/main.js](js/main.js) usa Phaser para exibição, animações, áudio e entrada, além da integração Android. [js/game.js](js/game.js) preserva o modelo determinístico com física a 120 Hz; seu renderizador Canvas anterior não é iniciado. Não foi substituída a física por Arcade Physics.

Goku usa uma nova folha de quadros completos: oito de corrida e quatro de salto, com mesma escala e pivôs explícitos. Não há membros separados. O chão foi preservado, com deslocamento contínuo e máscara de buracos. Impactos usam partículas e som, sem congelar o mundo.

Detalhes: [spritesheets](docs/SPRITESHEETS.md) e [validação Android](docs/VALIDATION-ANDROID.md). A qualidade artística da corrida ainda precisa de avaliação em movimento; trocar o motor não transforma automaticamente uma folha gerada em animação desenhada à mão.

## Testes

Execute `npm test` e `npm run build`. Com servidor aberto e `CHROME_PATH` apontando para Chrome, use `npm run test:browser` e `npm run test:mobile`. Usam perfil isolado. `TEST_URL` seleciona outra URL, inclusive produção via `npm run preview`.

`?debug=1` expõe `window.__gokuRun` e não salva recordes da sessão de teste. `?autostart=1` pula o menu. Partidas comuns não precisam desses parâmetros.

Antes de publicar: revisar direitos dos personagens/músicas, identidade visual, assinatura de produção e requisitos para apps infantis.
