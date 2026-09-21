/* ═══════════════════════════════════════════════════════════════
   MERGULHO · combinar 3 da beira da praia até 4.000 metros
   ═══════════════════════════════════════════════════════════════ */

const W = 7, H = 8, TIPOS = 6;
const NADA = 0, LH = 1, LV = 2, BOMBA = 3, ARCO = 4;

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

/* ── os mundos: cada um é uma faixa de profundidade ─────────────
   bloq: o que cobre o fundo nas fases de limpar                 */
const MUNDOS = [
  { nome: 'Raso', de: 0, ate: 12,
    bloq: { verbo: 'Varrer', um: 'monte de areia', varios: 'montes de areia' },
    texto: 'Água morna e areia clara. O sol ainda chega em tudo.',
    dica: 'A areia cobre parte do fundo. Estoure peças em cima dela para varrer.' },
  { nome: 'Recife', de: 15, ate: 35,
    bloq: { verbo: 'Limpar', um: 'alga', varios: 'algas' },
    texto: 'Coral para todo lado e bicho com cor de sobra.',
    dica: 'Algas tomaram o recife. As mais escuras precisam de duas passadas.' },
  { nome: 'Naufrágio', de: 45, ate: 130,
    bloq: { verbo: 'Cortar', um: 'rede', varios: 'redes' },
    texto: 'Um casco antigo, luz fria e redes esquecidas.',
    dica: 'Tem rede presa no casco. Estoure peças em cima para cortar.' },
  { nome: 'Crepúsculo', de: 200, ate: 1000,
    bloq: { verbo: 'Limpar', um: 'casa com lodo', varios: 'casas com lodo' },
    texto: 'A luz do sol acaba aqui. Os bichos começam a brilhar.',
    dica: 'O lodo assentou no fundo. Estoure peças em cima para limpar.' },
  { nome: 'Abismo', de: 1500, ate: 4000,
    bloq: { verbo: 'Acender', um: 'casa apagada', varios: 'casas apagadas' },
    texto: 'Escuro total. Só existe a luz que os próprios bichos fazem.',
    dica: 'Algumas casas estão apagadas. Estoure peças em cima para acender.' }
];

/* ── as fases ──────────────────────────────────────────────────
   obj.tipo: 'pontos'   chegar na pontuação
             'coletar'  juntar N de cada peça da lista
             'papel'    limpar tudo que cobre o fundo (areia, alga, rede, lodo, breu)
   marcas: pontuação de 1, 2 e 3 estrelas (medidas por simulação) */
