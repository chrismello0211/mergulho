
let efeitosPendentes = [];
/* ponto extra por disparar especial e por juntar dois deles:
   é o que faz valer a pena montar a jogada em vez de só combinar 3 */
let bonusEspeciais = 0;
const VALOR_ESP = { 1: 300, 2: 300, 3: 900, 4: 900, 5: 1400, 6: 1400, 7: 1100 };     /* correnteza, correnteza em pé, bolha, pérola */
const VALOR_NASCE = { 1: 150, 2: 150, 3: 250, 4: 400, 5: 600, 6: 600, 7: 500 };   /* por criar cada um deles */

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

/* TOPO diz em que fileira cada coluna começa. Coluna mais curta
   significa menos casas, e é isso que dá formato ao tabuleiro:
   arco, pirâmide, degraus, taça. Fora do formato não existe casa. */
let TOPO = Array(W).fill(0);
const temCasa = (r, c) => r >= TOPO[c] && r < H && c >= 0 && c < W;

function montaTabuleiro() {
  do {
    grid = Array.from({ length: H }, () => Array(W).fill(null));
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++)
      if (temCasa(r, c)) grid[r][c] = novaPeca(tipoSeguro(r, c));
  } while (acharCorridas().length || !temJogada());
}

/* ═══ COMBOS ════════════════════════════════════════════════════ */
function acharQuadrados(ja) {
  const usadas = new Set();
  for (const co of ja) for (let k = 0; k < co.len; k++) usadas.add(co.dir === 'h' ? chave(co.r, co.c + k) : chave(co.r + k, co.c));
  const out = [];
  const ok = p => p && !p.bau && !p.gaiola && !p.lixo;
  for (let r = 0; r < H - 1; r++) for (let c = 0; c < W - 1; c++) {
    const a = grid[r][c], b = grid[r][c + 1], d = grid[r + 1][c], e = grid[r + 1][c + 1];
    if (!ok(a) || !ok(b) || !ok(d) || !ok(e)) continue;
    if (a.t !== b.t || a.t !== d.t || a.t !== e.t) continue;
    const ks = [chave(r, c), chave(r, c + 1), chave(r + 1, c), chave(r + 1, c + 1)];
    if (ks.some(k => usadas.has(k))) continue;
    ks.forEach(k => usadas.add(k));
    out.push({ r: r, c: c, len: 2, dir: 'h', t: a.t, quad: true }, { r: r + 1, c: c, len: 2, dir: 'h', t: a.t, quad: true });
  }
  return out;
}
function acharCorridas() {
  const out = [];
  for (let r = 0; r < H; r++) {
    let c = 0;
    while (c < W) {
      const p = grid[r][c];
      if (!p || p.bau || p.gaiola || p.lixo) { c++; continue; }
      let k = c + 1;
      while (k < W && grid[r][k] && !grid[r][k].bau && !grid[r][k].gaiola && !grid[r][k].lixo && grid[r][k].t === p.t) k++;
      if (k - c >= 3) out.push({ dir: 'h', r: r, c: c, len: k - c, t: p.t });
      c = k;
    }
  }
  for (let c = 0; c < W; c++) {
    let r = 0;
    while (r < H) {
      const p = grid[r][c];
      if (!p || p.bau || p.gaiola || p.lixo) { r++; continue; }
      let k = r + 1;
      while (k < H && grid[k][c] && !grid[k][c].bau && !grid[k][c].gaiola && !grid[k][c].lixo && grid[k][c].t === p.t) k++;
      if (k - r >= 3) out.push({ dir: 'v', r: r, c: c, len: k - r, t: p.t });
      r = k;
    }
  }
  return QUADRADO_ATIVO ? out.concat(acharQuadrados(out)) : out;
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
  if (QUADRADO_ATIVO && g.cells.length === 4 && g.maxH === 2 && g.maxV === 2) return PEIXE;
  if (g.maxH >= 6) return ONDA;          /* seis deitadas: maré, leva três fileiras */
  if (g.maxV >= 6) return ONDAV;         /* seis em pé: maré de través */
  if (g.cells.length >= 7) return CARDUME;  /* aglomerado grande: cardume */
  if (g.maxH >= 5 || g.maxV >= 5) return ARCO;
  if (g.maxH >= 3 && g.maxV >= 3) return BOMBA;
  /* como no Candy Crush: quatro deitadas criam correnteza em pé, que
     leva a coluna; quatro em pé criam correnteza deitada, que leva a fileira */
  if (g.maxH >= 4) return LV;
  if (g.maxV >= 4) return LH;
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
  if (p.sp === LH) { for (let x = 0; x < W; x++) if (temCasa(r, x)) out.push(chave(r, x)); }
  else if (p.sp === LV) { for (let y = 0; y < H; y++) if (temCasa(y, c)) out.push(chave(y, c)); }
  else if (p.sp === BOMBA) {
    /* bomba é bomba: leva tudo em volta, 5x5 cheio */
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
      if (temCasa(r + dr, c + dc)) out.push(chave(r + dr, c + dc));
  } else if (p.sp === ONDA) {
    for (let dr = -1; dr <= 1; dr++) for (let x = 0; x < W; x++) if (temCasa(r + dr, x)) out.push(chave(r + dr, x));
  } else if (p.sp === ONDAV) {
    for (let dc = -1; dc <= 1; dc++) for (let y = 0; y < H; y++) if (temCasa(y, c + dc)) out.push(chave(y, c + dc));
  } else if (p.sp === PEIXE) {
    /* o peixe-guia vai direto no que o objetivo pede: cobertura, coral, ostra,
       lixo, bicho preso; sem nada disso, em três peças ao acaso */
    const alvos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!temCasa(y, x) || (y === r && x === c)) continue;
      const q = grid[y][x];
      const vale = (typeof papel !== 'undefined' && papel[y] && papel[y][x] > 0) ||
        (typeof J !== 'undefined' && J && ((J.coral && J.coral[y][x] === 1) || (J.perolas && J.perolas[y][x] > 0))) ||
        (q && (q.lixo || q.gaiola || q.bolha));
      if (vale) alvos.push(chave(y, x));
    }
    const resto = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] && !grid[y][x].bau && !(y === r && x === c) && alvos.indexOf(chave(y, x)) < 0) resto.push(chave(y, x));
    for (const l of [alvos, resto]) for (let k = l.length - 1; k > 0; k--) { const q = Math.floor(rnd() * (k + 1)); const t = l[k]; l[k] = l[q]; l[q] = t; }
    out.push(chave(r, c));
    for (const k of alvos.concat(resto).slice(0, 3)) out.push(k);
  } else if (p.sp === CARDUME) {
    /* o cardume sai caçando a própria cor pelo tabuleiro */
    const iguais = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (grid[y][x] && !grid[y][x].bau && grid[y][x].t === p.t && !(y === r && x === c)) iguais.push(chave(y, x));
    for (let k = iguais.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); const t = iguais[k]; iguais[k] = iguais[j]; iguais[j] = t; }
    out.push(chave(r, c));
    for (const k of iguais.slice(0, 9)) out.push(k);
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
    const area = areaEspecial(r, c, p, corAlvo);
    const vale = VALOR_ESP[p.sp] || 0;
    bonusEspeciais += vale * (typeof J !== 'undefined' && J.soltoSozinho && J.cascata === 1 ? .5 : 1);
    efeitosPendentes.push({ r: r, c: c, sp: p.sp, vale: vale, alvos: (p.sp === ARCO || p.sp === CARDUME || p.sp === PEIXE) ? area.slice() : null });
    for (const a of area) {
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

  /* a camada de efeitos precisa saber o que estourou, porque aqui
     os especiais são desarmados antes do expandir passar          */
  const tudo = () => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (temCasa(y, x)) conj.add(chave(y, x)); efeitosPendentes.push({ r: rb, c: cb, sp: 'tudo', vale: 4000 }); bonusEspeciais += 4000; };
  const linhaToda = r => { for (let x = 0; x < W; x++) if (temCasa(r, x)) conj.add(chave(r, x)); efeitosPendentes.push({ r: r, c: cb, sp: LH, vale: 400 }); bonusEspeciais += 400; };
  const colunaToda = c => { for (let y = 0; y < H; y++) if (temCasa(y, c)) conj.add(chave(y, c)); efeitosPendentes.push({ r: rb, c: c, sp: LV, vale: 400 }); bonusEspeciais += 400; };

  if (sa === ARCO && sb === ARCO) {
    a.sp = b.sp = NADA; tudo();
  } else if (sa === ARCO || sb === ARCO) {
    const arco = sa === ARCO ? a : b;
    const outro = sa === ARCO ? b : a;
    const kArco = sa === ARCO ? ka : kb, kOutro = sa === ARCO ? kb : ka;
    arco.sp = NADA;
    conj.add(kArco); conj.add(kOutro);
    if (outro.sp === LH || outro.sp === LV || outro.sp === BOMBA) {
      bonusEspeciais += 3500;
      const alvo = outro.sp;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const p = grid[y][x];
        if (p && p.t === outro.t) { p.sp = alvo === BOMBA ? BOMBA : (Math.random() < 0.5 ? LH : LV); conj.add(chave(y, x)); }
      }
    } else {
      corAlvo = outro.t;
      const alvos = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] && grid[y][x].t === outro.t) { conj.add(chave(y, x)); alvos.push(chave(y, x)); }
      efeitosPendentes.push({ r: rb, c: cb, sp: ARCO, vale: 1600, alvos: alvos });
      bonusEspeciais += 1600;
    }
  } else if ((sa === LH || sa === LV) && (sb === LH || sb === LV)) {
    a.sp = b.sp = NADA;
    for (let d = -1; d <= 1; d++) { if (dentro(rb + d, 0)) linhaToda(rb + d); if (dentro(0, cb + d)) colunaToda(cb + d); }
    conj.add(ka);
  } else if ((sa === BOMBA && (sb === LH || sb === LV)) || (sb === BOMBA && (sa === LH || sa === LV))) {
    a.sp = b.sp = NADA;
    for (let d = -2; d <= 2; d++) { if (dentro(rb + d, 0)) linhaToda(rb + d); if (dentro(0, cb + d)) colunaToda(cb + d); }
    conj.add(ka);
  } else if (sa === ONDA || sa === ONDAV || sa === CARDUME || sb === ONDA || sb === ONDAV || sb === CARDUME) {
    /* maré ou cardume no combo: os dois especiais estouram juntos */
    for (const k of areaEspecial(rb, cb, b, null)) conj.add(k);
    for (const k of areaEspecial(ra, ca, a, null)) conj.add(k);
    efeitosPendentes.push({ r: rb, c: cb, sp: sb, vale: 1800 });
    efeitosPendentes.push({ r: ra, c: ca, sp: sa, vale: 0 });
    bonusEspeciais += 1800;
    a.sp = b.sp = NADA;
    conj.add(ka); conj.add(kb);
  } else if (sa === BOMBA && sb === BOMBA) {
    a.sp = b.sp = NADA;
    efeitosPendentes.push({ r: rb, c: cb, sp: BOMBA, tam: 9, vale: 3500 });
    bonusEspeciais += 3500;
    for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++)
      if (temCasa(rb + dr, cb + dc)) conj.add(chave(rb + dr, cb + dc));
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
  let ok = temCorridaEm(r1, c1) || temCorridaEm(r2, c2);
  /* nas fases com quadrado, fechar um 2x2 também é jogada válida */
  if (!ok && QUADRADO_ATIVO) {
    const ks = [chave(r1, c1), chave(r2, c2)];
    ok = acharQuadrados([]).some(q => q.r !== undefined && [chave(q.r, q.c), chave(q.r, q.c + 1)].some(k => ks.indexOf(k) >= 0));
  }
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
    for (let r = H - 1; r >= TOPO[c]; r--) {
      if (grid[r][c]) {
        if (r !== escreve) {
          grid[escreve][c] = grid[r][c]; grid[r][c] = null; caindo.push(grid[escreve][c]);
          if (grid[escreve][c].bau) J.bauParado = 0;   /* desceu por mérito seu: a rede de segurança zera */
        }
        escreve--;
      }
    }
    let acima = -1;
    for (let r = escreve; r >= TOPO[c]; r--) {
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
