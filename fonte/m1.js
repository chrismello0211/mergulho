/* ═══════════════════════════════════════════════════════════════
   MERGULHO · combinar 3 da beira da praia até 4.000 metros
   ═══════════════════════════════════════════════════════════════ */

const VERSAO_JOGO = '2026.11.14';
const W = 7, H = 8, TIPOS = 6;
const NADA = 0, LH = 1, LV = 2, BOMBA = 3, ARCO = 4, ONDA = 5, ONDAV = 6, CARDUME = 7;

const $ = s => document.querySelector(s);
/* todo sorteio do jogo passa por aqui: no desafio da semana a gente
   troca a fonte por uma semente e o tabuleiro sai igual pra todo mundo */
let rnd = Math.random;
const sorteia = n => Math.floor(rnd() * n);
function semeiaJogo(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
  let t = h >>> 0;
  rnd = () => { t = (t * 1664525 + 1013904223) >>> 0; return t / 4294967296; };
}
function soltaSemente() { rnd = Math.random; }
const espera = ms => new Promise(r => setTimeout(r, ms));
const chave = (r, c) => r * W + c;
const linha = k => (k / W) | 0;
const coluna = k => k % W;
const dentro = (r, c) => r >= 0 && r < H && c >= 0 && c < W;
const metros = n => n.toLocaleString('pt-BR') + ' m';


/* ═══ O QUE COBRE O FUNDO ═══════════════════════════════════════
   tex: como a casa é pintada (grão, fibra, malha, placa, breu).  */
const BLOQUEIOS = {
  areia:      { verbo:'Varrer', um:'monte de areia', varios:'montes de areia', tex:'grao', a:'#F3E2B8', b:'#E0C792', a2:'#D2AE6E', b2:'#B48A4A',
                dica:'A areia cobre parte do fundo. Estoure peças em cima dela para varrer.' },
  areiapreta: { verbo:'Varrer', um:'monte de areia preta', varios:'montes de areia preta', tex:'grao', a:'#6E6A72', b:'#4A4750', a2:'#3A3740', b2:'#23212A',
                dica:'Areia vulcânica cobre o fundo. Estoure peças em cima para varrer.' },
  cinza:      { verbo:'Soprar', um:'monte de cinza', varios:'montes de cinza', tex:'grao', a:'#B9B2C6', b:'#8E88A0', a2:'#6B6580', b2:'#463F5C',
                dica:'A cinza do vulcão assentou no fundo. Estoure peças em cima para soprar.' },
  alga:       { verbo:'Limpar', um:'alga', varios:'algas', tex:'fibra', a:'#5DBE6E', b:'#3F9853', a2:'#2E7D44', b2:'#1C552C',
                dica:'Algas tomaram o fundo. As mais escuras precisam de duas passadas.' },
  limo:       { verbo:'Limpar', um:'limo', varios:'limos', tex:'fibra', a:'#8FB36A', b:'#6B8F45', a2:'#4C6B2E', b2:'#33491C',
                dica:'O limo gruda no fundo. Estoure peças em cima para soltar.' },
  raiz:       { verbo:'Cortar', um:'raiz', varios:'raízes', tex:'fibra', a:'#C08A52', b:'#96633A', a2:'#6E4526', b2:'#4A2D18',
                dica:'Raízes do mangue trançam o fundo. Estoure peças em cima para cortar.' },
  rede:       { verbo:'Cortar', um:'rede', varios:'redes', tex:'malha', a:'#ECBE78', b:'#B98C48', a2:'#FF965A', b2:'#C2622C',
                dica:'Tem rede presa aqui. Estoure peças em cima para cortar.' },
  craca:      { verbo:'Raspar', um:'craca', varios:'cracas', tex:'placa', a:'#E4E0D2', b:'#B6B0A0', a2:'#8C8676', b2:'#635E52',
                dica:'Cracas grudaram na pedra. Estoure peças em cima para raspar.' },
  gelo:       { verbo:'Quebrar', um:'placa de gelo', varios:'placas de gelo', tex:'placa', a:'#E8FAFF', b:'#AEDDF2', a2:'#8FC6E8', b2:'#5E9CC6',
                dica:'Placas de gelo fecham o fundo. Estoure peças em cima para quebrar.' },
  coralmorto: { verbo:'Quebrar', um:'coral morto', varios:'corais mortos', tex:'placa', a:'#F0DAD0', b:'#CBA898', a2:'#A67E6C', b2:'#7A574A',
                dica:'Coral morto endureceu no fundo. Estoure peças em cima para quebrar.' },
  lodo:       { verbo:'Limpar', um:'casa com lodo', varios:'casas com lodo', tex:'fibra', a:'#A9A2C0', b:'#7B7498', a2:'#5C5680', b2:'#3A3550',
                dica:'O lodo assentou no fundo. Estoure peças em cima para limpar.' },
  corrente:   { verbo:'Quebrar', um:'elo', varios:'elos', tex:'elo', a:'#D8DEE6', b:'#A8B2BE', a2:'#7E8A98', b2:'#57626E',
                dica:'Cada elo da corrente aguenta três estouros. Bata sempre no mesmo lugar.' },
  mancha:     { verbo:'Limpar', um:'mancha', varios:'manchas', tex:'mancha', a:'#FF8E7A', b:'#E0564A', a2:'#B63A36', b2:'#7E2320',
                dica:'A maré vermelha se espalha para as casas vizinhas. A próxima a nascer pisca antes.' },
  breu:       { verbo:'Acender', um:'casa apagada', varios:'casas apagadas', tex:'breu', a:'#000000', b:'#000000', a2:'#000000', b2:'#000000',
                dica:'Algumas casas estão apagadas. Estoure peças em cima para acender.' }
};

/* ═══ REGIÕES ═══════════════════════════════════════════════════
   A profundidade manda na luz e nas peças; a região manda na cor
   da água, no chão, nos nomes e no que cobre o fundo. Cada
   expedição acontece numa região diferente, então a fase 200 não
   parece a fase 20.                                              */
