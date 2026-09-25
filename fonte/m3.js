
/* ═══ DESENHO ═══════════════════════════════════════════════════ */
let CEL = 44; const GAP = 4;
const els = new Map();
let mesa, celulasBox, pecasBox, faiscasBox;

function dimensiona() {
  const area = document.querySelector('.area-jogo');
  if (!area || !area.clientHeight) return;
  const dispW = area.clientWidth - 16 - GAP * 2;
  const dispH = area.clientHeight - 12 - GAP * 2;
  const teto = Math.min(window.innerWidth, window.innerHeight) >= 700 ? 72 : 64;   /* tablet merece peça maior */
  CEL = Math.max(32, Math.min(Math.floor(Math.min(dispW / W, dispH / H)), teto));
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
    d.className = 'casa' + (r === H - 1 ? ' fundo' : '') + (r < TOPO[c] ? ' fora' : '');
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
    if (papel[r][c] >= 3) d.classList.add('papel3');
    else if (papel[r][c] === 2) d.classList.add('papel2');
    else if (papel[r][c] === 1) d.classList.add('papel');
  }
  if (typeof pintaCasasEspeciais === 'function' && J) pintaCasasEspeciais();   /* ostra, coral e selos de cobertura sobrevivem a qualquer repintura */
}
function quebraPapel(r, c) {
  const d = celulasBox.children[r * W + c];
  d.classList.add('rasga');
  setTimeout(() => {
    d.classList.remove('rasga', 'papel', 'papel2', 'papel3');
    if (papel[r][c] >= 3) d.classList.add('papel3');
    else if (papel[r][c] === 2) d.classList.add('papel2');
    else if (papel[r][c] === 1) d.classList.add('papel');
    marcaCasas();
  }, 340);
}

function corpoDaPeca(p) {
  let s = '';
  if (p.bau) return '<svg viewBox="0 0 100 100"><use href="#i-bau"/></svg>';
  if (p.lixo) return '<svg viewBox="0 0 100 100"><use href="#i-lixo' + (p.id % 3) + '"/></svg>';
  if (p.sp === ARCO) s = '<svg viewBox="0 0 100 100"><use href="#s-arco"/></svg>';
  else {
    s = '<svg viewBox="0 0 100 100"><use href="#s' + p.t + ['', 'b', 'c'][p.id % 3] + '"/></svg>';
    if (p.sp === LH) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-lh"/></svg></div>';
    else if (p.sp === LV) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-lv"/></svg></div>';
    else if (p.sp === BOMBA) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-bomba"/></svg></div>';
    else if (p.sp === ONDA) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-onda"/></svg></div>';
    else if (p.sp === ONDAV) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-ondav"/></svg></div>';
    else if (p.sp === CARDUME) s += '<div class="capa"><svg viewBox="0 0 100 100"><use href="#sp-cardume"/></svg></div>';
  }
  return s;
}
function classeEsp(p) {
  if (p.bau) return 'e-bau';
  if (p.lixo) return 'lixo' + (p.lixo >= 2 ? ' lixo2' : '');
  if (p.gaiola) return 'preso' + (p.gaiola >= 2 ? ' preso2' : '');
  if (p.bolha) return 'com-bolha';
  return p.sp === LH ? 'esp-lh' : p.sp === LV ? 'esp-lv' : p.sp === BOMBA ? 'esp-bomba' : p.sp === ARCO ? 'esp-arco'
       : p.sp === ONDA || p.sp === ONDAV ? 'esp-onda' : p.sp === CARDUME ? 'esp-cardume' : '';
}
function criaEl(p) {
  /* cada peça respira num tempo diferente: o tabuleiro fica vivo sem piscar junto */
  const el = document.createElement('div');
  el.className = 'peca ' + classeEsp(p);
  el.dataset.id = p.id;
  el.style.setProperty('--atraso', (((p.id * 37) % 34) / 10).toFixed(1) + 's');
  el.innerHTML = '<div class="corpo">' + corpoDaPeca(p) + '</div>';
  return el;
}
function atualizaEl(p) {
  if (!p) return;                        /* casa fora do formato */
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
    if (!p) continue;                      /* casa fora do formato */
    const el = criaEl(p); pecasBox.appendChild(el); els.set(p.id, el);
    posiciona(el, r, c, true);
    if (typeof el.firstChild.animate === 'function')
      el.firstChild.animate([{ transform: 'scale(0) rotate(-40deg)', opacity: 0 }, { transform: 'scale(1) rotate(0)', opacity: 1 }],
        { duration: 340, delay: (r + c) * 22, easing: 'cubic-bezier(.2,1.6,.4,1)', fill: 'backwards' });
  }
  if (typeof pintaNinhos === 'function') pintaNinhos();   /* ninho sempre por cima, em qualquer redesenho */
}


/* ═══ EFEITOS ═══════════════════════════════════════════════════
   Tudo aqui é curto e some sozinho. A regra: quanto maior a
   jogada, mais camadas entram (luz, onda, estilhaço, tremor).   */
