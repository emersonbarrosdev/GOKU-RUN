# Validação — Phaser + Capacitor, 0.1.0

## Resultados executados

- `npm test`: 27/27 testes de regras, física, geometria, sprites, KI, encontros e transições aprovados.
- Cinco partidas determinísticas completas de 150 segundos, seeds 7, 31, 101, 509 e 2026: vitória em todas, com colisões normais e sem invencibilidade. Autoplayer é teste de possibilidade de percurso, não avaliação de dificuldade por crianças.
- `npm run test:browser`: partida real de aproximadamente 150 segundos em Chrome headless/WebGL, cinco fases, áudio avançando, efeitos carregados, reinício, pausa, salto e KI. Nenhum erro JavaScript ou quadro com página oculta.
- Medição dessa partida no PC: 8.977 intervalos de quadro; mediana 16,7 ms, p95 17,1 ms, máximo 18,1 ms. Nenhum intervalo acima de 25 ms. Em 68 repetições de terreno, máximo 17,9 ms. Renderização JavaScript p95 0,7 ms. Esses números não medem GPU completa nem garantem desempenho em aparelhos Android.
- `npm run test:mobile`: Chrome com viewport 844 × 390, DPR 2, toque e rotação simulados. Repetido no build de produção servido por Vite preview: pulo, pulo duplo, KI sem pulo acidental, pausa, retomada, funcionamento após desconectar a rede, aviso em retrato e realinhamento do canvas após rotação aprovados.
- Teste móvel também confirma pelo menos sete quadros diferentes de corrida em um segundo; pausa congela animação Phaser e modelo; tela final congela tempo, pontos, chão, sprite e posição do mundo; reinício restaura três vidas. Nenhuma requisição externa de runtime; URLs blob locais são permitidas.
- Inspeção de capturas: menu, gameplay em paisagem e tela final. Corrigidos durante QA o canvas reduzido após rotação e a sobreposição de instruções sobre texto da imagem de menu.
- `npm run android:apk`: build web, sincronização Capacitor e Gradle `assembleDebug` aprovados. Aviso `flatDir` vem da configuração gerada pelo Capacitor; não impediu a compilação.
- `apksigner verify --verbose`: assinatura v2 válida. Android mínimo API 24; alvo/compilação API 36. Orientação `sensorLandscape`.
- Os 29 arquivos web de produção foram comparados por SHA-256 com suas entradas no APK: todos idênticos. Configuração Capacitor não aponta para servidor remoto.
- `git diff --check`: sem erros de whitespace; apenas aviso de normalização LF/CRLF no Windows.

## Pacote entregue

[goku-run-debug.apk](../releases/goku-run-debug.apk), aproximadamente 37,4 MB, versão 0.1.0, pacote `com.cincomundos.gokurun`.

SHA-256: `631A9468A194957F35786162F41E7A42E054C80C7B58637FFCE0948D3F478F18`.

## Limites e próximo teste

Não havia dispositivo conectado ao ADB nem emulador configurado. Portanto **não foi executado no Android real ou em emulador Android**. Build e assinatura aprovados não equivalem a instalação ou validação de desempenho no aparelho.

No celular, conferir: instalação e primeiro carregamento sem rede; áudio após tocar Iniciar; cinco fases; dois toques para pulo duplo; KI sem saltar; sair/voltar ao app; botão Voltar; morrer/reiniciar; sessão prolongada para aquecimento e estabilidade. A desconexão no navegador valida a partida já carregada; o teste de abertura a frio offline ainda depende do Android.

As folhas têm poses completas e o motor avança os quadros, mas a qualidade artística da passada não é certificada por testes automáticos. Também não foram feitos testes com crianças, certificação de loja, revisão de direitos ou auditoria de acessibilidade. Documentos V4/V5 são históricos, não evidência desta versão.