const REGIOES = [
  { nome:'Litoral', trato:'limpo', texto:'Água clara de beira de praia.',
    agua:['#9BE9E0','#3FC0C6','#1A6E98','#123067','#0A0F28','#03050F'], moldura:'#EEDCAE', acento:'#6BFFE0',
    bandas:['Raso','Recife','Naufrágio','Crepúsculo','Abismo'],
    chao:['duna','coral','casco','longe','pedra'], bloq:['areia','alga','rede','lodo','breu'] },
  { nome:'Mangue', trato:'limo', texto:'Água turva de raiz e folha.',
    agua:['#B6E8B0','#57B184','#1C7A69','#123F4C','#0A1A24','#03070A'], moldura:'#C9A06A', acento:'#9CFF8A',
    bandas:['Baixio','Raizal','Canal turvo','Água parada','Poço negro'],
    chao:['raizes','kelp','tubulacao','longe','esponjas'], bloq:['limo','raiz','rede','lodo','breu'] },
  { nome:'Mar Polar', trato:'geada', texto:'Água gelada e leitosa.',
    agua:['#E2F7FF','#93D6F0','#3E86C4','#17306B','#080F2A','#02040E'], moldura:'#CFEAFF', acento:'#8FE9FF',
    bandas:['Banco de gelo','Jardim de kelp','Navio preso','Água leitosa','Fossa polar'],
    chao:['gelo','kelp','casco','longe','pedra'], bloq:['gelo','alga','rede','lodo','breu'] },
  { nome:'Cordilheira', trato:'mineral', texto:'Montanha submersa, parede de pedra.',
    agua:['#84E3D2','#23A89C','#116A70','#0E2148','#060A1C','#02040C'], moldura:'#A8C4B8', acento:'#5CFFD6',
    bandas:['Laje','Pico submerso','Desfiladeiro','Encosta funda','Fenda'],
    chao:['pedra','anemonas','pedra','longe','cristal'], bloq:['areia','coralmorto','craca','lodo','breu'] },
  { nome:'Boca do Vulcão', trato:'brasa', texto:'Areia preta e água morna.',
    agua:['#BCEAD2','#31AC90','#0F6F72','#2C1B40','#190A16','#0A0206'], moldura:'#E08A5C', acento:'#FF9A5C',
    bandas:['Praia preta','Recife novo','Lava velha','Fumaça','Caldeira'],
    chao:['duna','esponjas','pedra','longe','fumarola'], bloq:['areiapreta','alga','craca','cinza','breu'] },
  { nome:'Ruínas', trato:'patina', texto:'Alguém morou aqui antes do mar subir.',
    agua:['#DCEBBC','#69B69C','#1C6E85','#17204F','#0B0A20','#030309'], moldura:'#D9C08A', acento:'#FFD98A',
    bandas:['Escadaria','Pátio','Coluna caída','Salão fundo','Cripta'],
    chao:['ruinas','anemonas','ruinas','longe','cristal'], bloq:['areia','limo','craca','lodo','breu'] },
  { nome:'Sargaço', trato:'folha', texto:'Um mato flutuante que não acaba.',
    agua:['#D3EBAC','#73C28D','#2D8B8E','#14264F','#090C22','#02030B'], moldura:'#BBD48C', acento:'#B6FF7A',
    bandas:['Mato flutuante','Tapete verde','Sombra do mato','Fundo escuro','Buraco'],
    chao:['sargaco','kelp','casco','longe','anemonas'], bloq:['alga','limo','rede','lodo','breu'] },
  { nome:'Fossa', trato:'brilho', texto:'A água some rápido por aqui.',
    agua:['#93DAEA','#2E8BAC','#144670','#1A1250','#0B0620','#030109'], moldura:'#A98CD8', acento:'#B07CFF',
    bandas:['Borda','Talude','Degrau','Meia-água','Fundo da fossa'],
    chao:['pedra','esponjas','tubulacao','longe','fumarola'], bloq:['areia','craca','rede','cinza','breu'] }
];

/* de que lugar é esta fase, e com que cara */
function ambiente(i) {
  /* fase de mestre acontece sempre no escuro, não importa onde caia */
  const banda = ehMestre(i) ? 4 : Math.floor((i % CICLO) / 6);
  const volta = Math.floor(i / CICLO);
  const reg = REGIOES[volta % REGIOES.length];
  const b = MUNDOS[banda], bl = BLOQUEIOS[reg.bloq[banda]];
  /* passada a lista inteira, a mesma região volta com outra luz */
  const giro = Math.floor(volta / REGIOES.length);
  return { banda: banda, reg: reg, nome: reg.bandas[banda], de: b.de, ate: b.ate, bloq: bl,
           texto: reg.texto + ' ' + b.texto, dica: bl.dica, chao: reg.chao[banda],
           tom: giro === 0 ? '' : 'hue-rotate(' + (((giro * 29) % 61) - 30) + 'deg) saturate(' + (giro % 2 ? 1.12 : .9) + ')' };
}

/* ── as faixas de profundidade: elas mandam na luz e nas peças ──
   bloq: o que cobre o fundo nas fases de limpar                 */
const MUNDOS = [
  { de: 0, ate: 12, texto: 'O sol ainda chega em tudo.' },
  { de: 15, ate: 35, texto: 'Bicho com cor de sobra por todo lado.' },
  { de: 45, ate: 130, texto: 'A luz chega fria e de lado.' },
  { de: 200, ate: 1000, texto: 'A luz do sol acaba aqui e os bichos começam a brilhar.' },
  { de: 1500, ate: 4000, texto: 'Escuro total: só existe a luz que os bichos fazem.' }
];

/* ── as fases ──────────────────────────────────────────────────
   obj.tipo: 'pontos'   chegar na pontuação
             'coletar'  juntar N de cada peça da lista
             'papel'    limpar tudo que cobre o fundo (areia, alga, rede, lodo, breu)
   marcas: pontuação de 1, 2 e 3 estrelas (medidas por simulação) */