/* Safari velho não tem element.animate: nesses o efeito só não aparece */
function anima(el, quadros, opcoes) {
  if (typeof el.animate !== 'function') { el.style.opacity = '0'; return null; }
  try { return el.animate(quadros, opcoes); } catch (e) { el.style.opacity = '0'; return null; }
}
function solta(el, ms, onde) {
  const caixa = onde || faiscasBox;
  if (caixa === faiscasBox && caixa.childElementCount > 150) return;   /* teto pra não engasgar celular fraco */
  caixa.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function raioLinha(r, c, deitado) {
  const d = document.createElement('div');
  d.className = 'fx-raio' + (deitado ? '' : ' v');
  if (deitado) { d.style.left = '0px'; d.style.top = (r * CEL) + 'px'; d.style.width = (W * CEL) + 'px'; d.style.height = CEL + 'px'; }
  else { d.style.top = '0px'; d.style.left = (c * CEL) + 'px'; d.style.height = (H * CEL) + 'px'; d.style.width = CEL + 'px'; }
  solta(d, 980);
}
function ondaChoque(r, c, tam, cor) {
  const d = document.createElement('div'), s = tam * CEL;
  d.className = 'fx-onda';
  d.style.width = d.style.height = s + 'px';
  d.style.left = (c * CEL + CEL / 2 - s / 2) + 'px';
  d.style.top = (r * CEL + CEL / 2 - s / 2) + 'px';
  if (cor) d.style.borderColor = cor;
  solta(d, 1020);
}
function feixePerola(r, c, alvos) {
  for (const k of alvos.slice(0, 14)) {
    const ar = linha(k), ac = coluna(k);
    const x1 = c * CEL + CEL / 2, y1 = r * CEL + CEL / 2;
    const dx = ac * CEL + CEL / 2 - x1, dy = ar * CEL + CEL / 2 - y1;
    const d = document.createElement('div');
    d.className = 'fx-feixe';
    d.style.left = x1 + 'px'; d.style.top = (y1 - 2) + 'px';
    d.style.width = Math.hypot(dx, dy) + 'px';
    d.style.transform = 'rotate(' + (Math.atan2(dy, dx) * 180 / Math.PI) + 'deg)';
    solta(d, 860);
  }
}
function estilhacos(r, c, cor, n) {
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'estilhaco';
    const t = 4 + Math.random() * 7;
    d.style.width = t + 'px'; d.style.height = (t * (.5 + Math.random())) + 'px';
    d.style.background = cor;
    d.style.left = (c * CEL + CEL / 2) + 'px';
    d.style.top = (r * CEL + CEL / 2) + 'px';
    const ang = Math.random() * Math.PI * 2, dist = 22 + Math.random() * 60;
    anima(d, [
      { transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 },
      { transform: 'translate(' + (Math.cos(ang) * dist - 50) + '%,' + (Math.sin(ang) * dist + 40) + '%) rotate(' + (Math.random() * 720 - 360) + 'deg) scale(.3)', opacity: 0 }
    ], { duration: 520 + Math.random() * 420, easing: 'cubic-bezier(.15,.7,.4,1)' });
    solta(d, 950);
  }
}
function clarao(cor) {
  const f = document.getElementById('clarao');
  if (!f) return;
  f.style.background = 'radial-gradient(circle at 50% 52%, ' + cor + ', transparent 68%)';
  f.classList.remove('bate'); void f.offsetWidth; f.classList.add('bate');
}
function tremeTela(nivel) {
  mesa.classList.remove('treme', 'treme2', 'treme3');
  void mesa.offsetWidth;
  mesa.classList.add(nivel >= 3 ? 'treme3' : nivel === 2 ? 'treme2' : 'treme');
  setTimeout(() => mesa.classList.remove('treme', 'treme2', 'treme3'), 440);
}
function chipCombo(n) {
  const el = document.getElementById('combo');
  if (!el) return;
  el.textContent = 'x' + n;
  el.className = 'combo n' + Math.min(n, 6);
  void el.offsetWidth;
  el.classList.add('mostra');
  clearTimeout(chipCombo.t);
  chipCombo.t = setTimeout(() => el.classList.remove('mostra'), 950);
}
/* fogos para a vitória: acontecem por cima de tudo */
function fogos(n) {
  const tela = document.getElementById('fx-tela');
  if (!tela) return;
  const cores = ['#6BFFE0', '#FFD35C', '#FF7390', '#9A5CFF', '#5CFF9E', '#5CB4FF'];
  for (let i = 0; i < n; i++) setTimeout(() => {
    const x = 12 + Math.random() * 76, y = 18 + Math.random() * 50, cor = cores[i % cores.length];
    for (let j = 0; j < 14; j++) {
      const d = document.createElement('div');
      d.className = 'fagulha';
      d.style.width = d.style.height = (4 + Math.random() * 5) + 'px';
      d.style.left = x + '%'; d.style.top = y + '%';
      d.style.background = cor; d.style.boxShadow = '0 0 10px 3px ' + cor;
      const a = (j / 14) * Math.PI * 2, dist = 50 + Math.random() * 90;
      anima(d, [{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
                 { transform: 'translate(' + (Math.cos(a) * dist) + 'px,' + (Math.sin(a) * dist + 30) + 'px) scale(.2)', opacity: 0 }],
                { duration: 800 + Math.random() * 300, easing: 'cubic-bezier(.1,.8,.3,1)' });
      solta(d, 1200, tela);
    }
    Som.liga(); Som.sobe(i % 4);
  }, i * 260);
}

/* faíscas e pontinhos */
function faisca(r, c, texto, cor, grande) {
  const d = document.createElement('div');
  d.className = 'ponto-voa' + (grande ? ' grande' : '');
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
    anima(d, [
      { transform: 'translate(0,0) scale(.5)', opacity: 1 },
      { transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(1)', opacity: 0 }
    ], { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.2,.8,.4,1)' });
    solta(d, 1050);
  }
}
const ELOGIOS = ['Boa!', 'Isso!', 'Que onda!', 'Mandou bem!', 'Maré cheia!', 'Redemoinho!'];
let faixaTimer = null;
function faixaTexto(t, ms) {
  const f = document.getElementById('faixa');
  f.textContent = t;
  f.classList.remove('mostra'); f.offsetHeight; f.classList.add('mostra');
  clearTimeout(faixaTimer);
  faixaTimer = setTimeout(() => f.classList.remove('mostra'), ms || 2200);
}

/* ═══ O BAÚ CHEGANDO AO FUNDO ═══════════════════════════════════
   Quem encosta na última fileira já saiu: desce escorregando,
   solta faísca dourada e vale 500.                               */
async function entregaBaus() {
  const saem = [];
  for (let c = 0; c < W; c++) { const p = grid[H - 1][c]; if (p && p.bau) saem.push([c, p]); }
  if (!saem.length) return false;
  for (const [c, p] of saem) {
    const el = els.get(p.id);
    if (el) { el.classList.add('entrega'); const e = el; setTimeout(() => e.remove(), 560); }
    els.delete(p.id);
    grid[H - 1][c] = null;
    J.bauFeito++; J.bauNaTela = Math.max(0, J.bauNaTela - 1); J.bauParado = 0;
    J.pontos += 500;
    faisca(H - 1, c, '+500', '#FFD35C', true);
    respingos(H - 1, c, '#FFD35C', 10);
    estilhacos(H - 1, c, '#FFD35C', 8);
    ondaChoque(H - 1, c, 3.4, '#FFD35C');
  }
  Som.liga(); Som.bau(); vibra(TREMIDA.bau); clarao('rgba(255,211,92,.35)'); tremeTela(2);
  atualizaHud();
  await espera(460);
  gravidade();
  sincroniza('cai');
  await espera(280);
  return true;
}

/* ═══ LIMPEZA E CASCATA ═════════════════════════════════════════ */
async function limpar(conj, novos) {
  const vivas = [...conj].filter(k => { const p = grid[linha(k)][coluna(k)]; return p && !p.bau; });
  if (!vivas.length && !(novos && novos.length)) return false;

  let ganho = 0, temEsp = false;
  let sr = 0, sc = 0;
  for (const k of vivas) {
    const r = linha(k), c = coluna(k), p = grid[r][c];
    if (p.sp) temEsp = true;
    J.coletado[p.t]++;
    ganho += 60 * Math.min(J.cascata, 10) * (J.soltoSozinho && J.cascata === 1 ? .5 : 1);
    sr += r; sc += c;
    const el = els.get(p.id);
    if (el) el.classList.add('some');
    if (papel[r][c] > 0) { papel[r][c]--; J.papelFeito++; quebraPapel(r, c); if (faseAtual().obj.mancha) J.limpouMancha = true; J.limpouAlga = true; }
    /* pérola: primeiro estouro abre a ostra, o segundo colhe */
    if (J.perolas && J.perolas[r][c] > 0) {
      J.perolas[r][c]--;
      if (J.perolas[r][c] === 0) { J.perolasFeitas = (J.perolasFeitas || 0) + 1; J.pontos += 250; voaPerola(r, c); }
      else { estilhacos(r, c, '#F3E9FF', 6); }
      marcaCasas();
    }
    /* coral: estourar em cima ou do lado devolve a cor */
    if (J.coral) for (const [dr, dc] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]) {
      const y = r + dr, x = c + dc;
      if (!temCasa(y, x) || J.coral[y][x] !== 1) continue;
      J.coral[y][x] = 2; J.coralFeito = (J.coralFeito || 0) + 1; J.pontos += 90;
      estilhacos(y, x, ['#FF7AA8', '#FFB36B', '#B98CFF'][(y + x) % 3], 7);
      marcaCasas();
    }
    /* lixo: estouro colado desgasta; no último, some do tabuleiro */
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const y = r + dr, x = c + dc;
      const q = dentro(y, x) ? grid[y][x] : null;
      if (!q || !q.lixo) continue;
      q.lixo--;
      if (q.lixo <= 0) tiraLixo(y, x, q); else atualizaEl(q);
    }
    if (p && p.lixo) { p.lixo = 0; J.lixoFeito = (J.lixoFeito || 0) + 1; J.pontos += 200; }   /* especial acertou o lixo em cheio */
    /* estourar colado no ninho machuca ele */
    if (J.ninhos) for (const n of J.ninhos) {
      if (n.vida <= 0 || Math.abs(n.r - r) + Math.abs(n.c - c) !== 1) continue;
      n.vida--; n.bateu = true;
      if (n.vida <= 0) derrubaNinho(n);
    }
    /* estourar do lado abre a gaiola do bicho preso */
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const q = dentro(r + dr, c + dc) ? grid[r + dr][c + dc] : null;
      if (!q || !q.gaiola) continue;
      q.gaiola--;
      if (q.gaiola <= 0) {
        q.gaiola = 0;
        J.presosFeitos = (J.presosFeitos || 0) + 1;
        J.pontos += 220;
        estilhacos(r + dr, c + dc, '#BFF5EE', 10);
        ondaChoque(r + dr, c + dc, 2, '#BFF5EE');
        Som.liga(); Som.especial();
      }
      atualizaEl(q);
    }
    if (p && p.bolha) { J.bolhasFeitas = (J.bolhasFeitas || 0) + 1; J.pontos += 160; }
    /* briga com o mestre: casa limpa machuca, casa com tinta não */
    if (faseAtual().obj.tipo === 'chefe' && papel[r][c] === 0) {
      J.dano = (J.dano || 0) + (p && p.sp ? 3 : 1);
      J.bateu = true;
    }
    if (vivas.length <= 14 || Math.random() < 0.5) {
      respingos(r, c, corDe(p.t), vivas.length > 10 ? 4 : 7);
      estilhacos(r, c, corDe(p.t), vivas.length > 12 ? 2 : 4);
    }
  }
  if (vivas.length >= 6) ganho += (vivas.length - 5) * 90;
  if (novos) for (const n of novos) { ganho += VALOR_NASCE[n.sp] || 0; J.criados = (J.criados || 0) + 1; }   /* criar especial paga e conta objetivo */
  const bonus = bonusEspeciais;
  bonusEspeciais = 0;
  ganho += bonus;
  J.pontos += ganho;

  Som.liga();
  /* cada especial que disparou desenha o próprio estrago */
  let peso = vivas.length >= 8 ? 2 : 1;
  for (const e of efeitosPendentes) {
    if (e.vale) faisca(e.r, e.c, '+' + e.vale, '#FFE7A3', e.vale >= 900);
    if (e.sp === LH) { raioLinha(e.r, e.c, true); Som.raio(); peso = Math.max(peso, 2); }
    else if (e.sp === LV) { raioLinha(e.r, e.c, false); Som.raio(); peso = Math.max(peso, 2); }
    else if (e.sp === BOMBA) {
      ondaChoque(e.r, e.c, e.tam || 6.2, '#FFE7A3');
      setTimeout(() => ondaChoque(e.r, e.c, (e.tam || 6.2) * .6, '#FF9A5C'), 110);
      estilhacos(e.r, e.c, '#FFD35C', 14);
      Som.bomba(); clarao('rgba(255,231,163,.55)'); peso = 3;
    }
    else if (e.sp === 'tudo') {
      Som.combo(); clarao('rgba(255,255,255,.6)');
      [0, 200, 400].forEach((d, i) => setTimeout(() => ondaChoque(3 + i, 3, 7 + i * 2, ['#fff', '#6BFFE0', '#FFD35C'][i]), d));
      faixaTexto('Tudo!');
      peso = 3;
    }
    else if (e.sp === ONDA) {
      for (let d = -1; d <= 1; d++) if (e.r + d >= 0 && e.r + d < H) setTimeout(() => raioLinha(e.r + d, e.c, true), Math.abs(d) * 90);
      Som.raio(); setTimeout(() => Som.raio(), 130); clarao('rgba(191,245,238,.4)'); peso = 3;
    } else if (e.sp === ONDAV) {
      for (let d = -1; d <= 1; d++) if (e.c + d >= 0 && e.c + d < W) setTimeout(() => raioLinha(e.r, e.c + d, false), Math.abs(d) * 90);
      Som.raio(); setTimeout(() => Som.raio(), 130); clarao('rgba(191,245,238,.4)'); peso = 3;
    } else if (e.sp === CARDUME && e.alvos) {
      feixePerola(e.r, e.c, e.alvos);
      estilhacos(e.r, e.c, '#BFF5EE', 10);
      Som.especial(); setTimeout(() => Som.pop(6), 160); peso = Math.max(peso, 2);
    } else if (e.sp === ARCO && e.alvos) { feixePerola(e.r, e.c, e.alvos); ondaChoque(e.r, e.c, 4, '#CFE9FF'); Som.combo(); clarao('rgba(207,233,255,.5)'); peso = 3; }
  }
  efeitosPendentes.length = 0;

  if (temEsp || vivas.length >= 8) {
    Som.estoura(); tremeTela(peso); vibra(peso >= 3 ? TREMIDA.combo : TREMIDA.especial);
    if (peso >= 2) clarao('rgba(107,255,224,.28)');
  } else {
    Som.pop(J.cascata); vibra(vivas.length >= 5 ? TREMIDA.grande : TREMIDA.combina);
    if (vivas.length >= 5) tremeTela(1);
  }
  if (J.cascata >= 2) {
    chipCombo(J.cascata);
    Musica.tensao(J.mov <= 5, J.cascata);
    mesa.classList.remove('pulsa'); void mesa.offsetWidth; mesa.classList.add('pulsa');
    setTimeout(() => mesa.classList.remove('pulsa'), 600);
  }
  if (J.cascata >= 4) { clarao('rgba(255,211,92,.3)'); tremeTela(3); }

  if (vivas.length) {
    const mr = Math.round(sr / vivas.length), mc = Math.round(sc / vivas.length);
    faisca(mr, mc, '+' + ganho, J.cascata > 2 ? '#6BFFE0' : null, ganho >= 600 || J.cascata >= 3);
    if (ganho >= 900) ondaChoque(mr, mc, 3.2, '#FFD35C');
  }
  if (J.cascata === 3) faixaTexto(ELOGIOS[sorteia(3) + 1]);
  if (J.cascata >= 5) faixaTexto(ELOGIOS[4 + (J.cascata >= 7 ? 1 : 0)]);

  atualizaHud();
  await espera(peso >= 3 ? 470 : peso >= 2 ? 360 : 230);

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
  await espera(peso >= 2 ? 170 : 90);
  gravidade();
  sincroniza('cai');
  Som.cai(Math.min(J.cascata, 6));
  await espera(peso >= 2 ? 340 : 280);
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
      if (!corridas.length) { if (await entregaBaus()) continue; break; }
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
    faixaTexto('Sem jogada à vista: embaralhando o tabuleiro', 2600);
    await espera(1100);
    embaralhaModelo();
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) atualizaEl(grid[r][c]);
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
  if (sel && sel.r === cel.r && sel.c === cel.c) {
    const p = grid[cel.r][cel.c];
    limpaMarca();
    if (p && p.sp) disparaEspecial(cel);   /* dois toques no especial: ele estoura sozinho */
    return;
  }
  if (sel && vizinhas(sel, cel)) { const a = sel; limpaMarca(); tentaTroca(a, cel); return; }
  marca(cel);
}