const BASE = [
  { m:0, prof:2,    nome:'Primeiro fôlego',    mov:20, obj:{tipo:'pontos'},                                        marcas:[6600,12600,18600] },
  { m:0, prof:4,    nome:'Pé na areia',        mov:22, obj:{tipo:'coletar', itens:[[0,14]]},                       marcas:[4900,8300,11600] },
  { m:0, prof:6,    nome:'Maré baixa',         mov:24, obj:{tipo:'papel', padrao:'bandeja', camadas:1},            marcas:[5500,9400,13100] },
  { m:0, prof:8,    nome:'Poça de maré',       mov:20, obj:{tipo:'pontos'},                                        marcas:[6900,12100,17300] },
  { m:0, prof:10,   nome:'Água morna',         mov:24, obj:{tipo:'coletar', itens:[[1,15],[4,15]]},                marcas:[5900,10100,14000] },
  { m:0, prof:12,   nome:'Onde o sol alcança', mov:26, obj:{tipo:'papel', padrao:'xadrez', camadas:1},             marcas:[6200,10700,14900] },

  { m:1, prof:15,   nome:'Porta do recife',    mov:22, obj:{tipo:'pontos'},                                        marcas:[10800,15900,20900] },
  { m:1, prof:18,   nome:'Jardim de coral',    mov:26, obj:{tipo:'papel', padrao:'faixas', camadas:1},             marcas:[5300,9100,12700] },
  { m:1, prof:22,   nome:'Cardume',            mov:24, obj:{tipo:'coletar', itens:[[3,16],[5,16]]},                marcas:[6300,10700,14900] },
  { m:1, prof:26,   nome:'Correnteza',         mov:24, obj:{tipo:'bau', n:2},                                        marcas:[4100,7100,9900] },
  { m:1, prof:30,   nome:'Toca do polvo',      mov:23, obj:{tipo:'coletar', itens:[[0,13],[2,13],[4,13]]},         marcas:[6000,10300,14300] },
  { m:1, prof:35,   nome:'Parede de coral',    mov:31, obj:{tipo:'papel', padrao:'losango', camadas:2, cresce:4},            marcas:[9000,15500,21500] },

  { m:2, prof:45,   nome:'O casco',            mov:22, obj:{tipo:'pontos'},                                        marcas:[10400,14500,18600] },
  { m:2, prof:60,   nome:'Convés tombado',     mov:30, obj:{tipo:'papel', padrao:'colunas', camadas:1},            marcas:[7500,12800,17800] },
  { m:2, prof:75,   nome:'Porão',              mov:24, obj:{tipo:'coletar', itens:[[1,18],[2,18]]},                marcas:[6200,10700,14800] },
  { m:2, prof:90,   nome:'Âncora perdida',     mov:25, obj:{tipo:'bau', n:3},                                        marcas:[5000,8500,11800] },
  { m:2, prof:110,  nome:'Rede fantasma',      mov:34, obj:{tipo:'papel', padrao:'bandejao', camadas:1},           marcas:[8200,14000,19400] },
  { m:2, prof:130,  nome:'Proa na areia',      mov:23, obj:{tipo:'coletar', itens:[[3,14],[4,14],[5,14]]},         marcas:[5900,10100,14100] },

  { m:3, prof:200,  nome:'Último azul',        mov:22, obj:{tipo:'pontos'},                                        marcas:[10500,14800,19000] },
  { m:3, prof:350,  nome:'Neve marinha',       mov:29, obj:{tipo:'papel', padrao:'cruz', camadas:2, cresce:5},               marcas:[7900,13600,18900] },
  { m:3, prof:500,  nome:'Luz de lanterna',    mov:24, obj:{tipo:'coletar', itens:[[4,22]]},                       marcas:[6400,11100,15400] },
  { m:3, prof:650,  nome:'Migração',           mov:23, obj:{tipo:'papel', padrao:'ondas', camadas:1},              marcas:[5000,8600,11900] },
  { m:3, prof:800,  nome:'Sem sol',            mov:28, obj:{tipo:'bau', n:4},                                        marcas:[6000,10300,14300] },
  { m:3, prof:1000, nome:'Mil metros',         mov:26, obj:{tipo:'papel', padrao:'alvo', camadas:1},               marcas:[6100,10400,14500] },

  { m:4, prof:1500, nome:'Breu',               mov:32, obj:{tipo:'papel', padrao:'bandeja', camadas:2},            marcas:[8400,14500,20100] },
  { m:4, prof:2000, nome:'Isca de luz',        mov:24, obj:{tipo:'coletar', itens:[[4,17],[5,17]]},                marcas:[6600,11300,15700] },
  { m:4, prof:2500, nome:'Chaminé quente',     mov:37, obj:{tipo:'bau', n:5},                                        marcas:[7100,12200,17000] },
  { m:4, prof:3000, nome:'Gigantes lentos',    mov:38, obj:{tipo:'papel', padrao:'xadrez', camadas:2, cresce:4},             marcas:[11100,19000,26400] },
  { m:4, prof:3500, nome:'Pressão',            mov:22, obj:{tipo:'coletar', itens:[[0,14],[1,14],[2,14],[3,14]]},  marcas:[6300,10800,15000] },
  { m:4, prof:4000, nome:'O fundo',            mov:42, obj:{tipo:'papel', padrao:'bandejao', camadas:2},           marcas:[11200,19200,26700] }
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
const r100 = x => Math.round(x / 100) * 100;

function fase(i) {
  if (i < BASE.length) return BASE[i];
  if (geradas[i]) return geradas[i];
  const r = semente(i);
  const pos = i % CICLO, m = Math.floor(pos / 6), base = BASE[pos];
  const dif = Math.min(1, (i - CICLO) / 260);          /* aperta ao longo de umas 260 fases e para */
  const nome = ZONAS[m][(i * 7 + Math.floor(r() * 3)) % ZONAS[m].length];  /* nomes seguidos nunca repetem */
  const tipo = r() < .4 ? base.obj.tipo : ['pontos','coletar','papel','papel','bau'][Math.floor(r() * 5)];
  let mov, obj;
  if (tipo === 'pontos') {
    mov = Math.max(18, Math.round(base.mov - dif * 2 + r() * 3));
    obj = { tipo:'pontos' };
  } else if (tipo === 'coletar') {
    const n = 1 + Math.floor(r() * 4);
    mov = Math.max(18, Math.round(22 + r() * 5 - dif * 2));
    const alvo = Math.max(8, Math.round(mov * [.86,.60,.56,.60][n-1] * (.92 + .2 * dif)));
    const cores = [0,1,2,3,4,5];
    for (let k = cores.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); const t = cores[k]; cores[k] = cores[j]; cores[j] = t; }
    obj = { tipo:'coletar', itens: cores.slice(0, n).sort((a,b)=>a-b).map(c => [c, alvo]) };
  } else if (tipo === 'bau') {
    const n = 2 + Math.floor(r() * 3 + dif * 1.5);
    mov = Math.max(20, Math.round(22 + n * 3.2 - dif * 3));
    obj = { tipo:'bau', n: n };
  } else {
    const pd = PADROES_GER[Math.floor(r() * PADROES_GER.length)];
    const camadas = r() < .28 + .34 * dif ? 2 : 1;
    mov = Math.max(18, Math.round(pd[1] * (camadas === 2 ? 1.3 : 1) * (1.04 - .14 * dif)));
    obj = { tipo:'papel', padrao: pd[0], camadas: camadas };
    if (r() < .18 + .3 * dif) { obj.cresce = 4 + Math.floor(r() * 2); mov = Math.round(mov * 1.18); }
  }
  /* pontos por jogada medidos com o bot: sobem junto com o aperto da fase */
  const p50 = Math.round(mov * (tipo === 'pontos' ? 880 + 120 * dif : tipo === 'bau' ? 700 + 120 * dif : 545 + 115 * dif));
  let marcas;
  if (tipo === 'pontos') { const m0 = r100(p50 * (.50 + .06 * dif)); marcas = [m0, r100((m0 + p50) / 2), r100(p50)]; }
  else marcas = [r100(p50 * .42), r100(p50 * .72), r100(p50)];
  return (geradas[i] = { m, prof: base.prof, nome, mov, obj, marcas, exped: Math.floor(i / CICLO) + 1 });
}
const expedicao = i => Math.floor(i / CICLO) + 1;