const BASE = [
  { m:0, prof:2,    nome:'Primeiro fôlego',    mov:23, obj:{tipo:'pontos'},                                        marcas:[9800,14500,19200] },
  { m:0, prof:4,    nome:'Pé na areia',        mov:25, obj:{tipo:'coletar', itens:[[0,14]]},                       marcas:[4500,6700,9500] },
  { m:0, prof:6,    nome:'Maré baixa',         mov:27, obj:{tipo:'papel', padrao:'bandeja', camadas:1},            marcas:[5500,8200,11600] },
  { m:0, prof:8,    nome:'Poça de maré',       mov:23, obj:{tipo:'especiais', n:3},                                        marcas:[4000,6000,8500] },
  { m:0, prof:10,   nome:'Água morna',         mov:27, obj:{tipo:'coletar', itens:[[1,15],[4,15]]},                marcas:[5800,8600,12300] },
  { m:0, prof:12,   nome:'Onde o sol alcança', mov:29, obj:{tipo:'papel', padrao:'xadrez', camadas:1},             marcas:[6600,9800,14000] },

  { m:1, prof:15,   nome:'Porta do recife',    mov:36, obj:{tipo:'pontos'},                                        marcas:[20400,28900,37300] },
  { m:1, prof:18,   nome:'Jardim de coral',    mov:25, obj:{tipo:'papel', padrao:'faixas', camadas:1},             marcas:[4800,8500,11500] },
  { m:1, prof:22,   nome:'Cardume',            mov:23, obj:{tipo:'coletar', itens:[[3,16],[5,16]]},                marcas:[6200,10900,14800] },
  { m:1, prof:26,   nome:'Correnteza',         mov:22, obj:{tipo:'bau', n:2},                                        marcas:[4800,8500,11500] },
  { m:1, prof:30,   nome:'Toca do polvo',      mov:22, obj:{tipo:'coletar', itens:[[0,13],[2,13],[4,13]]},         marcas:[5600,9900,13500] },
  { m:1, prof:35,   nome:'Parede de coral',    mov:34, obj:{tipo:'papel', padrao:'losango', camadas:2, cresce:4},            marcas:[8800,15600,21100] },

  { m:2, prof:45,   nome:'O casco',            mov:56, obj:{tipo:'pontos'},                                        marcas:[33900,45400,56900] },
  { m:2, prof:60,   nome:'Convés tombado',     mov:29, obj:{tipo:'papel', padrao:'colunas', camadas:1},            marcas:[6800,12100,16400] },
  { m:2, prof:75,   nome:'Porão',              mov:20, obj:{tipo:'coletar', itens:[[1,18],[2,18]]},                marcas:[6100,10700,14500] },
  { m:2, prof:90,   nome:'Âncora perdida',     mov:19, obj:{tipo:'bau', n:2},                                        marcas:[4200,7400,10000] },
  { m:2, prof:110,  nome:'Rede fantasma',      mov:34, obj:{tipo:'papel', padrao:'bandejao', camadas:1},           marcas:[8000,14100,19100] },
  { m:2, prof:130,  nome:'Proa na areia',      mov:18, obj:{tipo:'coletar', itens:[[3,14],[4,14],[5,14]]},         marcas:[5500,9700,13100] },

  { m:3, prof:200,  nome:'Último azul',        mov:23, obj:{tipo:'especiais', n:5},                                        marcas:[6300,11200,15200] },
  { m:3, prof:350,  nome:'Neve marinha',       mov:27, obj:{tipo:'papel', padrao:'cruz', camadas:2, cresce:5},               marcas:[7600,13400,18100] },
  { m:3, prof:500,  nome:'Luz de lanterna',    mov:24, obj:{tipo:'coletar', itens:[[4,22]]},                       marcas:[6900,12300,16600] },
  { m:3, prof:650,  nome:'Migração',           mov:21, obj:{tipo:'papel', padrao:'ondas', camadas:1},              marcas:[4600,8100,10900] },
  { m:3, prof:800,  nome:'Sem sol',            mov:23, obj:{tipo:'bau', n:3},                                        marcas:[6000,10700,14400] },
  { m:3, prof:1000, nome:'Mil metros',         mov:26, obj:{tipo:'papel', padrao:'alvo', camadas:1},               marcas:[6000,10700,14500] },

  { m:4, prof:1500, nome:'Breu',               mov:29, obj:{tipo:'papel', padrao:'bandeja', camadas:2},            marcas:[8200,14600,19800] },
  { m:4, prof:2000, nome:'Isca de luz',        mov:20, obj:{tipo:'coletar', itens:[[4,17],[5,17]]},                marcas:[5200,9300,12600] },
  { m:4, prof:2500, nome:'Chaminé quente',     mov:30, obj:{tipo:'bau', n:4},                                        marcas:[7800,13900,18800] },
  { m:4, prof:3000, nome:'Gigantes lentos',    mov:45, obj:{tipo:'papel', padrao:'xadrez', camadas:2, cresce:4},             marcas:[11800,20900,28400] },
  { m:4, prof:3500, nome:'Pressão',            mov:20, obj:{tipo:'coletar', itens:[[0,14],[1,14],[2,14],[3,14]]},  marcas:[6300,11100,15100] },
  { m:4, prof:4000, nome:'O fundo',            mov:41, obj:{tipo:'papel', padrao:'bandejao', camadas:2},           marcas:[11700,20800,28200] }
];
const POR_MUNDO = 6;
const CICLO = 30;   /* uma expedição inteira: do raso ao fundo */

/* ── daqui pra frente o mar não acaba ──────────────────────────
   Passada a fase 30, cada bloco de 30 é uma nova expedição: começa
   de novo no raso, mais apertada, com zonas de nomes próprios. As
   fases são geradas por semente, então a fase 4.812 é sempre igual
   pra todo mundo e nada disso precisa ficar guardado.            */