/* se algo quebrar no meio, nenhuma casa pode ficar vazia */
function reparaTabuleiro() {
  try {
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (temCasa(r, c) && !grid[r][c]) grid[r][c] = novaPeca(tipoSeguro(r, c));
    montaPecas(); pintaPapel();
  } catch (e2) { console.error('reparo falhou:', e2); }
}
async function tentaTroca(a, b) {
  try { return await tentaTrocaInterna(a, b); }
  catch (e) {
    /* se algo der errado no meio da jogada, o tabuleiro volta a
       responder em vez de congelar. O erro aparece no console.   */
    console.error('erro na jogada:', e);
    reparaTabuleiro();
    J.ocupado = false;
    faixaTexto('Deu um tranco, mas pode continuar', 2600);
    try { sincroniza('nasce'); atualizaHud(); } catch (e2) {}
    return false;
  }
}
async function tentaTrocaInterna(a, b) {
  J.soltoSozinho = false;
  J.limpouMancha = false;
  J.limpouAlga = false;
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
  const temBau = (pa.bau || pb.bau) && a.r === b.r;   /* empurrar o baú de lado vale; descer na mão, não */
  /* especial não precisa de combinação: trocar ele com qualquer vizinha já dispara */
  const soltaEsp = !especial && !virouCombo && !temBau && !!(pa.sp || pb.sp);

  if (!especial && !virouCombo && !temBau && !soltaEsp) {
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
  if (soltaEsp) {
    J.soltoSozinho = true;    /* disparar o especial sem casar cor paga menos */
    const alvo = pa.sp ? b : a;                 /* a peça especial está no lugar novo */
    conj = new Set([chave(alvo.r, alvo.c)]);
    expandir(conj, null);
    vibra(TREMIDA.especial);
  } else if (especial) {
    conj = comboTroca(b.r, b.c, a.r, a.c);
    atualizaEl(grid[a.r][a.c]); atualizaEl(grid[b.r][b.c]);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) atualizaEl(grid[r][c]);
    faixaTexto('Combinação!');
    vibra(40);
  }
  await resolver(conj, [chave(b.r, b.c), chave(a.r, a.c)]);
  passoCrescer();
  await passoBau();
  await passoBolha();
  garanteBolhas();
  garantePresos();
  passoNinho();
  if (J.mudouCasas) pintaCasasEspeciais();
  await passoMestre();
  salvaPartida();
  J.ocupado = false;
  await confere();
  reiniciaDica();
}

