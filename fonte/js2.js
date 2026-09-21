
/* ═══ ESTADO ════════════════════════════════════════════════════ */
let grid = [], papel = [], uid = 0;
let J = {
  fase: 0, mov: 0, pontos: 0, coletado: [0,0,0,0,0,0],
  papelTotal: 0, papelFeito: 0, ocupado: true, fim: false, cascata: 1
};

/* ═══ MONTAGEM ══════════════════════════════════════════════════ */
function tipoSeguro(r, c) {
  const proibido = new Set();
  if (c >= 2 && grid[r][c-1] && grid[r][c-2] && grid[r][c-1].t === grid[r][c-2].t) proibido.add(grid[r][c-1].t);
  if (r >= 2 && grid[r-1][c] && grid[r-2][c] && grid[r-1][c].t === grid[r-2][c].t) proibido.add(grid[r-1][c].t);
  let t, giro = 0;
  do { t = sorteia(TIPOS); giro++; } while (proibido.has(t) && giro < 40);
  return t;
}
function novaPeca(t) { return { id: ++uid, t: t, sp: NADA }; }
/* o baú não combina com nada, não sai com especial e só quer chegar no fundo */
function novoBau() { return { id: ++uid, t: -1, sp: NADA, bau: true }; }

function montaTabuleiro() {
  do {
    grid = Array.from({ length: H }, () => Array(W).fill(null));
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) grid[r][c] = novaPeca(tipoSeguro(r, c));
  } while (acharCorridas().length || !temJogada());
}

/* ═══ COMBOS ════════════════════════════════════════════════════ */
function acharCorridas() {
  const out = [];
  for (let r = 0; r < H; r++) {
    let c = 0;
    while (c < W) {
      const p = grid[r][c];
      if (!p || p.bau) { c++; continue; }
      let k = c + 1;
      while (k < W && grid[r][k] && !grid[r][k].bau && grid[r][k].t === p.t) k++;
      if (k - c >= 3) out.push({ dir: 'h', r: r, c: c, len: k - c, t: p.t });
      c = k;
    }
  }
  for (let c = 0; c < W; c++) {
    let r = 0;
    while (r < H) {
      const p = grid[r][c];
      if (!p || p.bau) { r++; continue; }
      let k = r + 1;
      while (k < H && grid[k][c] && !grid[k][c].bau && grid[k][c].t === p.t) k++;
      if (k - r >= 3) out.push({ dir: 'v', r: r, c: c, len: k - r, t: p.t });
      r = k;
    }
  }
  return out;
}

function fazGrupos(corridas) {
  const marc = new Map();
  for (const co of corridas) {
    for (let i = 0; i < co.len; i++) {
      marc.set(co.dir === 'h' ? chave(co.r, co.c + i) : chave(co.r + i, co.c), co.t);
    }
  }
  const vistos = new Set(), gs = [];
  for (const k0 of marc.keys()) {
    if (vistos.has(k0)) continue;
    const t = marc.get(k0), pilha = [k0], cells = [];
    vistos.add(k0);
    while (pilha.length) {
      const x = pilha.pop(); cells.push(x);
      const r = linha(x), c = coluna(x);
      const viz = [[r+1,c],[r-1,c],[r,c+1],[r,c-1]];
      for (const [nr, nc] of viz) {
        if (!dentro(nr, nc)) continue;
        const nk = chave(nr, nc);
        if (!vistos.has(nk) && marc.get(nk) === t) { vistos.add(nk); pilha.push(nk); }
      }
    }
    const set = new Set(cells);
    let maxH = 1, maxV = 1;
    for (const x of cells) {
      const r = linha(x), c = coluna(x);
      let n = 1;
      for (let cc = c - 1; dentro(r, cc) && set.has(chave(r, cc)); cc--) n++;
      for (let cc = c + 1; dentro(r, cc) && set.has(chave(r, cc)); cc++) n++;
      if (n > maxH) maxH = n;
      let m = 1;
      for (let rr = r - 1; dentro(rr, c) && set.has(chave(rr, c)); rr--) m++;
      for (let rr = r + 1; dentro(rr, c) && set.has(chave(rr, c)); rr++) m++;
      if (m > maxV) maxV = m;
    }
    gs.push({ t: t, cells: cells, set: set, maxH: maxH, maxV: maxV });
  }
  return gs;
}

