# Corrida e chão — revisão v20

> HISTÓRICO NÃO APROVADO. O usuário rejeitou o player procedural v12 e delimitou a próxima etapa à Task 1. Os resultados abaixo não aprovam a arte nem autorizam publicar o chão. Estado atual: [Task 1](TASK1-PLAYER-STATUS.md).

## Falha anterior

O atlas v11 continha desenhos independentes com alternância e espaçamento inconsistentes. O teste de diferença entre pixels podia passar mesmo quando uma perna não completava seu ciclo. A antiga alegação de comprovação biomecânica não era sustentada por esse teste.

O chão anterior ainda usava a ilustração alta comprimida/espelhada, com faixas de 40 px sobrepostas e paredes cinzas desenhadas por código. A troca não era um tileset novo completo.

## Entrega visual

- [Comparação em vídeo](qa/run-ground-before-after.mp4): mesma velocidade de cenário, reprodução normal e câmera lenta.
- [Captura real do jogo](qa/gameplay-ground-v20.png): personagem e novas bordas dos buracos.
- Comparador interativo: com `npm run dev`, abrir `/tools/review-animation.html`. Inclui pausa, avanço de quadro e marcação dos pés.
- [Folha única do Goku](../assets/spritesheets/goku_run_v12.png): 24 quadros de corrida + 4 de salto, arte autoral estilizada, mesmo modelo e proporções.
- [Atlas único do chão](../assets/spritesheets/terrain_tiles_v5.png): esquerda / centro / direita. Não usa a ilustração anterior.

## Construção da corrida

O modelo articulado é somente uma ferramenta de autoria. O jogo continua desenhando sprites completos de uma folha PNG; não monta braços/pernas separados em tempo de execução. As duas pernas têm a mesma trajetória, deslocada em meio ciclo, mantendo a identidade próximo/distante. Joelhos resolvem alvos dos pés com comprimentos constantes, braços fazem oposição e corpo/faixa têm movimento secundário.

O apoio ocupa 28% do ciclo de cada perna; há duas fases aéreas. Durante o apoio o pé recua exatamente à velocidade do cenário. O ciclo é calibrado para 180 px de deslocamento, em vez dos antigos 255 px arbitrários. Os 24 quadros são exibidos a 44,67–57,33 poses/s nas cinco velocidades; isso não muda a física de 60 Hz. Não há crossfade, descarte do resto do timer, reescala por pose ou segundo relógio Phaser no gameplay.

Oito quadros podem funcionar em jogos com poses bem desenhadas. Não existe uma regra universal de 10–14 FPS: a duração do ciclo e o número de poses precisam ser considerados juntos. Os intermediários aqui foram derivados do mesmo modelo para preservar continuidade, não gerados isoladamente.

Referências consultadas: [SLYNYRD — Intro to Animation](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation), que analisa a energia do ciclo de Mega Man e a relação entre contatos, passagens e intermediários; [Phaser — Animations](https://docs.phaser.io/phaser/concepts/animations), para seleção de frames e temporização. Nenhuma arte desses jogos foi copiada.

## Testes e resultados

| Verificação | Resultado |
| --- | --- |
| Testes Node, incluindo novas invariantes de marcha | 34/34 |
| Partidas simuladas completas | 5/5 vitórias |
| Identidade das pernas | Ambas percorrem frente e trás; diferença de meio ciclo |
| Comprimento de coxa, canela, braço e antebraço | Constante em 1.000 amostras |
| Continuidade de joelhos/pés, inclusive fechamento do loop | Sem salto superior a 14 px entre quadros na escala do jogo |
| Apoio no modelo contínuo | Deslizamento abaixo de 1e-8 px |
| Apoio nas botas do atlas GPU efetivamente renderizado | Variação 0,062 px / 0,492 px nas amostras de apoio |
| Registro horizontal da cabeça | Variação 0,345 px |
| Centro + cantos do chão | Encaixe contínuo nas cinco paletas; silhueta externa transparente |
| Movimento através da repetição de 256 px | Diferença média/máxima 0 nas capturas GPU compensadas em 1 px |
| Texturas durante movimento estável | 0 uploads/s |
| Mobile | Toque, salto duplo, KI, orientação, pausa, offline e animação aprovados |
| História | Preview usa o atlas novo; navegação e persistência aprovadas |
| Build | Aprovado |
| Navegador real, partida de 150,08 s | Vitória, cinco fases, três vidas |
| Tempo de frame | p95 16,9 ms; p99 17,4 ms; um frame acima de 25 ms; nenhum acima de 50 ms |
| Repetições do terreno na partida | 223, máximo 17,8 ms; nenhuma acima de 25 ms |

Os testes geométricos e de pixels cobrem propriedades específicas; não substituem julgamento artístico. Por isso a entrega inclui o comparador animado, o vídeo e a captura real, além das asserções. A medida das botas é entre os quadros amostrados; ainda existe a discretização normal de qualquer animação por sprites.

## Ferramentas

Nenhuma instalação adicional foi necessária. Node e Chrome produzem os atlas completos; Playwright executa as verificações; FFmpeg codifica o vídeo de comparação. Fontes de autoria, testes e ferramentas de captura estão versionados para reprodução.
