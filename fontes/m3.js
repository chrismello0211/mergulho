
/* ═══ DESENHO ═══════════════════════════════════════════════════ */
let CEL = 44; const GAP = 4;
const els = new Map();
let mesa, celulasBox, pecasBox, faiscasBox;

function dimensiona() {
  const area = document.querySelector('.area-jogo');
  if (!area || !area.clientHeight) return;
  const dispW = area.clientWidth - 16 - GAP * 2;
  const dispH = area.clientHeight - 12 - GAP * 2;
  CEL = Math.max(32, Math.min(Math.floor(Math.min(dispW / W, dispH / H)), 64));
  document.documentElement.style.setProperty('--cel', CEL + 'px');
  mesa.style.width = (CEL * W + GAP * 2) + 'px';
  mesa.style.height = (CEL * H + GAP * 2) + 'px';
  celulasBox.style.width = pecasBox.style.width = (CEL * W) + 'px';
  celulasBox.style.height = pecasBox.style.height = (CEL * H) + 'px';
  posicionaCasas();
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = grid[r][c]; if (!p) continue;
    const el = els.get(p.id); if (el) posiciona(el, r, c, true);
  }
}

function posicionaCasas() {
  const casas = celulasBox.children;
  for (let i = 0; i < casas.length; i++) {
    const r = (i / W) | 0, c = i % W;
    casas[i].style.transform = 'translate(' + (c * CEL) + 'px,' + (r * CEL) + 'px)';
  }
}
function montaCasas() {
  celulasBox.innerHTML = '';
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const d = document.createElement('div');
    d.className = 'casa';
    d.innerHTML = '<i></i>';
    celulasBox.appendChild(d);
  }
  pintaPapel();
  posicionaCasas();
}
function pintaPapel() {
  const casas = celulasBox.children;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const d = casas[r * W + c];
    d.classList.remove('papel', 'papel2');
    if (papel[r][c] >= 2) d.classList.add('papel2');
    else if (papel[r][c] === 1) d.classList.add('papel');
  }
}
function quebraPapel(r, c) {
  const d = celulasBox.children[r * W + c];
  d.classList.add('rasga');
  setTimeout(() => {
    d.classList.remove('rasga', 'papel', 'papel2');
    if (papel[r][c] >= 2) d.classList.add('papel2');
    else if (papel[r][c] === 1) d.classList.add('papel');
  }, 340);
}

function corpoDaPeca(p) {
  let s = '';
  if (p.sp === ARCO) s = '<svg viewBox="0 0 100 100"><use href="#s-arco"/></svg>';
  else {
    s = '<svg viewBox="0 0 100 100"><use href="#s' + p.t + '"/></svg>';
    if (p.sp === LH) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-lh"/></svg></div>';
    else if (p.sp === LV) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-lv"/></svg></div>';
    else if (p.sp === BOMBA) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-bomba"/></svg></div>';
  }
  return s;
}
function classeEsp(p) {
  return p.sp === LH ? 'esp-lh' : p.sp === LV ? 'esp-lv' : p.sp === BOMBA ? 'esp-bomba' : p.sp === ARCO ? 'esp-arco' : '';
}
function criaEl(p) {
  const el = document.createElement('div');
  el.className = 'peca ' + classeEsp(p);
  el.dataset.id = p.id;
  el.innerHTML = '<div class="corpo">' + corpoDaPeca(p) + '</div>';
  return el;
}
function atualizaEl(p) {
  const el = els.get(p.id); if (!el) return;
  el.className = 'peca ' + classeEsp(p);
  el.querySelector('.corpo').innerHTML = corpoDaPeca(p);
}
function posiciona(el, r, c, semAnim) {
  if (semAnim) {
    const t = el.style.transition; el.style.transition = 'none';
    el.style.transform = 'translate(' + (c * CEL) + 'px,' + (r * CEL) + 'px)';
    el.offsetHeight;
    el.style.transition = t;
  } else {
    el.style.transform = 'translate(' + (c * CEL) + 'px,' + (r * CEL) + 'px)';
  }
}
function sincroniza(classe) {
  const novos = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = grid[r][c]; if (!p) continue;
    if (!els.get(p.id)) {
      const el = criaEl(p);
      pecasBox.appendChild(el); els.set(p.id, el);
      posiciona(el, (p.entrando != null ? p.entrando : r), c, true);
      p.entrando = null;
      novos.push(el);
    }
  }
  if (novos.length) pecasBox.offsetHeight;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = grid[r][c]; if (!p) continue;
    const el = els.get(p.id);
    if (classe) { el.classList.add(classe); setTimeout(() => el.classList.remove(classe), 340); }
    posiciona(el, r, c);
  }
}
function montaPecas() {
  pecasBox.innerHTML = ''; els.clear();
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = grid[r][c];
    const el = criaEl(p); pecasBox.appendChild(el); els.set(p.id, el);
    posiciona(el, r, c, true);
  }
}