const ZONAS = [
  ['Banco de areia','Laje rasa','Poça funda','Canal claro','Prainha','Coroa de areia','Baixio','Beira de pedra','Enseada','Marola'],
  ['Jardim de fogo','Coral rachado','Fenda do recife','Cabeço','Recife morno','Parede viva','Toca funda','Bico de coral','Laje florida','Canal do recife'],
  ['Casco velho','Proa quebrada','Porão fundo','Caldeira','Convés aberto','Âncora presa','Mastro caído','Rede solta','Casco rachado','Fundo de ferro'],
  ['Água parada','Correnteza fria','Lamaçal','Banco de lodo','Fosso raso','Sombra longa','Neve funda','Poço azul','Véu escuro','Silêncio'],
  ['Fossa','Chaminé','Planície funda','Buraco negro','Pedra quente','Boca da terra','Vale cego','Lodo de pedra','Bolsão','Última pedra']
];
const PADROES_GER = [['bandeja',24],['xadrez',26],['faixas',26],['colunas',30],['moldura',28],['losango',24],['cruz',22],['ondas',23],['alvo',26],['bandejao',34]];

function semente(i) { let t = (i * 1103515245 + 12345) >>> 0; return () => { t = (t * 1664525 + 1013904223) >>> 0; return t / 4294967296; }; }
const geradas = {};
let geradasN = 0;
const r100 = x => Math.round(x / 100) * 100;

