# Bíblia de Testes — Goku Run

Esta é a regra de qualidade do projeto. Nenhuma alteração de gameplay, sprites, terreno, UI, narrativa ou runtime deve entrar na `main` sem passar por todos os gates aplicáveis abaixo.

## Regra de merge
1. Desenvolver em branch.
2. Rodar testes de lógica.
3. Gerar build de produção.
4. Subir preview do build.
5. Rodar teste de história.
6. Rodar contrato visual de sprites/animação.
7. Rodar audit visual do terreno.
8. Rodar smoke mobile.
9. Somente com todos verdes: merge para `main`.

Se qualquer etapa falhar, NÃO fazer merge.

## Gate A — Lógica e física
Comando: `npm test`

Deve validar:
- KI e reserva.
- colisões.
- inimigos terrestres e voadores.
- buracos.
- salto e pulo duplo.
- aterrissagem.
- pause/restart.
- progressão das cinco fases.
- runtime a 60 Hz.
- cinco playthroughs completos e determinísticos.

## Gate B — Build de produção
Comando: `npm run build`

Deve garantir:
- zero erro do Vite.
- todos os assets referenciados existem.
- nenhum import quebrado.
- bundle final gerado.

## Gate C — História e navegação
Comando: `npm run test:story`

Deve garantir:
- primeiro acesso mostra a história.
- capítulos 1, 2 e 3 funcionam.
- Espaço/W/Seta não iniciam jogo por trás da história.
- existe `PULAR HISTÓRIA`.
- pular leva ao menu.
- concluir leva ao menu.
- história vista não é obrigatória nos próximos boots.
- `JOGAR` abre a gameplay e HUD.

## Gate D — Contrato visual de sprites e animação
Comando: `npm run test:render`

Deve garantir no navegador real:
- Goku não está transparente/invisível.
- atlas do Goku contém pixels realmente opacos.
- soldado não está transparente/invisível.
- inimigo voador não está transparente/invisível.
- corrida usa os oito frames corretos.
- corrida visual é sincronizada com `Player.runTime`.
- salto usa frames 8, 9 e 10.
- pouso usa frame 11.
- soldado usa `runPhase` da simulação, não um relógio visual paralelo.
- terreno usa offset pixel-alinhado.

Um arquivo PNG existir NÃO é suficiente. O teste precisa validar pixels renderizados.

## Gate E — Continuidade do terreno / flicker
Comando: `npm run test:visual`

Deve garantir:
- nenhuma recriação/upload de textura a cada frame.
- terreno se desloca continuamente.
- wrap não produz faixa vazia/preta.
- comparação pixel a pixel ao atravessar limites do tile.
- testar mais de um wrap.
- qualquer alteração em terreno/background exige revisar capturas do audit.

## Gate F — Mobile smoke
Comando: `npm run test:mobile`

Deve garantir:
- toque para pular.
- pulo duplo.
- KI.
- pause/resume.
- landscape.
- portrait/aviso de rotação.
- execução sem erro JavaScript.
- funcionamento offline conforme suporte atual.

## Gate G — Inspeção visual humana
Antes do merge de mudança visual, conferir manualmente pelo menos:
- menu.
- história.
- primeiro segundo da corrida.
- Goku correndo.
- Goku pulando.
- soldado aparecendo.
- inimigo voador aparecendo.
- orbs.
- terreno atravessando pelo menos dois ciclos de textura.
- troca de fase.
- tela de pause.
- game over.
- final da história.

Checklist visual obrigatório:
- [ ] Goku está visível.
- [ ] Goku não invade frame vizinho.
- [ ] Corrida não treme nem troca escala.
- [ ] Pulo não muda o tamanho anatômico do personagem.
- [ ] Inimigos estão visíveis.
- [ ] Projéteis correspondem aos inimigos que os geraram.
- [ ] Terreno não pisca no wrap.
- [ ] Fundo não dá corte preto.
- [ ] HUD não cobre elementos críticos.
- [ ] História pode ser pulada.

## Política para a main
A `main` representa sempre a versão validada. A partir desta Bíblia, correções devem ser feitas em branch e mescladas somente após CI verde. Push direto na `main` deve ser evitado para alterações de código/gameplay/visual.