async function disparaEspecial(cel) {
  const p = grid[cel.r][cel.c];
  if (!p || !p.sp || J.ocupado || J.fim) return;
  J.ocupado = true;
  reiniciaDica();
  gastaJogada();
  Som.liga(); Som.especial(); vibra(TREMIDA.especial);
  const conj = new Set([chave(cel.r, cel.c)]);
  expandir(conj, null);
  await resolver(conj, [chave(cel.r, cel.c)]);
  passoCrescer();
  await passoBau();
  await passoBolha();
  garanteBolhas();
  garantePresos();
  await passoMestre();
  salvaPartida();
  J.ocupado = false;
  await confere();
  reiniciaDica();
}

/* guarda a partida a cada jogada: se o celular matar o app, volta igual */
function salvaPartida() {
  if (!J || J.fim || J.desafio || J.fase == null || J.fase < 0) return;
  try {
    localStorage.setItem(CHAVE_PARTIDA, JSON.stringify({
      f: J.fase, mov: J.mov, pontos: J.pontos, col: J.coletado,
      pt: J.papelTotal, pf: J.papelFeito, bf: J.bauFeito, bn: J.bauNaTela, bp: J.bauPendentes,
      cc: J.contaCresce, ac: J.alvoCresce, cr: J.criados, papel: papel, base: J.papelBase,
      topo: TOPO.slice(),
      pr: J.presosFeitos || 0, bo: J.bolhasFeitas || 0, bfg: J.bolhasFugiram || 0,
      nin: J.ninhos || null, ninf: J.ninhosFeitos || 0,
      per: J.perolas || null, pef: J.perolasFeitas || 0, cor: J.coral || null, cof: J.coralFeito || 0, lxf: J.lixoFeito || 0,
      dn: J.dano || 0, cm: J.contaMestre || 0, cb: J.contaBolha || 0, bpa: J.bauParado || 0,
      g: grid.map(l => l.map(p => p ? (p.bau ? 'b' : p.t + '.' + p.sp + '.' + (p.gaiola || 0) + '.' + (p.bolha ? 1 : 0) + '.' + (p.lixo || 0)) : ''))
    }));
  } catch (e) { /* sem espaço: só não guarda */ }
}