/* ── poderes e moedas ──────────────────────────────────────────
   Nada de vidas com relógio: isso existe pra vender recarga, e
   aqui não se vende nada. O que segura o jogador é o poder que
   ele junta jogando.                                            */
const PODERES = [
  { id:'arpao',  nome:'Arpão',       texto:'Tira do tabuleiro a peça que você tocar.',        preco:60 },
  { id:'troca',  nome:'Troca livre', texto:'Troca duas peças de lugar, mesmo longe uma da outra.', preco:90 },
  { id:'giro',   nome:'Redemoinho',  texto:'Embaralha o tabuleiro inteiro sem gastar jogada.', preco:50 },
  { id:'folego', nome:'Fôlego',      texto:'Mais 5 jogadas, e dá pra usar depois que acabaram.', preco:110 }
];
const moedasDaFase = (estrelas, primeira) => 12 + 14 * estrelas + (primeira ? 20 : 0);
const hoje = () => new Date().toISOString().slice(0, 10);

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
             poderes: { arpao: 1, troca: 1, giro: 1, folego: 1 }, dia: '',
             desafio: { semana: '', melhor: 0, nome: '' } };
function carregaProg() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (cru) { const p = JSON.parse(cru); prog = Object.assign(prog, p); prog.vistos = prog.vistos || {}; prog.poderes = Object.assign({ arpao:0, troca:0, giro:0, folego:0 }, prog.poderes);
      prog.desafio = Object.assign({ semana:'', melhor:0, nome:'' }, prog.desafio); }
  } catch (e) { /* sem armazenamento: joga do mesmo jeito, só não guarda */ }
}
function salvaProg() { try { localStorage.setItem(CHAVE, JSON.stringify(prog)); } catch (e) {} }
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
  pop(n) { const f = 380 * Math.pow(1.08, Math.min(n, 12)) * this.f; this.eco(f, 0.13, 'sine', 0.16, f * 1.75); },
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
function vibra(ms) { try { if (navigator.vibrate && prog.som) navigator.vibrate(ms); } catch (e) {} }