function especialDoGrupo(g) {
  if (g.maxH >= 5 || g.maxV >= 5) return ARCO;
  if (g.maxH >= 3 && g.maxV >= 3) return BOMBA;
  if (g.maxH >= 4) return LH;
  if (g.maxV >= 4) return LV;
  return NADA;
}
function posEspecial(g, preferidos) {
  for (const k of preferidos) if (k != null && g.set.has(k)) return k;
  for (const x of g.cells) {
    const r = linha(x), c = coluna(x);
    let n = 1;
    for (let cc = c - 1; dentro(r, cc) && g.set.has(chave(r, cc)); cc--) n++;
    for (let cc = c + 1; dentro(r, cc) && g.set.has(chave(r, cc)); cc++) n++;
    let m = 1;
    for (let rr = r - 1; dentro(rr, c) && g.set.has(chave(rr, c)); rr--) m++;
    for (let rr = r + 1; dentro(rr, c) && g.set.has(chave(rr, c)); rr++) m++;
    if (n >= 3 && m >= 3) return x;
  }
  return g.cells[(g.cells.length / 2) | 0];
}

/* ═══ ESPECIAIS ═════════════════════════════════════════════════ */
function corMaisComum() {
  const n = Array(TIPOS).fill(0);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] && !grid[r][c].bau) n[grid[r][c].t]++;
  let melhor = 0;
  for (let i = 1; i < TIPOS; i++) if (n[i] > n[melhor]) melhor = i;
  return melhor;
}
function areaEspecial(r, c, p, corAlvo) {
  const out = [];
  if (p.sp === LH) { for (let x = 0; x < W; x++) out.push(chave(r, x)); }
  else if (p.sp === LV) { for (let y = 0; y < H; y++) out.push(chave(y, c)); }
  else if (p.sp === BOMBA) {
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
      if (Math.abs(dr) + Math.abs(dc) <= 2 && dentro(r + dr, c + dc)) out.push(chave(r + dr, c + dc));
  } else if (p.sp === ARCO) {
    const t = (corAlvo != null) ? corAlvo : corMaisComum();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] && grid[y][x].t === t) out.push(chave(y, x));
  }
  return out;
}
/* propaga: todo especial dentro do conjunto dispara também */
function expandir(conj, corAlvo) {
  const fila = [...conj], feitos = new Set();
  let guarda = 0;
  while (fila.length && guarda++ < 4000) {
    const k = fila.pop();
    if (feitos.has(k)) continue;
    feitos.add(k);
    const r = linha(k), c = coluna(k), p = grid[r][c];
    if (!p || !p.sp) continue;
    for (const a of areaEspecial(r, c, p, corAlvo)) {
      if (!conj.has(a)) conj.add(a);
      if (!feitos.has(a)) fila.push(a);
    }
  }
  return conj;
}

/* troca de dois especiais (ou confete com qualquer doce) */
function comboTroca(ra, ca, rb, cb) {
  const a = grid[ra][ca], b = grid[rb][cb];
  const conj = new Set();
  const ka = chave(ra, ca), kb = chave(rb, cb);
  const sa = a.sp, sb = b.sp;
  let corAlvo = null;

  const tudo = () => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) conj.add(chave(y, x)); };
  const linhaToda = r => { for (let x = 0; x < W; x++) conj.add(chave(r, x)); };
  const colunaToda = c => { for (let y = 0; y < H; y++) conj.add(chave(y, c)); };

  if (sa === ARCO && sb === ARCO) {
    a.sp = b.sp = NADA; tudo();
  } else if (sa === ARCO || sb === ARCO) {
    const arco = sa === ARCO ? a : b;
    const outro = sa === ARCO ? b : a;
    const kArco = sa === ARCO ? ka : kb, kOutro = sa === ARCO ? kb : ka;
    arco.sp = NADA;
    conj.add(kArco); conj.add(kOutro);
    if (outro.sp === LH || outro.sp === LV || outro.sp === BOMBA) {
      const alvo = outro.sp;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const p = grid[y][x];
        if (p && p.t === outro.t) { p.sp = alvo === BOMBA ? BOMBA : (Math.random() < 0.5 ? LH : LV); conj.add(chave(y, x)); }
      }
    } else {
      corAlvo = outro.t;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] && grid[y][x].t === outro.t) conj.add(chave(y, x));
    }
  } else if ((sa === LH || sa === LV) && (sb === LH || sb === LV)) {
    a.sp = b.sp = NADA;
    linhaToda(rb); colunaToda(cb); conj.add(ka);
  } else if ((sa === BOMBA && (sb === LH || sb === LV)) || (sb === BOMBA && (sa === LH || sa === LV))) {
    a.sp = b.sp = NADA;
    for (let d = -1; d <= 1; d++) { if (dentro(rb + d, 0)) linhaToda(rb + d); if (dentro(0, cb + d)) colunaToda(cb + d); }
    conj.add(ka);
  } else if (sa === BOMBA && sb === BOMBA) {
    a.sp = b.sp = NADA;
    for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++)
      if (Math.abs(dr) + Math.abs(dc) <= 3 && dentro(rb + dr, cb + dc)) conj.add(chave(rb + dr, cb + dc));
    conj.add(ka);
  } else {
    conj.add(ka); conj.add(kb);
  }
  expandir(conj, corAlvo);
  return conj;
}