/* faíscas e pontinhos */
function faisca(r, c, texto, cor) {
  const d = document.createElement('div');
  d.className = 'ponto-voa';
  d.textContent = texto;
  if (cor) d.style.color = cor;
  d.style.left = (c * CEL + CEL / 2) + 'px';
  d.style.top = (r * CEL) + 'px';
  faiscasBox.appendChild(d);
  setTimeout(() => d.remove(), 1000);
}
/* respingo de quando a peça estoura: bolha subindo onde tem sol,
   fagulha de luz própria onde não tem */
function corDe(t) { const m = mundoAtual < 0 ? 0 : mundoAtual; return LUZ[m] === 'sol' ? PAL[t][m].b : PAL[t][m].c; }
function respingos(r, c, cor, n) {
  const brilho = mundoAtual >= 3;
  for (let i = 0; i < (n || 6); i++) {
    const d = document.createElement('div');
    const tam = brilho ? 3 + Math.random() * 4 : 5 + Math.random() * 7;
    d.className = brilho ? 'fagulha' : 'bolhinha';
    d.style.width = d.style.height = tam.toFixed(1) + 'px';
    if (brilho) { d.style.background = cor; d.style.boxShadow = '0 0 8px 2px ' + cor; }
    d.style.left = (c * CEL + CEL / 2 - tam / 2) + 'px';
    d.style.top = (r * CEL + CEL / 2 - tam / 2) + 'px';
    const ang = Math.random() * Math.PI * 2, dist = 16 + Math.random() * 36;
    const dx = Math.cos(ang) * dist, dy = brilho ? Math.sin(ang) * dist : Math.sin(ang) * dist * .45 - 26 - Math.random() * 30;
    d.animate([
      { transform: 'translate(0,0) scale(.5)', opacity: 1 },
      { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(1)', opacity: 0 }
    ], { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.2,.8,.4,1)' });
    faiscasBox.appendChild(d);
    setTimeout(() => d.remove(), 1050);
  }
}
const ELOGIOS = ['Boa!', 'Isso!', 'Que onda!', 'Mandou bem!', 'Maré cheia!', 'Redemoinho!'];
function faixaTexto(t) {
  const f = document.getElementById('faixa');
  f.textContent = t; f.classList.remove('mostra'); f.offsetHeight; f.classList.add('mostra');
}

/* ═══ LIMPEZA E CASCATA ═════════════════════════════════════════ */
async function limpar(conj, novos) {
  const vivas = [...conj].filter(k => grid[linha(k)][coluna(k)]);
  if (!vivas.length && !(novos && novos.length)) return false;

  let ganho = 0, temEsp = false;
  let sr = 0, sc = 0;
  for (const k of vivas) {
    const r = linha(k), c = coluna(k), p = grid[r][c];
    if (p.sp) temEsp = true;
    J.coletado[p.t]++;
    ganho += 60 * Math.min(J.cascata, 8);
    sr += r; sc += c;
    const el = els.get(p.id);
    if (el) el.classList.add('some');
    if (papel[r][c] > 0) { papel[r][c]--; J.papelFeito++; quebraPapel(r, c); }
    if (vivas.length <= 14 || Math.random() < 0.35) respingos(r, c, corDe(p.t), vivas.length > 10 ? 3 : 5);
  }
  if (vivas.length >= 6) ganho += (vivas.length - 5) * 90;
  J.pontos += ganho;

  Som.liga();
  if (temEsp || vivas.length >= 8) { Som.estoura(); mesa.classList.add('treme'); setTimeout(() => mesa.classList.remove('treme'), 340); vibra(28); }
  else { Som.pop(J.cascata); vibra(10); }

  if (vivas.length) {
    const mr = Math.round(sr / vivas.length), mc = Math.round(sc / vivas.length);
    faisca(mr, mc, '+' + ganho, J.cascata > 2 ? '#6BFFE0' : null);
  }
  if (J.cascata === 3) faixaTexto(ELOGIOS[sorteia(3) + 1]);
  if (J.cascata >= 5) faixaTexto(ELOGIOS[4 + (J.cascata >= 7 ? 1 : 0)]);

  atualizaHud();
  await espera(210);

  for (const k of vivas) {
    const r = linha(k), c = coluna(k), p = grid[r][c];
    if (!p) continue;
    const el = els.get(p.id);
    if (el) { el.remove(); els.delete(p.id); }
    grid[r][c] = null;
  }
  if (novos) for (const n of novos) {
    const r = linha(n.k), c = coluna(n.k), p = grid[r][c];
    if (!p) continue;
    p.sp = n.sp;
    atualizaEl(p);
    const el = els.get(p.id);
    if (el) { el.classList.add('nasce'); setTimeout(() => el.classList.remove('nasce'), 320); }
    Som.especial();
  }
  await espera(70);
  gravidade();
  sincroniza('cai');
  await espera(270);
  return true;
}

async function resolver(conjInicial, preferidos) {
  J.cascata = 1;
  let conj = conjInicial || null;
  let voltas = 0;
  while (voltas++ < 60) {
    let grupos = [];
    if (!conj) {
      const corridas = acharCorridas();
      if (!corridas.length) break;
      grupos = fazGrupos(corridas);
      conj = new Set();
      for (const g of grupos) for (const k of g.cells) conj.add(k);
      expandir(conj, null);
    }
    const novos = [];
    for (const g of grupos) {
      const sp = especialDoGrupo(g);
      if (sp) {
        const k = posEspecial(g, preferidos || []);
        novos.push({ k: k, sp: sp });
      }
    }
    for (const n of novos) conj.delete(n.k);
    await limpar(conj, novos);
    conj = null; preferidos = null;
    J.cascata++;
    atualizaHud();
  }
  J.cascata = 1;

  if (!temJogada()) {
    faixaTexto('Sem jogada, embaralhando');
    await espera(700);
    embaralhaModelo();
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) atualizaEl(grid[r][c]);
    sincroniza('nasce');
    await espera(400);
  }
}

/* ═══ TOQUE ═════════════════════════════════════════════════════ */
let sel = null, arrasto = null, tempoParado = null;

function celulaDe(x, y) {
  const b = celulasBox.getBoundingClientRect();
  const c = Math.floor((x - b.left) / CEL), r = Math.floor((y - b.top) / CEL);
  return dentro(r, c) ? { r: r, c: c } : null;
}
function marca(cel) {
  limpaMarca();
  sel = cel;
  if (!cel) return;
  const p = grid[cel.r][cel.c];
  if (p && els.get(p.id)) els.get(p.id).classList.add('escolhida');
}
function limpaMarca() {
  if (sel) {
    const p = grid[sel.r][sel.c];
    if (p && els.get(p.id)) els.get(p.id).classList.remove('escolhida');
  }
  sel = null;
}
function vizinhas(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1; }

function aoPressionar(e) {
  if (J.ocupado || J.fim) return;
  Som.liga();
  const cel = celulaDe(e.clientX, e.clientY);
  if (!cel) return;
  if (poderAtivo) { usaPoderNaCelula(cel); return; }
  arrasto = { x: e.clientX, y: e.clientY, cel: cel, usado: false };
  mesa.setPointerCapture && mesa.setPointerCapture(e.pointerId);
}
function aoMover(e) {
  if (!arrasto || arrasto.usado || J.ocupado) return;
  const dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y;
  const lim = CEL * 0.42;
  if (Math.abs(dx) < lim && Math.abs(dy) < lim) return;
  let alvo;
  if (Math.abs(dx) > Math.abs(dy)) alvo = { r: arrasto.cel.r, c: arrasto.cel.c + (dx > 0 ? 1 : -1) };
  else alvo = { r: arrasto.cel.r + (dy > 0 ? 1 : -1), c: arrasto.cel.c };
  arrasto.usado = true;
  if (dentro(alvo.r, alvo.c)) tentaTroca(arrasto.cel, alvo);
  arrasto = null;
}
function aoSoltar(e) {
  if (!arrasto || arrasto.usado) { arrasto = null; return; }
  const cel = arrasto.cel; arrasto = null;
  if (J.ocupado || J.fim) return;
  if (sel && sel.r === cel.r && sel.c === cel.c) { limpaMarca(); return; }
  if (sel && vizinhas(sel, cel)) { const a = sel; limpaMarca(); tentaTroca(a, cel); return; }
  marca(cel);
}

async function tentaTroca(a, b) {
  if (J.ocupado || J.fim) return;
  limpaMarca();
  const pa = grid[a.r][a.c], pb = grid[b.r][b.c];
  if (!pa || !pb) return;
  J.ocupado = true;
  reiniciaDica();

  const ea = els.get(pa.id), eb = els.get(pb.id);
  grid[a.r][a.c] = pb; grid[b.r][b.c] = pa;
  posiciona(ea, b.r, b.c); posiciona(eb, a.r, a.c);
  Som.liga(); Som.troca();
  await espera(190);

  const especial = (pa.sp === ARCO || pb.sp === ARCO) || (pa.sp && pb.sp);
  const virouCombo = temCorridaEm(a.r, a.c) || temCorridaEm(b.r, b.c);

  if (!especial && !virouCombo) {
    grid[a.r][a.c] = pa; grid[b.r][b.c] = pb;
    posiciona(ea, a.r, a.c); posiciona(eb, b.r, b.c);
    ea.classList.add('nao'); eb.classList.add('nao');
    Som.nao();
    setTimeout(() => { ea.classList.remove('nao'); eb.classList.remove('nao'); }, 360);
    await espera(320);
    J.ocupado = false;
    reiniciaDica();
    return;
  }

  gastaJogada();
  let conj = null;
  if (especial) {
    conj = comboTroca(b.r, b.c, a.r, a.c);
    atualizaEl(grid[a.r][a.c]); atualizaEl(grid[b.r][b.c]);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) atualizaEl(grid[r][c]);
    faixaTexto('Combinação!');
    vibra(40);
  }
  await resolver(conj, [chave(b.r, b.c), chave(a.r, a.c)]);
  J.ocupado = false;
  await confere();
  reiniciaDica();
}


