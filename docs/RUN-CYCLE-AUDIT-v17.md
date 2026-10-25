# Auditoria de corrida v17

Problema observado: o ciclo anterior repetia visualmente a mesma meia-passada e, combinado com cadência baixa no início do jogo, dava sensação de dança/patinação em vez de corrida.

Correção alvo:
- 8 poses distintas em sequência contínua;
- ordem: contact L -> down L -> passing -> up -> contact R -> down R -> passing -> up;
- braços em oposição às pernas;
- torso estabilizado no eixo X;
- pés alinhados a uma baseline comum;
- cadência dinâmica de ~10,5 a 13,5 FPS entre fase 1 e fase 5;
- ciclo calculado pela distância percorrida (255 px), mantendo pernas e terreno sincronizados independentemente do FPS de renderização;
- pulo permanece separado;
- CI deve reprovar regressões de ordem, jitter ou cadência.
