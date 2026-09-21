# Mergulho — plano de design

Assunto: um mergulho da beira da praia até 4.000 m. Cada mundo é uma faixa de profundidade.
Público: jogador casual brasileiro, no celular. Trabalho principal: fazer "descer" parecer progresso.

## Paleta (a coluna d'água)
- espuma   #F3FBFF  texto sobre água
- raso     #5FD4C8  turquesa do raso
- azul     #0B4F7A  mar aberto
- indigo   #151A4A  zona crepuscular
- breu     #03050F  abismo (não é preto: é azul quase sem luz)
- biolum   #6BFFE0  brilho próprio, só onde a luz do sol acabou
- boia     #FF6A3D  botão principal (laranja de boia de sinalização)
- sol      #FFD35C  estrelas de recompensa

## Tipo
- Sniglet 800: título, números, nomes de fase. Redonda como bolha.
- Nunito 600–900: todo o resto.

## Layout
- Início: o título "Mergulho" fica EM CIMA da linha d'água. Metade de cima seca, metade de baixo
  submersa e ondulando. É o único momento ousado de tipografia.
- Mapa: uma coluna d'água contínua que DESCE (ao contrário dos mapas que sobem). Trilha de bolhas.
  Cada mundo abre com o nome e a faixa de metros. Cada fase mostra sua profundidade.
- Jogo: HUD em vidro escuro (lê em qualquer profundidade), tabuleiro com material do mundo.

## Princípios
1. A luz é a progressão. Ela some mundo a mundo; quando o sol acaba, as peças passam a brilhar sozinhas.
2. Cada peça mantém cor e contorno em todos os mundos. Muda a espécie, não a regra.
3. Movimento lento de água no ambiente; movimento forte só como resposta ao jogador.
4. Nada de comemoração: sem confete, sem bandeirinha, sem bolo.

## Revisão contra o genérico
- Evitado: "Fase 8 · Nome" com ponto do meio (virou nome + profundidade em linhas separadas).
- Evitado: rótulos em caixa alta. Evitado: preto + um acento só (o abismo tem as seis cores brilhando).

## Mundos
0 Raso (0–12 m)        areia       peças ao sol
1 Recife (15–35 m)     algas       peças com padrão de recife
2 Naufrágio (45–130 m) redes       tons frios, casco ao fundo
3 Crepúsculo (200–1.000 m) lodo    peças translúcidas, primeiros pontos de luz
4 Abismo (1.500–4.000 m)   breu    peças escuras com contorno de luz própria