/* ═══ JOGADA POSSÍVEL ═══════════════════════════════════════════ */
function criaCombo(r1, c1, r2, c2) {
  const a = grid[r1][c1], b = grid[r2][c2];
  if (!a || !b) return false;
  grid[r1][c1] = b; grid[r2][c2] = a;
  const ok = temCorridaEm(r1, c1) || temCorridaEm(r2, c2);
  grid[r1][c1] = a; grid[r2][c2] = b;
  return ok;
}
function temCorridaEm(r, c) {
  const p = grid[r][c]; if (!p || p.bau) return false;
  let n = 1;
  for (let x = c - 1; x >= 0 && grid[r][x] && !grid[r][x].bau && grid[r][x].t === p.t; x--) n++;
  for (let x = c + 1; x < W && grid[r][x] && !grid[r][x].bau && grid[r][x].t === p.t; x++) n++;
  if (n >= 3) return true;
  let m = 1;
  for (let y = r - 1; y >= 0 && grid[y][c] && grid[y][c].t === p.t; y--) m++;
  for (let y = r + 1; y < H && grid[y][c] && grid[y][c].t === p.t; y++) m++;
  return m >= 3;
}
function achaJogada() {
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = grid[r][c]; if (!p) continue;
    if (p.sp === ARCO) return [r, c, (c < W - 1 ? r : r), (c < W - 1 ? c + 1 : c - 1)];
    if (c < W - 1) {
      const q = grid[r][c+1];
      if (q && (q.sp === ARCO || (p.sp && q.sp) || criaCombo(r, c, r, c + 1))) return [r, c, r, c + 1];
    }
    if (r < H - 1) {
      const q = grid[r+1][c];
      if (q && (q.sp === ARCO || (p.sp && q.sp) || criaCombo(r, c, r + 1, c))) return [r, c, r + 1, c];
    }
  }
  return null;
}
function temJogada() { return !!achaJogada(); }

function embaralhaModelo() {
  let voltas = 0;
  do {
    const soltos = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] && !grid[r][c].sp && !grid[r][c].bau) soltos.push(grid[r][c].t);
    for (let i = soltos.length - 1; i > 0; i--) { const j = sorteia(i + 1); const t = soltos[i]; soltos[i] = soltos[j]; soltos[j] = t; }
    let i = 0;
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] && !grid[r][c].sp && !grid[r][c].bau) grid[r][c].t = soltos[i++];
    voltas++;
  } while ((acharCorridas().length || !temJogada()) && voltas < 60);
}

/* ═══ GRAVIDADE ═════════════════════════════════════════════════ */
function gravidade() {
  const caindo = [];
  for (let c = 0; c < W; c++) {
    let escreve = H - 1;
    for (let r = H - 1; r >= 0; r--) {
      if (grid[r][c]) {
        if (r !== escreve) { grid[escreve][c] = grid[r][c]; grid[r][c] = null; caindo.push(grid[escreve][c]); }
        escreve--;
      }
    }
    let acima = -1;
    for (let r = escreve; r >= 0; r--) {
      /* enquanto faltar baú, ele entra junto com as peças novas, de pouco em pouco */
      /* um baú por coluna: empilhados eles se atrapalham */
      let colunaLivre = true;
      for (let q = 0; q < H; q++) if (grid[q][c] && grid[q][c].bau) colunaLivre = false;
      const cabeBau = J.bauPendentes > 0 && J.bauNaTela < 2 && colunaLivre && r === escreve && rnd() < .42;
      const p = cabeBau ? novoBau() : novaPeca(sorteia(TIPOS));
      if (cabeBau) { J.bauPendentes--; J.bauNaTela++; }
      p.entrando = acima--;
      grid[r][c] = p; caindo.push(p);
    }
  }
  return caindo;
}
