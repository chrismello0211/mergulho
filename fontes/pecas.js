
/* ═══ PEÇAS ═════════════════════════════════════════════════════
   Seis famílias. Cada uma guarda a cor e o contorno em todos os
   mundos, então quem aprendeu a jogar não precisa reaprender:
     0 estrela-do-mar (vermelha)   1 caranguejo (laranja)
     2 concha em espiral (amarela) 3 ouriço (verde)
     4 peixe (azul)                5 água-viva (roxa)
   O que muda de um mundo pro outro é a espécie e a luz: sol no
   raso e no recife, luz fria no naufrágio, corpo translúcido no
   crepúsculo e luz própria no abismo.                            */

const f1 = n => Math.round(n * 10) / 10;

/* Catmull-Rom → Bézier: contorno orgânico a partir de pontos */
function caminho(pts, fecha) {
  const n = pts.length, P = i => fecha ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
  const lim = fecha ? n : n - 1;
  for (let i = 0; i < lim; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += 'C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
               f1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' +
               f1(p2[0]) + ' ' + f1(p2[1]);
  }
  return d + (fecha ? 'Z' : '');
}
function polar(cx, cy, n, fr, giro) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const th = i / n * Math.PI * 2, r = fr(th), a = th + (giro ? giro(r) : 0);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
const espelha = d => d.replace(/([MLCQSTA ])(-?[\d.]+)[ ,](-?[\d.]+)/g, (m, c, x, y) => c + f1(100 - +x) + ' ' + y);
const circ = (x, y, r, a) => '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" ' + a + '/>';

function rad(id, stops, cx, cy, r) {
  return '<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' +
    stops.map(s => '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>').join('') +
    '</radialGradient>';
}
function lin(id, stops, x1, y1, x2, y2) {
  return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
    stops.map(s => '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>').join('') +
    '</linearGradient>';
}

/* cores de cada família em cada mundo
   b base · c claro · e escuro (ou cor do brilho, nos mundos sem sol) · x detalhe */
const PAL = [
  [ {b:'#F2503F',c:'#FF9C7E',e:'#A8232A',x:'#FFE0CC'}, {b:'#E8364F',c:'#FF8595',e:'#9C1734',x:'#FFC9B8'},
    {b:'#DA4A3A',c:'#F79072',e:'#86211F',x:'#FFD0B0'}, {b:'#FF4D6D',c:'#FFB3C1',e:'#FF4D6D',x:'#FFE3E9'},
    {b:'#2A0610',c:'#FF7390',e:'#FF2E57',x:'#FFC2CE'} ],
  [ {b:'#FF9432',c:'#FFC985',e:'#C85A14',x:'#FFF1DE'}, {b:'#FF7A1F',c:'#FFB36B',e:'#B8480C',x:'#FFF4E6'},
    {b:'#EE7A2B',c:'#FFB072',e:'#A34A12',x:'#7A330C'}, {b:'#FF8A2E',c:'#FFC999',e:'#FF8A2E',x:'#FFE7D1'},
    {b:'#241006',c:'#FFA15C',e:'#FF7A1A',x:'#FFD2AE'} ],
  [ {b:'#FFD23F',c:'#FFF3B0',e:'#CF9312',x:'#B8780C'}, {b:'#FFC928',c:'#FFEE9A',e:'#D08C06',x:'#E8651A'},
    {b:'#FFE1A0',c:'#FFF6DC',e:'#D9A441',x:'#C8691C'}, {b:'#FFD23F',c:'#FFF4BD',e:'#FFD23F',x:'#FFF7D6'},
    {b:'#221A04',c:'#FFE066',e:'#FFC61A',x:'#FFF0A8'} ],
  [ {b:'#35C46A',c:'#8BF2AE',e:'#157A40',x:'#D9FFE6'}, {b:'#1FC99A',c:'#86F7D2',e:'#0B7D5C',x:'#E0FFF4'},
    {b:'#76BE36',c:'#BCEB83',e:'#3D7515',x:'#E9FFD0'}, {b:'#3DDC84',c:'#A6F5C8',e:'#3DDC84',x:'#DFFFEB'},
    {b:'#06200F',c:'#5CFF9E',e:'#1DF57A',x:'#C9FFE0'} ],
  [ {b:'#3E9BFF',c:'#B3E0FF',e:'#1A5ACC',x:'#FFFFFF'}, {b:'#2F7DF7',c:'#A6D6FF',e:'#1446B8',x:'#0B2E8A'},
    {b:'#2E6FE0',c:'#8DBBFF',e:'#163F9E',x:'#A9CCFF'}, {b:'#1D3478',c:'#6F9BFF',e:'#3B6CE8',x:'#9FF0FF'},
    {b:'#081230',c:'#5CB4FF',e:'#2E8CFF',x:'#B8F6FF'} ],
  [ {b:'#A67BFF',c:'#E4D2FF',e:'#6B40D4',x:'#F4ECFF'}, {b:'#9A4DFF',c:'#DDB8FF',e:'#6424C9',x:'#FFD6F5'},
    {b:'#BDA4FF',c:'#EFE6FF',e:'#7E5BE0',x:'#6B3FD6'}, {b:'#B084FF',c:'#E6D6FF',e:'#B084FF',x:'#F3EAFF'},
    {b:'#160A2E',c:'#C39BFF',e:'#9A5CFF',x:'#EBD9FF'} ]
];