const CLASSES = {
  F: { nome: 'Fácil',    cor: '#3DDC84', emoji: '🟢', texto: 'Objetivo simples e boa margem pra errar.' },
  N: { nome: 'Normal',   cor: '#4DA3FF', emoji: '🔵', texto: 'Pede atenção ao tabuleiro, mas ainda dá pra errar um pouco.' },
  D: { nome: 'Difícil',  cor: '#FF9A3D', emoji: '🟠', texto: 'Pede plano: menos jogadas e mais coisa pra administrar.' },
  L: { nome: 'Lendário', cor: '#FF4D6D', emoji: '🔴', texto: 'Pouca margem pra erro e várias mecânicas ao mesmo tempo.' }
};
function classeDaFase(i) {
  const f = fase(i);
  if (f.classe) return f.classe;
  const k = i % 6;                                   /* fases feitas à mão: rótulo pela posição no mundo */
  return i < 6 ? (k === 5 ? 'N' : 'F') : k === 0 ? 'F' : k === 5 ? 'D' : i === 29 ? 'L' : 'N';
}
function fase(i) {
  if (i < BASE.length) return BASE[i];
  if (geradas[i]) return geradas[i];
  if (ehMestre(i)) return (geradas[i] = faseMestre(i));
  if (geradasN > 400) { for (const k in geradas) delete geradas[k]; geradasN = 0; }   /* não deixa a memória crescer sem fim */
  const r = semente(i);
  const pos = i % CICLO, m = Math.floor(pos / 6), base = BASE[pos];
  const dif = Math.min(1, .45 + (i - CICLO) / 420);    /* já começa no aperto da fase 30 e sobe devagar */
  const nome = ZONAS[m][(i * 7 + Math.floor(r() * 3)) % ZONAS[m].length];  /* nomes seguidos nunca repetem */
  const menu = ['pontos','coletar','coletar','papel','papel','bau','especiais','presos','bolhas','corrente','mancha','ninho','ninho','perolas','perolas','lixo','lixo','coral','coral'];
  const antes = i > CICLO ? (function () { const a = fase(i - 1); return a.obj.corrente ? 'corrente' : a.obj.mancha ? 'mancha' : a.obj.tipo; })() : '';
  let tipo = r() < .30 ? base.obj.tipo : menu[Math.floor(r() * menu.length)];
  /* duas fases seguidas com o mesmo objetivo cansa: sorteia de novo */
  for (let t = 0; t < 4 && tipo === antes; t++) tipo = menu[Math.floor(r() * menu.length)];
  let mov, obj;
  if (tipo === 'pontos') {
    mov = Math.max(18, Math.round(base.mov - dif * 2 + r() * 3));
    obj = { tipo:'pontos' };
  } else if (tipo === 'coletar') {
    const n = 1 + Math.floor(r() * 4);
    mov = Math.max(18, Math.round(21 + r() * 4 - dif * 3));
    const alvo = Math.max(8, Math.round(mov * [.86,.60,.56,.60][n-1] * (.92 + .2 * dif)));
    const cores = [0,1,2,3,4,5];
    for (let k = cores.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); const t = cores[k]; cores[k] = cores[j]; cores[j] = t; }
    obj = { tipo:'coletar', itens: cores.slice(0, n).sort((a,b)=>a-b).map(c => [c, alvo]) };
  } else if (tipo === 'especiais') {
    const n = 3 + Math.floor(r() * 3 + dif * 2);
    mov = Math.max(18, Math.round(15 + n * 3.2 - dif * 2));
    obj = { tipo:'especiais', n: n };
  } else if (tipo === 'bau') {
    const n = 2 + Math.floor(r() * 2 + dif);
    mov = Math.max(21, Math.round(19 + n * 5 - dif * 2));
    obj = { tipo:'bau', n: n };
  } else if (tipo === 'presos') {
    const n = 3 + Math.floor(r() * 2 + dif * 2);
    mov = Math.max(22, Math.round(19 + n * 4.2 - dif * 2));
    obj = { tipo:'presos', n: n, rede: 1 };
  } else if (tipo === 'bolhas') {
    const n = 4 + Math.floor(r() * 2 + dif * 3);
    mov = Math.max(22, Math.round(19 + n * 3.6 - dif * 2));
    obj = { tipo:'bolhas', n: n, sobe: 3, juntas: 3 };
  } else if (tipo === 'corrente') {
    const pd = PADROES_GER[Math.floor(r() * PADROES_GER.length)];
    mov = Math.max(20, Math.round(pd[1] * 1.55 * (1.0 - .10 * dif)));
    obj = { tipo:'papel', padrao: pd[0], camadas: 3, corrente: true };
  } else if (tipo === 'perolas') {
    /* pérolas dentro de ostras fechadas: um estouro abre, outro colhe */
    const n = 4 + Math.floor(r() * 3 + dif * 3);
    mov = Math.max(20, Math.round(15 + n * 3 - dif * 2));
    obj = { tipo:'perolas', n: n };
  } else if (tipo === 'lixo') {
    /* lixo no fundo: não combina, sai com estouro colado ou especial */
    const n = 5 + Math.floor(r() * 3 + dif * 4), dura = dif > .7 && r() < .5 ? 2 : 1;
    mov = Math.max(20, Math.round(15 + n * 2.4 * dura - dif * 2));
    obj = { tipo:'lixo', n: n, dura: dura };
  } else if (tipo === 'coral') {
    /* coral morto volta a ter cor quando você estoura em cima ou do lado */
    const n = 12 + Math.floor(r() * 5 + dif * 6);
    mov = Math.max(20, Math.round(14 + n * 1.25 - dif * 2));
    obj = { tipo:'coral', n: n };
  } else if (tipo === 'ninho') {
    /* ninhos presos na borda de cima: de 1 a 3, conforme a profundidade */
    const n = 1 + Math.floor(r() * 2 + dif * 1.2);
    const cols = [];
    while (cols.length < Math.min(3, n)) { const c = Math.floor(r() * 7); if (cols.indexOf(c) < 0 && cols.every(x => Math.abs(x - c) > 1)) cols.push(c); if (cols.length === 0 && r() > .99) break; }
    mov = Math.max(22, Math.round(18 + cols.length * 7 - dif * 2));
    obj = { tipo:'ninho', ninhos: cols, vida: 3 };
  } else if (tipo === 'mancha') {
    const pd = PADROES_GER[Math.floor(r() * PADROES_GER.length)];
    mov = Math.max(20, Math.round(pd[1] * 1.35 * (1.0 - .10 * dif)));
    obj = { tipo:'papel', padrao: pd[0], camadas: 1, cresce: 3, espalha: true, mancha: true };
  } else {
    const pd = PADROES_GER[Math.floor(r() * PADROES_GER.length)];
    const camadas = r() < .28 + .34 * dif ? 2 : 1;
    mov = Math.max(18, Math.round(pd[1] * (camadas === 2 ? 1.3 : 1) * (1.0 - .10 * dif)));
    obj = { tipo:'papel', padrao: pd[0], camadas: camadas };
    if (r() < .18 + .3 * dif) { obj.cresce = 4 + Math.floor(r() * 2); mov = Math.round(mov * 1.22); }
  }
  /* pontos por jogada medidos com o bot: sobem junto com o aperto da fase */
  /* pontos por jogada medidos com o bot, por tipo de objetivo */
  const tp = obj.corrente ? 'corrente' : obj.mancha ? 'mancha' : tipo;
  const porJogada = tp === 'pontos' ? 970 + 470 * dif : tp === 'bau' ? 560 + 130 * dif
                  : tp === 'especiais' ? 580 + 150 * dif : tp === 'presos' ? 1080 + 120 * dif
                  : tp === 'bolhas' ? 1160 + 120 * dif : tp === 'corrente' ? 860 + 110 * dif
                  : tp === 'perolas' ? 700 + 120 * dif : tp === 'lixo' ? 720 + 120 * dif : tp === 'coral' ? 740 + 80 * dif
                  : tp === 'ninho' ? 760 + 120 * dif : tp === 'mancha' ? 640 + 90 * dif : tp === 'papel' ? 745 + 35 * dif : 630 + 230 * dif;
  /* ── classificação da fase ─────────────────────────────────────
     Cada bloco de dez tem as quatro categorias, numa ordem sorteada
     entre alguns desenhos, e a categoria mexe na fase de verdade:
     Fácil ganha jogada, Difícil perde, Lendário perde mais e soma um
     segundo objetivo. Não é enfeite: o rótulo diz o que a fase é.  */
  /* A categoria é medida, não sorteada: soma o peso de cada coisa que
     a fase pede administrar. Mecânica que age sozinha pesa mais, cada
     ninho a mais pesa, e a profundidade soma um pouco.               */
  const tpc = obj.corrente ? 'corrente' : obj.mancha ? 'mancha' : obj.tipo;
  const PESO = { pontos: 0, coletar: 0, papel: 1, bau: 1, especiais: 1, perolas: 1, coral: 1, lixo: 1.5,
                 presos: 2, bolhas: 2, corrente: 2, mancha: 3, ninho: 3 };
  let peso = (PESO[tpc] || 0) + dif * 1.6;
  if (tpc === 'ninho') peso += (obj.ninhos.length - 1) * 1.8;
  if (obj.tipo === 'lixo' && obj.dura > 1) peso += 1.2;
  if (obj.cresce && !obj.mancha) peso += 1;
  let classe = peso < 1.4 ? 'F' : peso < 3 ? 'N' : peso < 4.6 ? 'D' : 'L';
  /* o lendário ganha o segundo objetivo, e isso já faz parte do peso */
  if (classe === 'L' && obj.tipo !== 'coletar' && obj.tipo !== 'pontos' && obj.tipo !== 'ninho' && r() < .6) {
    obj.extra = { tipo: 'coletar1', t: Math.floor(r() * 6), n: Math.round(12 + dif * 8) };
  }
  /* ajuste leve de jogadas: o rótulo descreve a fase, não a castiga */
  const multi = { F: 1.08, N: 1, D: .96, L: .94 }[classe];

  /* formato do tabuleiro: quanto menos casa, menos jogada precisa */
  /* o quadrado é o padrão; formato diferente aparece em cerca de
     quatro de cada dez fases, pra ser variedade e não regra      */
  const fm = r() < .55 ? FORMATOS[0] : FORMATOS[1 + Math.floor(r() * (FORMATOS.length - 1))];
  const casas = fm.topo.reduce((a, t) => a + (8 - t), 0), cheio = 56;
  mov = Math.max(16, Math.round(mov * .88 * (.55 + .45 * casas / cheio) * multi + (obj.extra ? 3 : 0)));   /* aperto: o retorno foi que sobrava jogada demais */
  const p50 = Math.round(mov * porJogada * .85 * (.45 + .55 * casas / cheio));
  let marcas;
  if (tipo === 'pontos') { const m0 = r100(p50 * (.44 + .06 * dif)), m2 = r100(p50 * .84); marcas = [m0, r100((m0 + m2) / 2), m2]; }
  else marcas = [r100(p50 * .35), r100(p50 * .6), r100(p50 * .84)];
  geradasN++;
  return (geradas[i] = { m, prof: base.prof, nome, mov, obj, marcas, classe: classe, forma: (obj.tipo === 'ninho' ? fm.topo.map((t, c) => obj.ninhos.indexOf(c) >= 0 ? Math.max(t, 1) : t) : fm.topo), formaNome: fm.nome, exped: Math.floor(i / CICLO) + 1 });
}
const expedicao = i => Math.floor(i / CICLO) + 1;

