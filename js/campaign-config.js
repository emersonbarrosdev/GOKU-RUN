(() => {
  'use strict';

  const STAGE_SECONDS = 30;
  const makeStage = (chapter, stage, data) => Object.freeze({
    chapter,
    stage,
    duration: STAGE_SECONDS,
    ...data,
  });

  const chapters = [
    {
      id: 'saiyans', number: 1, title: 'SAGA DOS SAIYAJINS', groundTint: 0xd0aa72,
      stages: [
        makeStage(1, 1, { id:'raditz', boss:'RADITZ', name:'GOKU E PICCOLO VS. RADITZ', location:'MONTANHAS', environment:2, speed:330, gap:.10, interval:3.8, air:.12, rockChance:.18, bossAttacks:['charge','rocks','charge'], description:'Raditz invade a trilha em rasantes baixos. Pule o corpo dele e as pedras soltas.' }),
        makeStage(1, 2, { id:'nappa', boss:'NAPPA', name:'GOKU VS. NAPPA', location:'DESERTO', environment:2, speed:350, gap:.14, interval:3.45, air:.18, rockChance:.27, bossAttacks:['charge','blast','rocks'], description:'Nappa alterna investidas pesadas com rajadas de ki e mais rochas no caminho.' }),
        makeStage(1, 3, { id:'vegeta', boss:'VEGETA', name:'GOKU VS. VEGETA', location:'DESERTO / ÁREA ROCHOSA', environment:2, speed:372, gap:.18, interval:3.15, air:.30, rockChance:.22, bossAttacks:['fly-dive','blast','charge','barrage'], description:'Vegeta alterna voo, mergulho, corrida frontal e disparos de energia.' }),
      ],
    },
    {
      id: 'freeza', number: 2, title: 'SAGA DE FREEZA', groundTint: 0xa8c879,
      stages: [
        makeStage(2, 1, { id:'recoome', boss:'RECOOME', name:'GOKU VS. RECOOME', location:'PLANETA NAMEKUSEI', environment:0, speed:382, gap:.19, interval:3.0, air:.28, rockChance:.18, bossAttacks:['charge','blast','charge'], description:'Recoome força saltos longos e mistura golpes físicos com energia.' }),
        makeStage(2, 2, { id:'burter-jeice', boss:'BURTER E JEICE', name:'GOKU VS. BURTER E JEICE', location:'PLANETA NAMEKUSEI', environment:0, speed:396, gap:.21, interval:2.85, air:.38, rockChance:.16, bossAttacks:['dual','barrage','dual'], description:'A dupla ataca em alturas diferentes: um fecha o chão enquanto o outro dispara.' }),
        makeStage(2, 3, { id:'ginyu', boss:'CAPITÃO GINYU', name:'GOKU VS. CAPITÃO GINYU', location:'PLANETA NAMEKUSEI', environment:0, speed:410, gap:.23, interval:2.72, air:.42, rockChance:.16, bossAttacks:['fly-dive','blast','charge','barrage'], description:'Ginyu mistura investidas aéreas, rajadas e mudanças bruscas de ritmo.' }),
        makeStage(2, 4, { id:'freeza', boss:'FREEZA', name:'GOKU VS. FREEZA', location:'PLANETA NAMEKUSEI', environment:0, speed:426, gap:.25, interval:2.58, air:.48, rockChance:.18, bossAttacks:['barrage','fly-dive','blast','charge'], description:'Freeza mantém pressão constante com voo, rajadas múltiplas e ataques rasantes.' }),
      ],
    },
    {
      id: 'android-cell', number: 3, title: 'SAGA DOS ANDROIDES E CELL', groundTint: 0x9aa0a6,
      stages: [
        makeStage(3, 1, { id:'android-19', boss:'ANDROIDE 19', name:'GOKU VS. ANDROIDE 19', location:'ILHA AMENBO', environment:1, speed:438, gap:.26, interval:2.5, air:.42, rockChance:.15, bossAttacks:['charge','blast','charge','blast'], description:'O Androide 19 pressiona o chão e dispara energia em intervalos curtos.' }),
        makeStage(3, 2, { id:'cell', boss:'CELL', name:'GOKU VS. CELL', location:'ARENA DOS JOGOS DE CELL', environment:3, speed:452, gap:.28, interval:2.38, air:.50, rockChance:.17, bossAttacks:['fly-dive','barrage','charge','blast'], description:'Cell usa toda a arena: voo, mergulhos, rajadas e investidas em sequência.' }),
      ],
    },
    {
      id: 'majin-buu', number: 4, title: 'SAGA DE MAJIN BOO', groundTint: 0xb98982,
      stages: [
        makeStage(4, 1, { id:'yakon', boss:'YAKON', name:'GOKU VS. YAKON', location:'NAVE DO MAGO BABIDI', environment:1, speed:462, gap:.29, interval:2.32, air:.52, rockChance:.16, bossAttacks:['charge','fly-dive','charge'], description:'Yakon surge da escuridão em saltos e rasantes rápidos.' }),
        makeStage(4, 2, { id:'majin-vegeta', boss:'MAJIN VEGETA', name:'GOKU VS. MAJIN VEGETA', location:'ÁREA DESÉRTICA', environment:2, speed:474, gap:.30, interval:2.24, air:.54, rockChance:.20, bossAttacks:['blast','charge','barrage','fly-dive'], description:'Majin Vegeta combina velocidade alta, rajadas e investidas sem aviso longo.' }),
        makeStage(4, 3, { id:'fat-buu', boss:'MAJIN BOO GORDO', name:'GOKU SSJ3 VS. MAJIN BOO GORDO', location:'CIDADE DO OESTE', environment:3, speed:484, gap:.31, interval:2.18, air:.50, rockChance:.22, bossAttacks:['charge','rocks','blast','charge'], description:'Boo usa o corpo como obstáculo e transforma a pista em uma sequência de impactos.' }),
        makeStage(4, 4, { id:'super-buu', boss:'SUPER BOO', name:'SUPER VEGETTO VS. SUPER BOO', location:'PLANETA TERRA', environment:3, speed:494, gap:.32, interval:2.10, air:.58, rockChance:.19, bossAttacks:['barrage','fly-dive','charge','blast'], description:'Super Boo alterna altitude e rajadas; sobreviva à pressão da fusão.' }),
        makeStage(4, 5, { id:'buu-illusions', boss:'ILUSÕES DE GOHAN, GOTENKS E PICCOLO', name:'GOKU E VEGETA VS. ILUSÕES', location:'DENTRO DO CORPO DE BOO', environment:1, speed:504, gap:.33, interval:2.02, air:.60, rockChance:.18, bossAttacks:['illusion','dual','barrage','illusion'], description:'As ilusões trocam de forma e combinam ataques terrestres e aéreos.' }),
        makeStage(4, 6, { id:'kid-buu', boss:'KID BOO', name:'GOKU VS. KID BOO', location:'PLANETA SAGRADO DOS KAIOHS', environment:4, speed:516, gap:.34, interval:1.94, air:.64, rockChance:.21, bossAttacks:['barrage','fly-dive','charge','barrage'], description:'A batalha final exige leitura rápida de voo, disparos e investidas.' }),
      ],
    },
  ];

  const bonusChapter = {
    id:'other-world', number:5, title:'TORNEIO DO OUTRO MUNDO', groundTint:0x91c6ad, bonus:true,
    stages:[
      makeStage(5, 1, { id:'caterpy', boss:'CATERPY', name:'GOKU VS. CATERPY', location:'QUARTAS DE FINAL', environment:1, speed:486, gap:.30, interval:2.18, air:.48, rockChance:.12, bossAttacks:['charge','rocks','charge'], description:'Caterpy usa o corpo comprido para fechar o chão e forçar saltos precisos.' }),
      makeStage(5, 2, { id:'maraikoh', boss:'MARAIKOH', name:'GOKU VS. MARAIKOH', location:'SEMIFINAL', environment:2, speed:502, gap:.32, interval:2.02, air:.56, rockChance:.16, bossAttacks:['fly-dive','charge','blast'], description:'Maraikoh alterna saltos pesados com investidas aéreas.' }),
      makeStage(5, 3, { id:'paikuhan', boss:'PAIKUHAN', name:'GOKU VS. PAIKUHAN', location:'GRANDE FINAL', environment:3, speed:520, gap:.34, interval:1.90, air:.66, rockChance:.17, bossAttacks:['barrage','fly-dive','blast','charge'], description:'Paikuhan é o desafio bônus final, com a maior velocidade e mistura de padrões.' }),
    ],
  };

  const flatten = list => list.flatMap(chapter => chapter.stages.map(stage => Object.freeze({
    ...stage,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    chapterNumber: chapter.number,
    stageCountInChapter: chapter.stages.length,
    groundTint: chapter.groundTint,
    bonus: Boolean(chapter.bonus),
    tint: null,
  })));

  const campaign = Object.freeze({
    stageSeconds: STAGE_SECONDS,
    chapters: Object.freeze(chapters),
    bonusChapter: Object.freeze(bonusChapter),
    mainStages: Object.freeze(flatten(chapters)),
    bonusStages: Object.freeze(flatten([bonusChapter])),
    storage: Object.freeze({ bonusUnlocked:'goku-run-bonus-unlocked-v1', mainComplete:'goku-run-main-complete-v1' }),
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = campaign;
  if (typeof window !== 'undefined') window.GokuCampaign = campaign;
})();