/* luz de cada mundo: 0-2 sol, 3 vidro, 4 neon */
const LUZ = ['sol', 'sol', 'sol', 'vidro', 'neon'];

/* gradiente e halo do corpo, conforme a luz */
function tinta(id, pal, m, cx, cy) {
  const L = LUZ[m];
  if (L === 'sol') return rad(id, [[0, pal.c], [.48, pal.b], [1, pal.e]], cx || 38, cy || 32, 72);
  if (L === 'vidro') return rad(id, [[0, pal.c, .9], [.5, pal.b, .62], [1, pal.b, .34]], cx || 42, cy || 36, 64) +
                            rad(id + 'h', [[0, pal.e, .5], [.55, pal.e, .16], [1, pal.e, 0]], 50, 52, 52);
  return rad(id, [[0, '#' + mistura(pal.b, pal.e, .22)], [1, pal.b]], 46, 40, 58) +
         rad(id + 'h', [[0, pal.e, .46], [.5, pal.e, .14], [1, pal.e, 0]], 50, 52, 54);
}
function mistura(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
  return pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
/* desenha um contorno com a luz do mundo */
function pinta(d, id, pal, m, extra) {
  const L = LUZ[m];
  if (L === 'sol') return '<path d="' + d + '" fill="url(#' + id + ')" ' + (extra || '') + '/>';
  if (L === 'vidro') return '<path d="' + d + '" fill="url(#' + id + ')" stroke="' + pal.c + '" stroke-width="2.2" stroke-opacity=".9" stroke-linejoin="round"/>';
  return '<path d="' + d + '" fill="url(#' + id + ')" stroke="' + pal.e + '" stroke-width="8" stroke-opacity=".3" stroke-linejoin="round"/>' +
         '<path d="' + d + '" fill="none" stroke="' + pal.c + '" stroke-width="2.6" stroke-linejoin="round"/>';
}
const halo = (id, m) => LUZ[m] === 'sol' ? '' : '<circle cx="50" cy="52" r="50" fill="url(#' + id + 'h)"/>';
const brilhoSol = (m, x, y, rx, ry, rot) => LUZ[m] !== 'sol' ? '' :
  '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity=".38"' +
  (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>';
/* ponto de luz com auréola (crepúsculo e abismo) */
const luzinha = (x, y, r, cor, aur) =>
  circ(x, y, r * 2.4, 'fill="' + (aur || cor) + '" opacity=".28"') + circ(x, y, r, 'fill="' + cor + '"');

/* ── 0 · estrela-do-mar ─────────────────────────────────────── */
function estrela(m, id) {
  const pal = PAL[0][m];
  const cfg = [{ro:46,ri:19,p:1.1,g:0}, {ro:45,ri:27,p:.8,g:0}, {ro:47,ri:10.5,p:2.8,g:.34},
               {ro:46,ri:19,p:1.2,g:0}, {ro:46,ri:16,p:1.45,g:0}][m];
  const cx = 50, cy = 53, rot = -Math.PI / 2;
  const fr = th => cfg.ri + (cfg.ro - cfg.ri) * Math.pow((1 + Math.cos(5 * (th - rot))) / 2, cfg.p);
  const giro = cfg.g ? (r => cfg.g * (r - cfg.ri) / (cfg.ro - cfg.ri)) : null;
  const d = caminho(polar(cx, cy, 120, fr, giro), true);
  const em = (k, dist) => {
    const a = rot + k * 2 * Math.PI / 5 + (giro ? giro(Math.min(cfg.ro, dist)) : 0);
    return [cx + dist * Math.cos(a), cy + dist * Math.sin(a)];
  };
  let s = halo(id, m) + pinta(d, id, pal, m), dec = '';
  for (let k = 0; k < 5; k++) {
    if (m === 0) [[12, 4.2], [23, 3.4], [33, 2.6]].forEach(q => { const p = em(k, q[0]); dec += circ(p[0], p[1], q[1], 'fill="' + pal.x + '" opacity=".92"'); });
    if (m === 1) {
      [[10, 4.3], [21, 3.8], [32, 3]].forEach(q => { const p = em(k, q[0]); dec += circ(p[0], p[1], q[1], 'fill="' + pal.x + '" stroke="' + pal.e + '" stroke-width="1.3"'); });
      const a = rot + (k + .5) * 2 * Math.PI / 5; dec += circ(cx + 17 * Math.cos(a), cy + 17 * Math.sin(a), 3.2, 'fill="' + pal.x + '" stroke="' + pal.e + '" stroke-width="1.2"');
    }
    if (m === 2) [20, 27, 34, 41].forEach((dist, j) => {
      const p = em(k, dist), a = Math.atan2(p[1] - cy, p[0] - cx) + Math.PI / 2, h = 5.4 - j * .8;
      dec += '<path d="M' + f1(p[0] - h * Math.cos(a)) + ' ' + f1(p[1] - h * Math.sin(a)) + 'L' + f1(p[0] + h * Math.cos(a)) + ' ' + f1(p[1] + h * Math.sin(a)) +
             '" stroke="' + pal.x + '" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>';
    });
    if (m === 3) { const p = em(k, 39), q = em(k, 30); dec += '<path d="M' + cx + ' ' + cy + 'L' + f1(q[0]) + ' ' + f1(q[1]) + '" stroke="' + pal.c + '" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>' + luzinha(p[0], p[1], 3.4, pal.x, pal.b); }
    if (m === 4) [[14, 2.6], [24, 2.2], [33, 1.9]].forEach(q => { const p = em(k, q[0]); dec += luzinha(p[0], p[1], q[1], pal.x, pal.e); });
  }
  if (m === 0) dec += circ(cx, cy, 5, 'fill="' + pal.x + '" opacity=".85"');
  if (m === 2) dec += circ(cx, cy, 15, 'fill="url(#' + id + ')"') + circ(cx, cy, 15, 'fill="none" stroke="' + pal.x + '" stroke-width="2" stroke-dasharray="3 3.2" opacity=".85"') + circ(cx, cy, 5.5, 'fill="' + pal.x + '" opacity=".8"');
  if (m === 3) dec += circ(cx, cy, 6, 'fill="' + pal.c + '" opacity=".7"');
  if (m === 4) dec += luzinha(cx, cy, 3.4, pal.x, pal.e);
  return { defs: tinta(id, pal, m), corpo: s + dec + brilhoSol(m, 40, 38, 9, 5, -30) };
}

/* ── 1 · caranguejo ─────────────────────────────────────────── */
function garra(cx, cy, r, abre, gira) {
  const pts = [], a0 = gira - abre, a1 = gira + abre, n = 26;
  for (let i = 0; i <= n; i++) { const a = a1 + (2 * Math.PI - 2 * abre) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  let d = 'M' + f1(cx + r * .18 * Math.cos(gira)) + ' ' + f1(cy + r * .18 * Math.sin(gira));
  pts.forEach(p => d += 'L' + f1(p[0]) + ' ' + f1(p[1]));
  return d + 'Z';
}
function caranguejo(m, id) {
  const pal = PAL[1][m], L = LUZ[m];
  const perna = L === 'sol' ? pal.e : pal.c, linha = L === 'neon' ? pal.c : pal.e;
  const traco = (d, w, cor, op) => '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (op ? ' opacity="' + op + '"' : '') + '/>';
  const brilhoTraco = (d, w) => L === 'neon' ? traco(d, w + 5, pal.e, .28) : '';
  let s = halo(id, m);

  if (m === 2) { /* caranguejo-aranha: corpo em pera, pernas compridas */
    const pernas = ['M37 54Q18 42 5 49', 'M36 62Q15 59 4 69', 'M38 70Q20 77 8 88', 'M42 76Q31 89 23 96'];
    pernas.forEach(p => { s += traco(p, 3.4, perna) + traco(espelha(p), 3.4, perna); });
    const braco = 'M41 45Q33 38 29 30';
    s += traco(braco, 4, pal.b) + traco(espelha(braco), 4, pal.b);
    s += pinta(garra(27, 26, 7.5, .36, -1.9), id, pal, m) + pinta(espelha(garra(27, 26, 7.5, .36, -1.9)), id, pal, m);
    const casco = 'M50 35C61 35 69 47 67 60C65 73 58 81 50 81C42 81 35 73 33 60C31 47 39 35 50 35Z';
    s += pinta(casco, id, pal, m);
    [[44, 50, 2.2], [56, 52, 2.4], [50, 60, 2.6], [43, 64, 2], [57, 67, 2.2], [50, 72, 1.8]].forEach(q => s += circ(q[0], q[1], q[2], 'fill="' + pal.x + '" opacity=".45"'));
    s += traco('M47 37L45 29', 2.6, linha) + traco('M53 37L55 29', 2.6, linha);
    s += circ(45, 28, 3.4, 'fill="#fff" stroke="' + linha + '" stroke-width="1.2"') + circ(55, 28, 3.4, 'fill="#fff" stroke="' + linha + '" stroke-width="1.2"');
    s += circ(45.4, 28.5, 1.8, 'fill="#14142A"') + circ(55.4, 28.5, 1.8, 'fill="#14142A"');
    return { defs: tinta(id, pal, m, 42, 44), corpo: s + brilhoSol(m, 44, 45, 6, 3.4, -20) };
  }

  const R = m === 1 ? 14 : 12.5;
  const pernas = ['M27 62Q12 57 7 66', 'M27 68Q11 69 8 79', 'M30 74Q17 80 13 88'];
  pernas.forEach(p => { s += brilhoTraco(p, 4.6) + brilhoTraco(espelha(p), 4.6) + traco(p, 4.6, perna) + traco(espelha(p), 4.6, perna); });
  const braco = 'M33 48Q24 43 21 34';
  s += brilhoTraco(braco, 6) + brilhoTraco(espelha(braco), 6) + traco(braco, 6, L === 'sol' ? pal.b : pal.c) + traco(espelha(braco), 6, L === 'sol' ? pal.b : pal.c);
  const g = garra(18, 26, R, .42, -1.2);
  s += pinta(g, id, pal, m) + pinta(espelha(g), id, pal, m);
  if (m === 4) { /* caranguejo-yeti: pelos de luz nas garras */
    for (let i = 0; i < 7; i++) {
      const a = .2 + i * .62, x = 18 + (R + 1) * Math.cos(a), y = 26 + (R + 1) * Math.sin(a), x2 = 18 + (R + 6) * Math.cos(a), y2 = 26 + (R + 6) * Math.sin(a);
      const pelo = 'M' + f1(x) + ' ' + f1(y) + 'L' + f1(x2) + ' ' + f1(y2);
      s += traco(pelo, 1.8, pal.x, .9) + traco(espelha(pelo), 1.8, pal.x, .9);
    }
  }
  const casco = 'M20 60C20 45 33 37 50 37C67 37 80 45 80 60C80 72 67 80 50 80C33 80 20 72 20 60Z';
  s += pinta(casco, id, pal, m);
  if (m === 1) [[36, 55, 3.2], [50, 48, 3.8], [64, 55, 3.2], [43, 67, 2.6], [57, 67, 2.6]].forEach(q => s += circ(q[0], q[1], q[2], 'fill="' + pal.x + '" opacity=".95"'));
  if (m === 0) s += '<path d="M36 70Q50 76 64 70" fill="none" stroke="' + pal.e + '" stroke-width="2" stroke-linecap="round" opacity=".5"/>';
  if (m === 3) [[38, 56], [50, 50], [62, 56], [50, 65]].forEach(q => s += luzinha(q[0], q[1], 2.4, pal.x, pal.b));
  if (m === 4) [[36, 60], [50, 53], [64, 60], [43, 70], [57, 70]].forEach(q => s += luzinha(q[0], q[1], 2, pal.x, pal.e));
  s += traco('M44 39L42 30', 3.4, linha) + traco('M56 39L58 30', 3.4, linha);
  const olho = m === 4 ? pal.x : '#fff';
  s += circ(42, 28, 4.6, 'fill="' + olho + '" stroke="' + linha + '" stroke-width="1.4"') + circ(58, 28, 4.6, 'fill="' + olho + '" stroke="' + linha + '" stroke-width="1.4"');
  if (m !== 4) s += circ(42.6, 28.6, 2.4, 'fill="#14142A"') + circ(58.6, 28.6, 2.4, 'fill="#14142A"') + circ(41.4, 27, .9, 'fill="#fff"') + circ(57.4, 27, .9, 'fill="#fff"');
  return { defs: tinta(id, pal, m, 40, 44), corpo: s + brilhoSol(m, 40, 47, 10, 4.6, -12) };
}

/* ── 2 · concha em espiral (contorno de náutilo) ───────────── */
function concha(m, id) {
  const pal = PAL[2][m], L = LUZ[m];
  const K = 3.2, b = Math.log(K) / (2 * Math.PI), R = 43, phi0 = Math.PI * 0.86, N = 90;
  const esp = (th, esc) => { const r = R * esc * Math.exp(b * (th - 2 * Math.PI)); const a = phi0 + th; return [r * Math.cos(a), r * Math.sin(a)]; };
  /* contorno: a última volta da espiral, fechada pela boca */
  const bruto = [];
  for (let i = 0; i <= N; i++) bruto.push(esp(i / N * 2 * Math.PI, 1));
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  bruto.forEach(p => { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
  const esc = 88 / Math.max(maxx - minx, maxy - miny), ox = 50 - (minx + maxx) / 2 * esc, oy = 53 - (miny + maxy) / 2 * esc;
  const T = p => [ox + p[0] * esc, oy + p[1] * esc];
  const ptsFora = bruto.map(T);
  let d = 'M' + f1(ptsFora[0][0]) + ' ' + f1(ptsFora[0][1]);
  ptsFora.slice(1).forEach(p => d += 'L' + f1(p[0]) + ' ' + f1(p[1]));
  /* a boca abre para fora num lábio curvo */
  const rm = R * (1 + 1 / K) / 2, am = phi0 + .42, lab = T([rm * 1.1 * Math.cos(am), rm * 1.1 * Math.sin(am)]);
  d += 'Q' + f1(lab[0]) + ' ' + f1(lab[1]) + ' ' + f1(ptsFora[0][0]) + ' ' + f1(ptsFora[0][1]) + 'Z';
  const volta = (esc2, th0, th1, n) => { let q = ''; for (let i = 0; i <= n; i++) { const p = T(esp(th0 + (th1 - th0) * i / n, esc2)); q += (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); } return q; };
  const sutura = volta(1 / K, 0, 2 * Math.PI, 70) + volta(1 / (K * K), 0, 2 * Math.PI, 40);
  const faixa = e2 => volta(1 / K + e2 * (1 - 1 / K), .15, 2 * Math.PI - .1, 70);
  const boca = [T(esp(2 * Math.PI, 1)), T(esp(2 * Math.PI, 1 / K))];

  let s = halo(id, m) + pinta(d, id, pal, m), dec = '';
  const linhaCor = L === 'sol' ? pal.e : pal.c;
  if (m === 0) [.38, .62, .84].forEach(e2 => dec += '<path d="' + faixa(e2) + '" fill="none" stroke="' + pal.x + '" stroke-width="1.7" opacity=".45" stroke-linecap="round"/>');
  if (m === 1) dec += '<path d="' + faixa(.55) + '" fill="none" stroke="' + pal.x + '" stroke-width="5.5" stroke-dasharray="5 5" opacity=".85" stroke-linecap="round"/>' +
                      '<path d="' + faixa(.85) + '" fill="none" stroke="' + pal.x + '" stroke-width="2.4" stroke-dasharray="2 6" opacity=".7" stroke-linecap="round"/>';
  if (m === 2) for (let th = Math.PI * .95; th < 2 * Math.PI - .25; th += .34) {
    const a = T(esp(th, 1)), bq = T(esp(th - .22, .62));
    dec += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'Q' + f1((a[0] + bq[0]) / 2 + 2) + ' ' + f1((a[1] + bq[1]) / 2) + ' ' + f1(bq[0]) + ' ' + f1(bq[1]) + '" stroke="' + pal.x + '" stroke-width="3.4" stroke-linecap="round" opacity=".88" fill="none"/>';
  }
  if (L !== 'sol') for (let th = .5; th < 2 * Math.PI - .2; th += .52) { /* câmaras do náutilo aparecendo */
    const a = T(esp(th, 1 / K)), bq = T(esp(th + .18, .97));
    dec += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'Q' + f1((a[0] + bq[0]) / 2) + ' ' + f1((a[1] + bq[1]) / 2 - 1.5) + ' ' + f1(bq[0]) + ' ' + f1(bq[1]) + '" stroke="' + pal.c + '" stroke-width="1.4" opacity="' + (L === 'neon' ? .55 : .45) + '" fill="none"/>';
  }
  dec += '<path d="' + sutura + '" fill="none" stroke="' + linhaCor + '" stroke-width="' + (L === 'neon' ? 2.2 : 2.4) + '" stroke-linecap="round" opacity="' + (L === 'sol' ? .7 : .95) + '"/>';
  { const rm = R * (1 + 1 / K) / 2, am = phi0 + .42, lab = T([rm * 1.1 * Math.cos(am), rm * 1.1 * Math.sin(am)]);
    dec += '<path d="M' + f1(boca[0][0]) + ' ' + f1(boca[0][1]) + 'Q' + f1(lab[0]) + ' ' + f1(lab[1]) + ' ' + f1(boca[1][0]) + ' ' + f1(boca[1][1]) + '" fill="none" stroke="' + (L === 'sol' ? pal.c : pal.x) + '" stroke-width="3.4" stroke-linecap="round"/>'; }
  if (L === 'neon') { const c = T(esp(0, 1 / (K * K))); dec += luzinha(c[0], c[1], 2.6, pal.x, pal.e); }
  return { defs: tinta(id, pal, m, 40, 36), corpo: s + dec + brilhoSol(m, 36, 34, 10, 5.5, -35) };
}

/* ── 3 · ouriço ─────────────────────────────────────────────── */
function ourico(m, id) {
  const pal = PAL[3][m], L = LUZ[m];
  const cfg = [{n:20,L:19,w:3.4,rb:21}, {n:15,L:26,w:3.2,rb:18}, {n:11,L:19,w:7.4,rb:20}, {n:18,L:22,w:2.6,rb:20}, {n:16,L:24,w:2.4,rb:19}][m];
  const cx = 50, cy = 52;
  const acaso = i => ((Math.sin(i * 12.9898 + m * 7.3) * 43758.5453) % 1 + 1) % 1;
  let esp = '', pontas = '';
  for (let i = 0; i < cfg.n; i++) {
    const a = i / cfg.n * 2 * Math.PI + .12, len = cfg.L * (.84 + .16 * acaso(i));
    const x0 = cx + (cfg.rb - 3) * Math.cos(a), y0 = cy + (cfg.rb - 3) * Math.sin(a);
    const x1 = cx + (cfg.rb + len) * Math.cos(a), y1 = cy + (cfg.rb + len) * Math.sin(a);
    const xm = cx + (cfg.rb + len * .42) * Math.cos(a), ym = cy + (cfg.rb + len * .42) * Math.sin(a);
    const dd = 'M' + f1(x0) + ' ' + f1(y0) + 'L' + f1(x1) + ' ' + f1(y1), dp = 'M' + f1(xm) + ' ' + f1(ym) + 'L' + f1(x1) + ' ' + f1(y1);
    if (L === 'sol') {
      esp += '<path d="' + dd + '" stroke="' + pal.e + '" stroke-width="' + cfg.w + '" stroke-linecap="round"/>';
      if (m === 2) esp += '<path d="' + dd + '" stroke="' + pal.x + '" stroke-width="' + f1(cfg.w * .55) + '" stroke-dasharray="2.6 4" stroke-linecap="round" opacity=".7"/>';
      else esp += '<path d="' + dp + '" stroke="' + pal.c + '" stroke-width="' + f1(cfg.w * .5) + '" stroke-linecap="round"/>';
    } else if (L === 'vidro') {
      esp += '<path d="' + dd + '" stroke="' + pal.c + '" stroke-width="' + cfg.w + '" stroke-linecap="round" opacity=".75"/>';
      if (i % 2 === 0) pontas += luzinha(x1, y1, 1.9, pal.x, pal.b);
    } else {
      esp += '<path d="' + dd + '" stroke="' + pal.e + '" stroke-width="' + (cfg.w + 4.5) + '" stroke-linecap="round" opacity=".22"/>' +
             '<path d="' + dd + '" stroke="' + pal.c + '" stroke-width="' + cfg.w + '" stroke-linecap="round"/>';
      if (i % 2 === 0) pontas += luzinha(x1, y1, 1.8, pal.x, pal.e);
    }
  }
  const corpo = 'M' + (cx - cfg.rb) + ' ' + cy + 'a' + cfg.rb + ' ' + cfg.rb + ' 0 1 0 ' + (2 * cfg.rb) + ' 0a' + cfg.rb + ' ' + cfg.rb + ' 0 1 0 ' + (-2 * cfg.rb) + ' 0Z';
  let dec = '';
  for (let k = 0; k < 5; k++) for (let j = 1; j <= 3; j++) {
    const a = -Math.PI / 2 + k * 2 * Math.PI / 5, dist = j * cfg.rb * .27;
    const x = cx + dist * Math.cos(a), y = cy + dist * Math.sin(a) * .92;
    if (L === 'neon') dec += luzinha(x, y, 1.1, pal.x, pal.e);
    else dec += circ(x, y, 1.6, 'fill="' + (L === 'sol' ? pal.c : pal.x) + '" opacity="' + (L === 'sol' ? .75 : .8) + '"');
  }
  return { defs: tinta(id, pal, m, 43, 44), corpo: halo(id, m) + esp + pinta(corpo, id, pal, m) + dec + pontas + brilhoSol(m, 43, 44, 7, 4, -30) };
}

/* ── 4 · peixe ──────────────────────────────────────────────── */
function peixe(m, id) {
  const pal = PAL[4][m], L = LUZ[m];
  const lins = lin(id + 'v', [[0, pal.e], [.42, pal.b], [1, pal.c]], 0, 26, 0, 78);
  let s = halo(id, m);

  if (m === 4) { /* peixe-diabo: boca enorme e isca de luz */
    const corpo = 'M31 45C34 30 48 22 62 23C78 25 88 38 87 55C86 72 72 84 56 84C43 84 33 77 30 68L44 62L31 56Z';
    s += '<path d="M84 50L97 41L96 67L84 61Z" fill="url(#' + id + ')" stroke="' + pal.c + '" stroke-width="2" stroke-linejoin="round"/>';
    s += pinta(corpo, id, pal, m);
    s += '<path d="M31 56L44 62L30 68C27 64 27 60 31 56Z" fill="#000" opacity=".85"/>';
    for (let i = 0; i < 4; i++) s += '<path d="M' + (33 + i * 3) + ' ' + (57.4 + i * 1.3) + 'l1.4 3.6l1.4-3.3Z" fill="' + pal.x + '"/>';
    for (let i = 0; i < 4; i++) s += '<path d="M' + (32 + i * 3) + ' ' + (67.6 - i * 1.2) + 'l1.4-3.6l1.4 3.3Z" fill="' + pal.x + '"/>';
    s += '<path d="M54 25C48 11 31 8 23 17" fill="none" stroke="' + pal.e + '" stroke-width="5" opacity=".3" stroke-linecap="round"/>' +
         '<path d="M54 25C48 11 31 8 23 17" fill="none" stroke="' + pal.c + '" stroke-width="2" stroke-linecap="round"/>';
    s += circ(22, 19, 13, 'fill="' + pal.x + '" opacity=".13"') + luzinha(22, 19, 4.6, pal.x, pal.e);
    s += circ(48, 44, 3.6, 'fill="' + pal.x + '" opacity=".95"') + circ(48.6, 44.4, 1.6, 'fill="#000"');
    [[64, 44], [72, 56], [62, 66]].forEach(q => s += luzinha(q[0], q[1], 1.4, pal.x, pal.e));
    return { defs: tinta(id, pal, m, 58, 46), corpo: s };
  }

  const formas = {
    base: 'M10 53C14 37 32 27 52 29C63 30 72 37 77 45L91 33C95 41 95 63 91 71L77 59C72 67 63 74 52 75C32 77 14 69 10 53Z',
    gordo: 'M9 52C11 33 30 23 52 25C64 26 72 34 77 43L91 31C95 40 95 64 91 73L77 61C72 70 64 78 52 79C30 81 11 71 9 52Z',
    fino: 'M12 52C16 40 32 33 50 34C62 35 71 40 77 46L90 36C93 43 93 61 90 68L77 58C71 64 62 69 50 70C32 71 16 64 12 52Z'
  };
  const corpo = m === 2 ? formas.gordo : m === 3 ? formas.fino : formas.base;
  const dorsal = m === 2 ? 'M36 27C41 14 58 12 67 30Z' : m === 3 ? 'M40 35C45 26 56 25 62 36Z' : 'M38 31C42 18 58 15 66 33Z';
  const peitoral = 'M40 58C46 62 52 66 50 71C44 69 40 64 40 58Z';
  const fin = L === 'sol' ? pal.e : pal.c;
  s += '<path d="' + dorsal + '" fill="' + fin + '"' + (L === 'sol' ? '' : ' fill-opacity=".45" stroke="' + pal.c + '" stroke-width="1.6"') + '/>';
  if (L === 'sol') s += '<path d="' + corpo + '" fill="url(#' + id + 'v)"/>';
  else s += pinta(corpo, id, pal, m);
  if (m === 1) {
    s += '<clipPath id="' + id + 'cl"><path d="' + corpo + '"/></clipPath><g clip-path="url(#' + id + 'cl)">' +
         '<path d="M42 20Q37 52 44 84L54 84Q48 52 53 20Z" fill="' + pal.x + '" opacity=".85"/>' +
         '<path d="M62 22Q57 52 64 82L71 80Q65 52 70 24Z" fill="' + pal.x + '" opacity=".85"/>' +
         '<path d="M77 45L91 33C95 41 95 63 91 71L77 59Z" fill="#FFD84A"/></g>';
  }
  if (m === 2) {
    s += '<clipPath id="' + id + 'cl"><path d="' + corpo + '"/></clipPath><g clip-path="url(#' + id + 'cl)" fill="none" stroke="' + pal.x + '" stroke-width="1.5" opacity=".75">';
    for (let y = 34; y <= 70; y += 9) for (let x = 34 + ((y / 9) % 2) * 4.5; x <= 74; x += 9) s += '<path d="M' + (x - 4.5) + ' ' + y + 'Q' + x + ' ' + (y + 6) + ' ' + (x + 4.5) + ' ' + y + '"/>';
    s += '</g><path d="M8 50C8 45 13 42 17 46L17 58C13 61 8 59 8 54Z" fill="#E6F0FF"/>';
  }
  s += '<path d="' + peitoral + '" fill="' + fin + '" opacity="' + (L === 'sol' ? .9 : .6) + '"/>';
  s += '<path d="M35 40Q30 53 35 66" fill="none" stroke="' + (L === 'sol' ? pal.e : pal.c) + '" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>';
  if (m === 3) {
    [[27, 60], [34, 62.5], [41, 64], [48, 64.6], [55, 64.2], [62, 62.6], [69, 60.4], [20, 57], [31, 56]].forEach(q => s += luzinha(q[0], q[1], 1.8, pal.x, pal.x));
    s += circ(25, 47, 8.4, 'fill="#DDEBFF" opacity=".9"') + circ(24.4, 47.6, 5, 'fill="#0A0F24"') + circ(22.6, 45.4, 1.8, 'fill="#fff"');
  } else {
    s += circ(26, 47, 6, 'fill="#fff"') + circ(25.2, 47.6, 3.4, 'fill="#10132A"') + circ(24, 45.8, 1.2, 'fill="#fff"');
    s += '<path d="M11 55Q14 57.5 17.5 56" fill="none" stroke="' + pal.e + '" stroke-width="1.8" stroke-linecap="round"/>';
  }
  return { defs: lins + tinta(id, pal, m, 40, 40), corpo: s + brilhoSol(m, 46, 36, 10, 3.6, -8) };
}

/* ── 5 · água-viva ──────────────────────────────────────────── */
function aguaviva(m, id) {
  const pal = PAL[5][m], L = LUZ[m];
  const tent = L === 'neon' ? pal.c : pal.c;
  let s = halo(id, m);
  const plano = m === 2;
  const sino = plano
    ? 'M12 45C12 25 29 13 50 13C71 13 88 25 88 45C81 50 19 50 12 45Z'
    : 'M18 48C18 26 32 13 50 13C68 13 82 26 82 48C78 51 74 46 70 50C66 46 62 51 58 47C54 51 46 51 42 47C38 51 34 46 30 50C26 46 22 51 18 48Z';
  const fitas = plano
    ? ['M44 47C39 60 48 69 42 86C48 81 53 71 50 59Z', 'M56 47C61 60 52 69 58 86C52 81 47 71 50 59Z',
       'M34 47C30 56 37 63 31 74C37 71 41 63 40 52Z', 'M66 47C70 56 63 63 69 74C63 71 59 63 60 52Z']
    : ['M44 48C39 60 48 68 42 83C48 79 53 70 50 58Z', 'M56 48C61 60 52 68 58 83C52 79 47 70 50 58Z'];
  if (plano) {
    let fr = '';
    for (let x = 15; x <= 85; x += 3.2) fr += 'M' + f1(x) + ' 46.5L' + f1(x + (x - 50) * .05) + ' ' + f1(53 + ((x * 7) % 6)) ;
    s += '<path d="' + fr + '" stroke="' + pal.c + '" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>';
  } else {
    [25, 37, 50, 63, 75].forEach((x, i) => {
      const onda = i % 2 ? 5 : -5, d = 'M' + x + ' 49C' + (x + onda) + ' 60 ' + (x - onda) + ' 70 ' + x + ' 80S' + (x + onda * .8) + ' 88 ' + (x - 1) + ' 94';
      if (L === 'neon') s += '<path d="' + d + '" fill="none" stroke="' + pal.e + '" stroke-width="5" opacity=".22" stroke-linecap="round"/>';
      s += '<path d="' + d + '" fill="none" stroke="' + tent + '" stroke-width="2.1" opacity="' + (L === 'sol' ? .85 : .9) + '" stroke-linecap="round"/>';
    });
  }
  fitas.forEach(f => s += '<path d="' + f + '" fill="' + (L === 'sol' ? pal.b : pal.c) + '" opacity="' + (L === 'sol' ? .8 : .55) + '"/>');
  if (L === 'sol') s += '<path d="' + sino + '" fill="url(#' + id + ')" fill-opacity=".94" stroke="' + pal.e + '" stroke-width="1.4" stroke-opacity=".45"/>';
  else s += pinta(sino, id, pal, m);
  if (m === 0) s += '<path d="M28 36C30 25 39 19 48 18" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".6"/>';
  if (m === 1) { s += '<path d="M28 36C30 25 39 19 48 18" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".55"/>';
    [[38, 30, 2.6], [52, 24, 3], [63, 31, 2.8], [46, 38, 2.4], [60, 41, 2.2], [32, 42, 2]].forEach(q => s += circ(q[0], q[1], q[2], 'fill="' + pal.x + '"')); }
  if (m === 2) { [[42, 31], [58, 31], [50, 24], [50, 38]].forEach(q => s += circ(q[0], q[1], 4.6, 'fill="none" stroke="' + pal.x + '" stroke-width="2.8" opacity=".85"'));
    s += '<path d="M24 32C26 23 35 18 44 17" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".6"/>'; }
  if (m === 3) [22, 31, 40, 50, 60, 69, 78].forEach((x, i) => s += luzinha(x, i % 2 ? 49.5 : 48, 1.8, pal.x, pal.b));
  if (m === 4) { s += '<ellipse cx="50" cy="33" rx="20" ry="10" fill="none" stroke="' + pal.e + '" stroke-width="6" opacity=".3"/>' +
                      '<ellipse cx="50" cy="33" rx="20" ry="10" fill="none" stroke="' + pal.x + '" stroke-width="2"/>';
    for (let k = 0; k < 8; k++) { const a = Math.PI * (.08 + k * .12); s += '<path d="M50 22L' + f1(50 - 31 * Math.cos(a)) + ' ' + f1(22 + 26 * Math.sin(a)) + '" stroke="' + pal.c + '" stroke-width="1" opacity=".35"/>'; } }
  return { defs: tinta(id, pal, m, 42, 22), corpo: s };
}

/* ── especiais ──────────────────────────────────────────────── */
function correnteza(vertical) {
  /* água correndo por cima da peça, com setas nas duas pontas */
  const g = vertical ? ' transform="rotate(90 50 50)"' : '';
  const setas = 'M17 38L6 50L17 62M27 38L16 50L27 62M83 38L94 50L83 62M73 38L84 50L73 62';
  return '<g' + g + '>' +
    '<path d="M4 34H96M4 50H96M4 66H96" stroke="#062638" stroke-width="7" stroke-linecap="round" opacity=".32"/>' +
    '<path d="M4 34H96M4 50H96M4 66H96" stroke="#F3FBFF" stroke-width="3" stroke-linecap="round" stroke-dasharray="14 10" opacity=".95">' +
      '<animate attributeName="stroke-dashoffset" from="0" to="-24" dur=".7s" repeatCount="indefinite"/></path>' +
    '<path d="' + setas + '" fill="none" stroke="#062638" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>' +
    '<path d="' + setas + '" fill="none" stroke="#F3FBFF" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</g>';
}
function bolha() {
  return rad('bolha-g', [[0, '#fff', 0], [.72, '#DFF8FF', .08], [.93, '#DFF8FF', .45], [1, '#fff', .9]], 50, 50, 47) +
    circ(50, 50, 46, 'fill="url(#bolha-g)" stroke="#F3FBFF" stroke-width="2.6"') +
    '<path d="M20 34A33 33 0 0 1 40 16" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" opacity=".9"/>' +
    circ(76, 72, 4.4, 'fill="#fff" opacity=".85"') + circ(84, 60, 2.4, 'fill="#fff" opacity=".7"') +
    '<path d="M72 80A33 33 0 0 0 83 67" fill="none" stroke="#9FE9FF" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>';
}
function perola(m) {
  const escuro = m >= 3;
  return '<defs>' +
    rad('per-g', [[0, '#FFFFFF'], [.3, '#F6EEFF'], [.62, '#D9EBFF'], [.86, '#BDAEE9'], [1, '#8E7FCB']], 38, 34, 44) +
    rad('per-h', [[0, '#FFFFFF', escuro ? .6 : .45], [.6, '#CFE9FF', escuro ? .22 : .12], [1, '#CFE9FF', 0]], 50, 50, 50) +
    lin('per-i', [[0, '#FF9ED8', 0], [.5, '#FF9ED8', .55], [1, '#7FE8FF', .0]], 20, 30, 80, 70) +
    '</defs>' +
    circ(50, 50, 50, 'fill="url(#per-h)"') +
    circ(50, 51, 35, 'fill="url(#per-g)"') +
    '<ellipse cx="50" cy="51" rx="35" ry="12" fill="url(#per-i)" transform="rotate(-32 50 51)"/>' +
    '<ellipse cx="50" cy="51" rx="29" ry="7" fill="#7FE8FF" opacity=".22" transform="rotate(38 50 51)"/>' +
    '<ellipse cx="39" cy="37" rx="10" ry="6" fill="#fff" opacity=".92" transform="rotate(-35 39 37)"/>' +
    '<path d="M74 20l2.6 6.4 6.4 2.6-6.4 2.6-2.6 6.4-2.6-6.4-6.4-2.6 6.4-2.6Z" fill="#fff" opacity=".95"/>';
}

const FAMILIAS = [estrela, caranguejo, concha, ourico, peixe, aguaviva];

/* tudo que um mundo precisa: defs + símbolos s0..s5 + especiais.
   pre deixa gerar vários mundos na mesma página (catálogo, testes). */
function simbolos(m, pre) {
  pre = pre || '';
  let defs = '', syms = '';
  FAMILIAS.forEach((fn, t) => {
    const r = fn(m, pre + 'g' + t);
    defs += r.defs;
    syms += '<symbol id="' + pre + 's' + t + '" viewBox="0 0 100 100">' + r.corpo + '</symbol>';
  });
  syms += '<symbol id="' + pre + 'sp-lh" viewBox="0 0 100 100">' + correnteza(false) + '</symbol>' +
          '<symbol id="' + pre + 'sp-lv" viewBox="0 0 100 100">' + correnteza(true) + '</symbol>' +
          '<symbol id="' + pre + 'sp-bomba" viewBox="0 0 100 100">' + bolha().replace(/bolha-g/g, pre + 'bolha-g') + '</symbol>' +
          '<symbol id="' + pre + 's-arco" viewBox="0 0 100 100">' + perola(m).replace(/per-([ghi])/g, pre + 'per-$1') + '</symbol>';
  return '<defs>' + defs + '</defs>' + syms;
}