/* fim de fase: o que sobrou de especial no tabuleiro estoura tudo,
   um atrás do outro, antes de aparecer o cartão de vitória.      */
async function estouroFinal() {
  let explodiu = false;
  /* varre mais de uma vez: estourar um especial pode criar outro,
     e o cartão não pode entrar por cima da luz ainda acesa.      */
  for (let volta = 0; volta < 3; volta++) {
    const sobrou = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++)
      if (grid[r][c] && grid[r][c].sp) sobrou.push([r, c]);
    if (!sobrou.length) break;
    if (!explodiu) { faixaTexto('Arrastão final!', 2000); await espera(420); }
    explodiu = true;
    for (const [r, c] of sobrou) {
      const p = grid[r][c];
      if (!p || !p.sp) continue;
      const conj = new Set([chave(r, c)]);
      expandir(conj, null);
      await limpar(conj, null);
      await resolver(null, null);
      await espera(180);
    }
  }
  if (explodiu) await espera(900);   /* deixa o brilho terminar antes do cartão */
  return explodiu;
}


/* o baú é pesado: a cada 4 jogadas ele afunda uma casa sozinho.
   Sem isso ele encalha na penúltima fileira, que quase nunca limpa. */
async function passoBau() {
  const f = faseAtual();
  if (f.obj.tipo !== 'bau' || J.fim) return false;
  /* Antes ele afundava de quatro em quatro jogadas, e isso virou
     espera: dava pra mexer peça à toa até o baú descer sozinho.
     Agora é só rede de segurança: se você mesmo fez o baú andar,
     o contador zera e ele nunca desce de graça.                  */
  J.bauParado = (J.bauParado || 0) + 1;
  if (J.bauParado < 6) return false;
  J.bauParado = 0;
  let afundou = false;
  for (let r = H - 2; r >= 0; r--) for (let c = 0; c < W; c++) {
    const p = grid[r][c], baixo = grid[r + 1][c];
    if (!p || !p.bau || !baixo || baixo.bau) continue;
    grid[r + 1][c] = p; grid[r][c] = baixo;
    posiciona(els.get(p.id), r + 1, c); posiciona(els.get(baixo.id), r, c);
    respingos(r, c, '#FFD35C', 4);
    afundou = true;
  }
  if (afundou) {
    Som.liga(); Som.cai(3); vibra(TREMIDA.toque);
    faixaTexto('O baú é pesado e escorrega');
    await espera(340);
    await resolver(null, null);
  }
  return afundou;
}

/* ═══ O MESTRE REVIDA ═══════════════════════════════════════════
   De duas em duas jogadas ele rouba uma jogada e cospe tinta. A
   casa com tinta protege ele, então limpar a tinta é parte da
   briga. Quanto mais machucado, mais tinta ele cospe.            */