/* ── poderes e moedas ──────────────────────────────────────────
   Nada de vidas com relógio: isso existe pra vender recarga, e
   aqui não se vende nada. O que segura o jogador é o poder que
   ele junta jogando.                                            */
const PODERES = [
  { id:'arpao',  nome:'Arpão',       texto:'Tira do tabuleiro a peça que você tocar.',        preco:140 },
  { id:'troca',  nome:'Troca livre', texto:'Troca duas peças de lugar, mesmo longe uma da outra.', preco:200 },
  { id:'giro',   nome:'Redemoinho',  texto:'Embaralha o tabuleiro inteiro sem gastar jogada.', preco:110 },
  { id:'isca',   nome:'Isca de luz', texto:'Chama um cardume que vira bolha na peça que você tocar.', preco:190 },
  { id:'folego', nome:'Fôlego',      texto:'Mais 5 jogadas, e dá pra usar depois que acabaram.', preco:260 }
];
const moedasDaFase = (estrelas, primeira) => 5 + 6 * estrelas + (primeira ? 10 : 0);
/* o dia vira à meia-noite de quem está jogando, não em UTC: antes
   o prêmio novo abria às 21h no Brasil.                          */
const dataLocal = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hoje = () => dataLocal(new Date());

/* ═══ FORMATOS DE TABULEIRO ═════════════════════════════════════
   Cada número diz em que fileira aquela coluna começa. Zero é
   coluna inteira; dois é coluna que começa duas casas abaixo.
   É isso que tira o quadrado de todas as fases.                  */
const FORMATOS = [
  { nome:'cheio',     topo:[0,0,0,0,0,0,0] },
  { nome:'arco',      topo:[2,1,0,0,0,1,2] },
  { nome:'pirâmide',  topo:[3,2,1,0,1,2,3] },
  { nome:'taça',      topo:[0,1,2,3,2,1,0] },
  { nome:'escada',    topo:[0,0,1,1,2,2,3] },
  { nome:'escada2',   topo:[3,2,2,1,1,0,0] },
  { nome:'torres',    topo:[0,2,0,2,0,2,0] },
  { nome:'ilha',      topo:[2,0,0,1,0,0,2] },
  { nome:'ombros',    topo:[1,1,0,0,0,1,1] },
  { nome:'dentes',    topo:[0,1,0,1,0,1,0] }
];

/* ═══ OS MESTRES ════════════════════════════════════════════════
   A cada 100 fases o mergulho esbarra num bicho grande. Ele não
   fica no tabuleiro: encara a pessoa de cima, com barra de vida.
   Cada peça que você estoura machuca ele; de duas em duas jogadas
   ele revida, roubando uma jogada e cuspindo tinta. Casa com
   tinta não machuca, então limpar a tinta faz parte da briga.   */
const MESTRES = [
  { nome:'Lula-gigante',   cor:'#B07CFF', cor2:'#5A2E8C', forma:'lula',
    fala:'Oito braços, nenhuma pressa. Ele já viu mergulhador demais.' },
  { nome:'Enguia-elétrica', cor:'#6BFFE0', cor2:'#0A6C7A', forma:'enguia',
    fala:'A água em volta dela formiga. Não é medo seu, é corrente mesmo.' },
  { nome:'Caranguejo-rei',  cor:'#FF8A5C', cor2:'#8C2F14', forma:'caranguejo',
    fala:'Ele subiu na pedra mais alta e acha que o fundo é dele.' },
  { nome:'Serpente-do-abismo', cor:'#FF7390', cor2:'#6E1030', forma:'serpente',
    fala:'Ninguém sabe onde ela termina. Só que a cabeça está bem aqui.' }
];
const ehMestre = i => (i + 1) % 100 === 0;
function faseMestre(i) {
  const volta = Math.floor((i + 1) / 100);          /* 1º mestre na fase 100 */
  const mestre = (volta - 1) % MESTRES.length;
  const m = 4, dif = Math.min(1, .45 + (i - CICLO) / 420);
  const vida = 84 + volta * 20;
  const mov = 28 + Math.min(6, volta * 2);
  const p50 = Math.round(mov * (980 + 320 * dif));
  return { m: m, prof: 4000 + volta * 500, nome: MESTRES[mestre].nome, mov: mov, mestre: mestre, classe: 'L',
           obj: { tipo:'chefe', vida: vida, golpe: 2, mestre: mestre },
           marcas: [r100(p50 * .45), r100(p50 * .66), r100(p50 * .86)] };
}

/* ── desafio da semana ─────────────────────────────────────────
   Uma fase só, igual pro mundo inteiro na semana, tabuleiro e
   peças novas saindo da mesma semente. Ganha quem fizer mais
   ponto em 25 jogadas.                                          */