/* ═══ PODERES NO TABULEIRO ══════════════════════════════════════
   O arpão tira uma peça e a troca livre junta duas que estão longe.
   Nenhum dos dois gasta jogada: o preço deles é o próprio poder.  */
let poderAtivo = null, poderAlvo = null;

async function usaPoderNaCelula(cel) {
  if (J.ocupado || J.fim) return;
  const p = grid[cel.r][cel.c];
  if (!p) return;

  if (poderAtivo === 'arpao') {
    gastaPoder('arpao');
    desligaPoder();
    J.ocupado = true;
    const el = els.get(p.id);
    if (el) el.classList.add('some');
    Som.liga(); Som.especial(); vibra(20);
    await limpar(new Set([chave(cel.r, cel.c)]), null);
    await resolver(null, null);
    J.ocupado = false;
    await confere();
    reiniciaDica();
    return;
  }

  if (poderAtivo === 'troca') {
    if (!poderAlvo) { poderAlvo = cel; marca(cel); Som.troca(); return; }
    if (poderAlvo.r === cel.r && poderAlvo.c === cel.c) { limpaMarca(); poderAlvo = null; return; }
    const a = poderAlvo; poderAlvo = null; limpaMarca();
    gastaPoder('troca');
    desligaPoder();
    J.ocupado = true;
    const pa = grid[a.r][a.c], pb = grid[cel.r][cel.c];
    grid[a.r][a.c] = pb; grid[cel.r][cel.c] = pa;
    posiciona(els.get(pa.id), cel.r, cel.c); posiciona(els.get(pb.id), a.r, a.c);
    Som.liga(); Som.troca();
    await espera(230);
    let conj = null;
    if ((pa.sp === ARCO || pb.sp === ARCO) || (pa.sp && pb.sp)) {
      conj = comboTroca(cel.r, cel.c, a.r, a.c);
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) atualizaEl(grid[r][c]);
      faixaTexto('Combinação!');
      vibra(40);
    }
    await resolver(conj, [chave(cel.r, cel.c), chave(a.r, a.c)]);
    J.ocupado = false;
    await confere();
    reiniciaDica();
  }
}

/* redemoinho: embaralha sem gastar jogada */
async function giroAgora() {
  J.ocupado = true;
  desligaPoder();
  Som.liga(); Som.especial(); vibra(30);
  faixaTexto('Redemoinho!');
  embaralhaModelo();
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) atualizaEl(grid[r][c]);
  sincroniza('nasce');
  await espera(420);
  await resolver(null, null);
  J.ocupado = false;
  await confere();
  reiniciaDica();
}

/* ═══ DICA ══════════════════════════════════════════════════════ */
let dicaTimer = null, dicaAtiva = [];
function reiniciaDica() {
  apagaDica();
  clearTimeout(dicaTimer);
  if (J.fim) return;
  dicaTimer = setTimeout(mostraDica, 6000);
}
function mostraDica() {
  if (J.ocupado || J.fim) { reiniciaDica(); return; }
  const j = achaJogada(); if (!j) return;
  const alvos = [grid[j[0]][j[1]], grid[j[2]][j[3]]];
  for (const p of alvos) {
    if (!p) continue;
    const el = els.get(p.id);
    if (el) { el.classList.add('dica'); dicaAtiva.push(el); }
  }
}
function apagaDica() { dicaAtiva.forEach(e => e.classList.remove('dica')); dicaAtiva = []; }