async function passoMestre() {
  const f = faseAtual();
  if (f.obj.tipo !== 'chefe' || J.fim) return false;
  if (J.bateu) { sacodeMestre(); J.bateu = false; }
  J.contaMestre = (J.contaMestre || 0) + 1;
  if (J.contaMestre % (f.obj.golpe || 2) !== 0) { atualizaHud(); return false; }
  const vida = Math.max(0, f.obj.vida - (J.dano || 0));
  if (vida <= 0) return false;
  const fase3 = vida < f.obj.vida * .35, fase2 = vida < f.obj.vida * .65;
  const quantas = fase3 ? 7 : fase2 ? 5 : 3;
  const livres = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (papel[r][c] === 0 && temCasa(r, c)) livres.push([r, c]);
  for (let k = 0; k < quantas && livres.length; k++) {
    const idx = sorteia(livres.length), [r, c] = livres.splice(idx, 1)[0];
    papel[r][c] = 1;
    const casa = celulasBox.children[r * W + c];
    casa.classList.add('cresceu');
    setTimeout(() => casa.classList.remove('cresceu'), 520);
  }
  pintaPapel();
  J.mov = Math.max(0, J.mov - (fase3 ? 2 : 1));
  Som.liga(); Som.nao(); vibra(TREMIDA.forte);
  tremeTela();
  faixaTexto(fase3 ? 'O mestre está furioso: duas jogadas a menos!' : 'O mestre cospe tinta', 2000);
  const ret = document.querySelector('.retrato-mestre');
  if (ret) { ret.classList.remove('ataca'); void ret.offsetWidth; ret.classList.add('ataca'); }
  /* o golpe agora acontece na tela toda, não só no retratinho */
  const tela = document.getElementById('golpe-mestre');
  if (tela) { tela.classList.remove('bate'); void tela.offsetWidth; tela.classList.add('bate'); }
  if (!prog.leve) {
    const r0 = ret ? ret.getBoundingClientRect() : { left: innerWidth / 2, top: 120, width: 40, height: 40 };
    for (let k = 0; k < 10; k++) {
      const g = document.createElement('i');
      g.className = 'tinta-voa';
      g.style.left = (r0.left + r0.width / 2) + 'px';
      g.style.top = (r0.top + r0.height / 2) + 'px';
      g.style.setProperty('--dx', (Math.cos(k / 10 * 6.28) * (80 + Math.random() * 160)).toFixed(0) + 'px');
      g.style.setProperty('--dy', (60 + Math.random() * 260).toFixed(0) + 'px');
      document.body.appendChild(g);
      setTimeout(() => g.remove(), 900);
    }
  }
  atualizaHud();
  await espera(420);
  return true;
}
function sacodeMestre() {
  const ret = document.querySelector('.retrato-mestre');
  if (!ret) return;
  ret.classList.remove('apanha'); void ret.offsetWidth; ret.classList.add('apanha');
}

/* ═══ BOLHAS DE AR ══════════════════════════════════════════════
   Sobem uma casa a cada duas jogadas. Chegando na superfície,
   escapam e uma nova nasce lá embaixo.                           */
async function passoBolha() {
  const f = faseAtual();
  if (f.obj.tipo !== 'bolhas' || J.fim) return false;
  J.contaBolha = (J.contaBolha || 0) + 1;
  if (J.contaBolha % (f.obj.sobe || 2) !== 0) return false;
  let mexeu = false, fugiu = 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = grid[r][c];
    if (!p || !p.bolha || p.subiuAgora) continue;
    if (r === 0) {
      p.bolha = false;
      fugiu++;
      const el = els.get(p.id);
      if (el) { el.classList.remove('com-bolha'); }
      respingos(r, c, '#BFF5EE', 6);
      atualizaEl(p);
      continue;
    }
    const cima = grid[r - 1][c];
    if (!cima || cima.bau || cima.gaiola || cima.bolha) continue;
    grid[r - 1][c] = p; grid[r][c] = cima;
    p.subiuAgora = true;
    posiciona(els.get(p.id), r - 1, c); posiciona(els.get(cima.id), r, c);
    mexeu = true;
  }
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c]) grid[r][c].subiuAgora = false;
  if (fugiu) {
    J.bolhasFugiram = (J.bolhasFugiram || 0) + fugiu;
    Som.liga(); Som.nao();
    faixaTexto(fugiu === 1 ? 'Uma bolha escapou' : fugiu + ' bolhas escaparam');
    nasceBolha(fugiu);
    atualizaHud();
  }
  if (mexeu) {
    Som.liga(); Som.pop(2);
    await espera(280);
    await resolver(null, null);
  }
  return mexeu;
}

/* ═══ ALGA QUE VOLTA A CRESCER ══════════════════════════════════
   A casa marcada cresce na jogada seguinte, nunca sem aviso, e
   nunca nas três últimas jogadas: dá pra reagir.                 */
function pintaAvisoCresce() {
  celulasBox.querySelectorAll('.vai-crescer').forEach(e => e.classList.remove('vai-crescer'));
  if (J.alvoCresce) celulasBox.children[J.alvoCresce[0] * W + J.alvoCresce[1]].classList.add('vai-crescer');
}
/* ═══ PÉROLAS, LIXO E CORAL ══════════════════════════════════════ */
/* ostra abre e coral acende no mesmo instante do estouro */
let casasAgendadas = false;
function marcaCasas() {
  J.mudouCasas = true;
  if (casasAgendadas) return;
  casasAgendadas = true;
  requestAnimationFrame(() => { casasAgendadas = false; pintaCasasEspeciais(); });
}
function pintaCasasEspeciais() {
  /* ostra e coral ficam numa camada acima das peças, no canto da casa,
     pra aparecer sem esconder o bicho que está em cima */
  let caixa = document.getElementById('marcas');
  if (!caixa) { caixa = document.createElement('div'); caixa.id = 'marcas'; mesa.appendChild(caixa); }
  caixa.innerHTML = '';
  J.mudouCasas = false;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const cel = celulasBox.children[r * W + c], co = J.coral ? J.coral[r][c] : 0;
    if (cel) { cel.classList.toggle('coral-morto', co === 1); cel.classList.toggle('coral-vivo', co === 2); }
  }
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const pe = J.perolas ? J.perolas[r][c] : 0, co = J.coral ? J.coral[r][c] : 0;
    const pa = (typeof papel !== 'undefined' && papel && papel[r]) ? papel[r][c] : 0;
    if (!pe && !co) continue;
    const d = document.createElement('div');
    d.className = 'marca-casa' + (pe === 2 ? ' ostra-fechada' : pe === 1 ? ' ostra-aberta' : '') +
                  (co === 1 ? ' coral-morto' : co === 2 ? ' coral-vivo' : '');
    /* cobertura (areia, alga, cinza, rede...): selinho no canto, por cima da peça */
    caixa.appendChild(d);
    /* alinha pela casa, não pela peça: a peça tem margem própria */
    const cel = celulasBox.children[r * W + c];
    if (cel) {
      const cr = cel.getBoundingClientRect(), mr = caixa.getBoundingClientRect();
      d.style.transform = 'translate(' + (cr.left - mr.left) + 'px,' + (cr.top - mr.top) + 'px)';
      d.style.width = cr.width + 'px'; d.style.height = cr.height + 'px';
    }
  }
}
/* a pérola colhida voa até o painel do objetivo */
function voaPerola(r, c) {
  const casa = celulasBox.children[r * W + c], alvo = document.querySelector('#objetivo .alvo') || document.getElementById('objetivo');
  if (!casa || !alvo) return;
  const a = casa.getBoundingClientRect(), b = alvo.getBoundingClientRect();
  const o = document.createElement('i');
  o.className = 'perola-voa';
  o.style.left = (a.left + a.width / 2) + 'px'; o.style.top = (a.top + a.height / 2) + 'px';
  o.style.setProperty('--dx', (b.left + b.width / 2 - a.left - a.width / 2) + 'px');
  o.style.setProperty('--dy', (b.top + b.height / 2 - a.top - a.height / 2) + 'px');
  document.body.appendChild(o);
  setTimeout(() => o.remove(), 900);
  Som.liga(); Som.pop(7);
}
function tiraLixo(y, x, q) {
  J.lixoFeito = (J.lixoFeito || 0) + 1; J.pontos += 200;
  const el = els.get(q.id);
  if (el) { el.classList.add('some'); setTimeout(() => { el.remove(); els.delete(q.id); }, 380); }
  grid[y][x] = null;
  respingos(y, x, '#BFF5EE', 8);
  Som.liga(); Som.pop(4);
}