function chaveSemana(d) {
  const t = d || new Date();
  const u = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
  u.setUTCDate(u.getUTCDate() + 4 - (u.getUTCDay() || 7));
  const ano = u.getUTCFullYear();
  const sem = Math.ceil(((u - Date.UTC(ano, 0, 1)) / 86400000 + 1) / 7);
  return ano + '-S' + String(sem).padStart(2, '0');
}
function faseDesafio() {
  const chave = chaveSemana();
  let h = 0;
  for (let i = 0; i < chave.length; i++) h = (h * 31 + chave.charCodeAt(i)) >>> 0;
  const m = h % 5;
  return { m: m, prof: BASE[m * 6 + 3].prof, nome: 'Desafio da semana', mov: 25, desafio: true, semana: chave,
           obj: { tipo: 'pontos' }, marcas: [6000, 16000, 26000] };
}


/* ── o que cobre o fundo: padrões dentro da zona que o jogo limpa
   de verdade (linhas 0–6, colunas 1–5; as quinas quase nunca estouram) */
function fazPapel(padrao, camadas) {
  const g = Array.from({ length: H }, () => Array(W).fill(0));
  const põe = (r, c, k) => { if (dentro(r, c)) g[r][c] = k || camadas; };
  if (padrao === 'bandeja') { for (let r = 1; r <= 4; r++) for (let c = 1; c <= 5; c++) põe(r, c); }
  else if (padrao === 'xadrez') { for (let r = 0; r <= 6; r++) for (let c = 1; c <= 5; c++) if ((r + c) % 2 === 0) põe(r, c); }
  else if (padrao === 'moldura') {
    for (let c = 1; c <= 5; c++) { põe(1, c); põe(6, c); }
    for (let r = 2; r <= 5; r++) { põe(r, 1); põe(r, 5); }
  } else if (padrao === 'losango') {
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (Math.abs(r - 3.5) + Math.abs(c - 3) <= 2.5) põe(r, c);
  } else if (padrao === 'bandejao') { for (let r = 0; r <= 6; r++) for (let c = 1; c <= 5; c++) põe(r, c); }
  else if (padrao === 'faixas') { for (const r of [1, 3, 5]) for (let c = 1; c <= 5; c++) põe(r, c); }
  else if (padrao === 'colunas') { for (let r = 0; r <= 6; r++) for (const c of [1, 3, 5]) põe(r, c); }
  else if (padrao === 'cruz') { for (let c = 1; c <= 5; c++) põe(3, c); for (let r = 0; r <= 6; r++) põe(r, 3); }
  else if (padrao === 'ondas') { for (let c = 1; c <= 5; c++) { const b = 3 + Math.round(Math.sin(c * 1.1) * 1.6); for (let r = b - 1; r <= b + 1; r++) põe(r, c); } }
  else if (padrao === 'alvo') {
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      const d = Math.abs(r - 3.5) + Math.abs(c - 3);
      if (d <= 1.5) põe(r, c, 2); else if (d <= 2.5) põe(r, c, 1);
    }
  }
  return g;
}
function contaPapel(g) { let n = 0; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) n += g[r][c]; return n; }
function casasCobertas(g) { let n = 0; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (g[r][c] > 0) n++; return n; }

/* ── guardar o progresso ───────────────────────────────────── */
const CHAVE = 'mergulho-v1';
let prog = { estrelas: {}, max: 0, som: true, vistos: {}, moedas: 120,
             musica: true, vibrar: true, leve: null,
             poderes: { arpao: 1, troca: 1, giro: 1, isca: 1, folego: 1 }, dia: '',
             email: '', apelido: '', cardume: '', melhores: {},
             desafio: { semana: '', melhor: 0, nome: '' } };
function carregaProg() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (cru) { const p = JSON.parse(cru); prog = Object.assign(prog, p); prog.vistos = prog.vistos || {}; prog.poderes = Object.assign({ arpao:0, troca:0, giro:0, folego:0 }, prog.poderes);
      prog.desafio = Object.assign({ semana:'', melhor:0, nome:'' }, prog.desafio); }
  } catch (e) { /* sem armazenamento: joga do mesmo jeito, só não guarda */ }
}
function salvaProg() { try { localStorage.setItem(CHAVE, JSON.stringify(prog)); } catch (e) {} }
const CHAVE_PARTIDA = CHAVE + '-partida';
function limpaPartida() { try { localStorage.removeItem(CHAVE_PARTIDA); } catch (e) {} }
function lePartida() {
  try { const c = localStorage.getItem(CHAVE_PARTIDA); return c ? JSON.parse(c) : null; } catch (e) { return null; }
}

function totalEstrelas() { return Object.values(prog.estrelas).reduce((a, b) => a + b, 0); }