/* ═══ NINHO DE ALGAS ════════════════════════════════════════════
   O ninho é a fonte: fica preso na borda de cima, não cai, não
   combina. Jogada sem alga destruída, cada ninho vivo solta uma
   alga numa casa encostada nele. Destruiu alguma, ele fica quieto.
   Três estouros colados derrubam o ninho, e a casa dele vira
   tabuleiro. As algas que ele já soltou continuam lá.            */
function pintaNinhos() {
  document.querySelectorAll('.ninho').forEach(e => e.remove());
  if (!J.ninhos) return;
  for (const n of J.ninhos) {
    if (n.vida <= 0) continue;
    const el = document.createElement('div');
    el.className = 'ninho' + (n.bateu ? ' apanhou' : '');
    el.innerHTML = '<svg viewBox="0 0 100 100"><use href="#i-ninho"/></svg><span class="vida-ninho">' +
      '●'.repeat(n.vida) + '<i>' + '●'.repeat(Math.max(0, (faseAtual().obj.vida || 3) - n.vida)) + '</i></span>';
    pecasBox.appendChild(el);
    posiciona(el, n.r, n.c, true);
    n.bateu = false;
  }
}
function derrubaNinho(n) {
  n.vida = 0;
  J.ninhosFeitos = (J.ninhosFeitos || 0) + 1;
  J.pontos += 600;
  TOPO[n.c] = Math.min(TOPO[n.c], n.r);          /* a casa do ninho vira tabuleiro */
  const casa = celulasBox.children[n.r * W + n.c];
  if (casa) casa.classList.remove('fora');
  estilhacos(n.r, n.c, '#7FE08A', 14);
  ondaChoque(n.r, n.c, 2.6, '#7FE08A');
  Som.liga(); Som.especial();
  faixaTexto(ninhosVivos() ? 'Ninho destruído!' : 'Último ninho destruído!', 2000);
  pintaNinhos();
}
const ninhosVivos = () => (J.ninhos || []).filter(n => n.vida > 0).length;
function passoNinho() {
  if (!J.ninhos || !ninhosVivos() || J.fim) { if (J.ninhos) pintaNinhos(); return; }
  if (J.limpouAlga) { J.limpouAlga = false; pintaNinhos(); return; }
  let nasceu = 0;
  const vivos = J.ninhos.filter(n => n.vida > 0);
  J.vezNinho = ((J.vezNinho || 0) + 1) % Math.max(1, vivos.length);
  for (const n of [vivos[J.vezNinho]].concat(vivos.filter((_, k) => k !== J.vezNinho))) {
    if (nasceu) break;                    /* uma alga por jogada, não uma por ninho */
    if (!n || n.vida <= 0) continue;
    /* primeiro a casa de baixo, depois os lados */
    const opcoes = [[n.r + 1, n.c], [n.r, n.c - 1], [n.r, n.c + 1], [n.r + 1, n.c - 1], [n.r + 1, n.c + 1]]
      .filter(([y, x]) => temCasa(y, x) && papel[y][x] === 0);
    if (!opcoes.length) continue;
    const [y, x] = opcoes[0];
    papel[y][x] = 1; J.papelTotal++; nasceu++;
    const casa = celulasBox.children[y * W + x];
    casa.classList.add('cresceu');
    setTimeout(() => casa.classList.remove('cresceu'), 520);
  }
  pintaNinhos();
  if (nasceu) {
    pintaPapel(); Som.liga(); Som.cresce();
    J.avisosNinho = (J.avisosNinho || 0) + 1;
    if (J.avisosNinho <= 2) faixaTexto('Nenhuma alga destruída: o ninho soltou mais', 2000);
    atualizaHud();
  }
}

/* Mancha, regra nova: se você destruiu pelo menos uma mancha na
   jogada, ela não se espalha. Se não destruiu, nasce uma mancha nova
   numa casa encostada, de preferência avançando para área limpa.
   Uma por jogada, e sem mancha nenhuma não há de onde crescer.   */
function passoMancha() {
  if (J.limpouMancha) { J.limpouMancha = false; return; }
  if (casasCobertas(papel) <= 0) return;
  let melhor = [], nota = -1;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (papel[r][c] !== 0 || !temCasa(r, c)) continue;
    let encosta = false, limpas = 0;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const y = r + dr, x = c + dc;
      if (!temCasa(y, x)) continue;
      if (papel[y][x] > 0) encosta = true; else limpas++;
    }
    if (!encosta) continue;
    if (limpas > nota) { nota = limpas; melhor = [[r, c]]; }
    else if (limpas === nota) melhor.push([r, c]);
  }
  if (!melhor.length) return;
  const [r, c] = melhor[sorteia(melhor.length)];
  papel[r][c] = 1; J.papelTotal++;
  pintaPapel();
  const casa = celulasBox.children[r * W + c];
  casa.classList.add('cresceu');
  setTimeout(() => casa.classList.remove('cresceu'), 520);
  Som.liga(); Som.cresce();
  J.avisosMancha = (J.avisosMancha || 0) + 1;
  if (J.avisosMancha <= 2) faixaTexto('Nenhuma mancha destruída: ela se espalhou', 2000);
  atualizaHud();
}

function passoCrescer() {
  const f = faseAtual();
  if (!f.obj.cresce || J.fim) return;
  if (f.obj.mancha) return passoMancha();
  if (J.alvoCresce) {
    const [r, c] = J.alvoCresce;
    J.alvoCresce = null;
    if (papel[r][c] === 0) {
      papel[r][c] = 1; J.papelTotal++;
      pintaPapel();
      const casa = celulasBox.children[r * W + c];
      casa.classList.add('cresceu');
      setTimeout(() => casa.classList.remove('cresceu'), 520);
      Som.liga(); Som.cresce();
      faixaTexto(f.obj.mancha ? 'A mancha se espalhou' : 'A alga voltou a crescer', 1700);
      atualizaHud();
    }
  }
  J.contaCresce = (J.contaCresce || 0) + 1;
  if (J.mov > 3 && casasCobertas(papel) > 0 && J.contaCresce % f.obj.cresce === 0) {
    const cand = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      if (papel[r][c] !== 0 || !temCasa(r, c)) continue;
      if (f.obj.espalha) {                       /* a mancha pula para qualquer vizinha */
        let vizinha = false;
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]])
          if (dentro(r + dr, c + dc) && papel[r + dr][c + dc] > 0) { vizinha = true; break; }
        if (vizinha) cand.push([r, c]);
      } else if (J.papelBase[r][c] > 0) cand.push([r, c]);
    }
    if (cand.length) J.alvoCresce = cand[sorteia(cand.length)];
  }
  pintaAvisoCresce();
}


/* ═══ PODERES NO TABULEIRO ══════════════════════════════════════
   O arpão tira uma peça e a troca livre junta duas que estão longe.
   Nenhum dos dois gasta jogada: o preço deles é o próprio poder.  */
let poderAtivo = null, poderAlvo = null;

async function usaPoderNaCelula(cel) {
  try { return await usaPoderInterno(cel); }
  catch (e) {
    console.error('erro no poder:', e);
    J.ocupado = false;
    desligaPoder();
    faixaTexto('Deu um tranco, mas pode continuar', 2600);
    return false;
  }
}
async function usaPoderInterno(cel) {
  if (J.ocupado || J.fim) return;
  const p = grid[cel.r][cel.c];
  if (!p) return;

  if (poderAtivo === 'isca') {
    if (p.bau) { Som.liga(); Som.nao(); faixaTexto('O baú não vira bolha'); return; }
    if (p.sp) { Som.liga(); Som.nao(); faixaTexto('Essa peça já é especial'); return; }
    gastaPoder('isca');
    desligaPoder();
    J.ocupado = true;
    p.sp = BOMBA;
    atualizaEl(p);
    const el = els.get(p.id);
    if (el) { el.classList.remove('nasce'); void el.offsetWidth; el.classList.add('nasce'); }
    estilhacos(cel.r, cel.c, '#FFD35C', 10);
    ondaChoque(cel.r, cel.c, 2.2, '#FFE7A3');
    Som.liga(); Som.especial(); vibra(24);
    await espera(420);
    J.ocupado = false;
    reiniciaDica();
    return;
  }

  if (poderAtivo === 'arpao') {
    if (p.bau) { Som.liga(); Som.nao(); faixaTexto('O baú não sai no arpão'); return; }
    gastaPoder('arpao');
    desligaPoder();
    J.ocupado = true;
    const el = els.get(p.id);
    if (el) el.classList.add('some');
    Som.liga(); Som.especial(); vibra(20);
    const alvoConj = new Set([chave(cel.r, cel.c)]);
    if (p.sp) expandir(alvoConj, null);      /* arpão em especial dispara ele */
    await limpar(alvoConj, null);
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

/* procura a melhor jogada disponível, não a primeira: se existe uma
   que faz especial, é essa que a dica mostra. É assim que a pessoa
   aprende a montar combo sem ninguém explicar.                     */
function achaJogadaBoa() {
  let melhor = null, nota = -1;
  const valor = { 5: 7, 6: 7, 7: 6, 4: 5, 3: 4, 1: 3, 2: 3 };
  const tentar = (r, c, r2, c2) => {
    if (!dentro(r2, c2)) return;
    const a = grid[r][c], b = grid[r2][c2];
    if (!a || !b || a.bau || b.bau) return;
    grid[r][c] = b; grid[r2][c2] = a;
    const corridas = acharCorridas();
    let v = -1;
    if (corridas.length) {
      v = 1;
      for (const g of fazGrupos(corridas)) v = Math.max(v, valor[especialDoGrupo(g)] || 1 + g.cells.length / 20);
    }
    grid[r][c] = a; grid[r2][c2] = b;
    if (v > nota) { nota = v; melhor = [r, c, r2, c2, nota]; }
  };
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) { tentar(r, c, r, c + 1); tentar(r, c, r + 1, c); }
  return melhor;
}

function mostraDica() {
  if (J.ocupado || J.fim) { reiniciaDica(); return; }
  /* a jogada sugerida é a melhor do tabuleiro, mas o aviso é discreto:
     só as duas peças balançando, sem seta nem holofote */
  const j = achaJogadaBoa() || achaJogada();
  if (!j) return;
  for (const p of [grid[j[0]][j[1]], grid[j[2]][j[3]]]) {
    if (!p) continue;
    const el = els.get(p.id);
    if (el) { el.classList.add('dica'); dicaAtiva.push(el); }
  }
}
function apagaDica() { dicaAtiva.forEach(e => e.classList.remove('dica')); dicaAtiva = []; }