/* ── som feito na hora: bolha que sobe, mais grave quanto mais fundo ── */
const Som = {
  ctx: null, m: 0,
  liga() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch (e) { return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  get f() { return [1, .94, .84, .74, .64][this.m] || 1; },
  nota(f, dur, tipo, vol, desliza) {
    if (!prog.som || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (desliza) o.frequency.exponentialRampToValueAtTime(Math.max(40, desliza), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  /* no escuro o som volta: um eco curto, como em caverna */
  eco(f, dur, tipo, vol, desliza) {
    this.nota(f, dur, tipo, vol, desliza);
    if (this.m >= 3) setTimeout(() => this.nota(f, dur * 1.3, tipo, (vol || .16) * .32, desliza), 150);
  },
  ruido(dur, vol, freq) {
    if (!prog.som || !this.ctx) return;
    const t = this.ctx.currentTime, n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const fl = this.ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = freq || 900; fl.Q.value = 0.7;
    const g = this.ctx.createGain(); g.gain.value = vol || 0.2;
    s.connect(fl); fl.connect(g); g.connect(this.ctx.destination); s.start(t);
  },
  pop(n) {
    const f = 380 * Math.pow(1.09, Math.min(n, 14)) * this.f;
    this.eco(f, 0.13, 'sine', 0.17, f * 1.8);
    if (n >= 3) setTimeout(() => this.nota(f * 1.5, 0.09, 'triangle', 0.08, f * 2.4), 45);
  },
  toque() { this.nota(520 * this.f, 0.05, 'sine', 0.07, 700 * this.f); },
  raio() {   /* correnteza varrendo a fileira */
    this.ruido(0.42, 0.2, 1500 * this.f);
    this.nota(900 * this.f, 0.3, 'sawtooth', 0.09, 180 * this.f);
  },
  bomba() {
    this.ruido(0.55, 0.3, 320 * this.f);
    this.nota(140 * this.f, 0.6, 'sine', 0.24, 38);
    setTimeout(() => this.ruido(0.4, 0.14, 900 * this.f), 60);
  },
  combo() {
    [0, 90, 180, 300].forEach((d, i) => setTimeout(() => this.eco((440 + i * 180) * this.f, 0.3, 'triangle', 0.16), d));
    this.ruido(0.7, 0.24, 600 * this.f);
  },
  cai(n) { this.nota((260 + n * 40) * this.f, 0.07, 'sine', 0.05, (200 + n * 30) * this.f); },
  alerta() { this.nota(180 * this.f, 0.1, 'triangle', 0.13, 120 * this.f); setTimeout(() => this.nota(150 * this.f, 0.14, 'triangle', 0.1, 90 * this.f), 130); },
  sobe(i) { this.nota((520 + i * 140) * this.f, 0.14, 'triangle', 0.12, (640 + i * 180) * this.f); },
  troca() { this.nota(300 * this.f, 0.08, 'sine', 0.09, 370 * this.f); },
  nao() { this.nota(190 * this.f, 0.11, 'triangle', 0.08, 150 * this.f); },
  especial() { this.ruido(0.3, 0.12, 750 * this.f); this.eco(260 * this.f, 0.32, 'sine', 0.12, 900 * this.f); },
  estoura() { this.ruido(0.45, 0.22, 520 * this.f); this.nota(110 * this.f, 0.5, 'sine', 0.2, 45); },
  bau() { this.ruido(0.3, 0.16, 300 * this.f); this.nota(150 * this.f, 0.34, 'sine', 0.18, 70); setTimeout(() => this.eco(880 * this.f, 0.22, 'triangle', 0.12, 1320 * this.f), 120); },
  cresce() { this.nota(220 * this.f, 0.22, 'sine', 0.1, 140 * this.f); this.ruido(0.18, 0.07, 400 * this.f); },
  estrela(i) { this.eco(([784, 988, 1319][i] || 784) * this.f, 0.5, 'sine', 0.15); },
  vitoria() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.eco(f * this.f, 0.42, 'triangle', 0.13), i * 120)); },
  derrota() { [392, 330, 262].forEach((f, i) => setTimeout(() => this.nota(f * this.f, 0.36, 'sine', 0.12), i * 160)); }
};
function vibra(ms) { try { if (navigator.vibrate && prog.vibrar) navigator.vibrate(ms); } catch (e) {} }
const TREMIDA = {
  toque: 6, combina: 12, grande: [16, 30, 16], especial: [24, 18, 40], combo: [40, 25, 60, 25, 80],
  bau: [26, 40], estrela: [18, 50, 18], vitoria: [20, 60, 20, 60, 120], derrota: [90, 40, 90], aperto: 14
};

/* ═══ MÚSICA ════════════════════════════════════════════════════
   Feita na hora, sem arquivo: baixo, bumbo, chimbal e um arpejo
   na escala do mundo. Acelera quando as jogadas acabam.          */
const Musica = {
  passo: 0, timer: null, modo: null, m: 0, aperto: 0, calor: 0,
  escalas: [[0,2,4,7,9],[0,2,4,7,11],[0,3,5,7,10],[0,2,3,7,10],[0,1,5,6,10]],
  raiz: [196, 174.61, 146.83, 130.81, 110],
  liga(modo, m) {
    if (this.modo === modo && this.m === m && this.timer) return;
    this.modo = modo; this.m = m == null ? this.m : m; this.passo = 0;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.toca(), 1000);
    this.ritmo();
  },
  ritmo() {
    clearInterval(this.timer);
    const bpm = (this.modo === 'menu' ? 74 : 96 + this.aperto * 26 + this.calor * 8);
    this.timer = setInterval(() => this.toca(), 60000 / bpm / 4);
  },
  para() { clearInterval(this.timer); this.timer = null; this.modo = null; },
  tensao(a, calor) {
    const novo = a ? 1 : 0;
    if (novo !== this.aperto || calor !== this.calor) { this.aperto = novo; this.calor = calor || 0; if (this.timer) this.ritmo(); }
  },
  nota(f, dur, tipo, vol) {
    const ctx = Som.ctx;
    if (!ctx || !prog.som || !prog.musica) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  batida(vol, freq, dur) {
    const ctx = Som.ctx;
    if (!ctx || !prog.som || !prog.musica) return;
    const t = ctx.currentTime, n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.1;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(t);
  },
  toca() {
    if (!Som.ctx || !prog.som || !prog.musica) return;
    const p = this.passo % 16, esc = this.escalas[this.m], raiz = this.raiz[this.m];
    const jogo = this.modo === 'jogo';
    const vol = jogo ? 0.05 + this.aperto * 0.02 : 0.035;
    if (p % 4 === 0) { this.nota(raiz / 2, 0.18, 'sine', vol * 1.6); if (jogo) this.batida(vol * 0.9, 90, 0.12); }
    if (jogo && p % 8 === 4) this.batida(vol * 0.7, 1800, 0.09);
    if (jogo && p % 2 === 1) this.batida(vol * 0.18, 6000, 0.03);
    const arpejo = jogo ? [0, 3, 6, 10, 12, 14] : [0, 6, 12];
    if (arpejo.indexOf(p) >= 0) {
      const g = esc[(this.passo * 3 + (p % 5)) % esc.length];
      this.nota(raiz * Math.pow(2, g / 12) * (p > 8 ? 2 : 1), jogo ? 0.16 : 0.5, jogo ? 'triangle' : 'sine', vol * (jogo ? 0.7 : 0.9));
    }
    if (p === 0) { const g = esc[(this.passo / 16 | 0) % esc.length]; this.nota(raiz * Math.pow(2, g / 12) / 2, 1.6, 'sine', vol * 0.5); }
    this.passo++;
  }
};
