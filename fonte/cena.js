
/* ═══ CENÁRIO ═══════════════════════════════════════════════════
   O chão não é mais fixo por mundo: cada região escolhe uma peça
   de cenário por faixa de profundidade, pintada com as cores
   daquela região.                                                */

const hex = (c, t) => '#' + mistura(c, t < 0 ? '#000000' : '#ffffff', Math.abs(t));
function luminancia(c) {
  const n = [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16) / 255);
  return .2126 * n[0] + .7152 * n[1] + .0722 * n[2];
}
function rgba(c, a) {
  const n = [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
  return 'rgba(' + n[0] + ',' + n[1] + ',' + n[2] + ',' + a + ')';
}

const PROPS = {
  duna: p =>
    '<path d="M0 116Q70 96 140 110T280 104T400 100V170H0Z" fill="' + p.areia + '"/>' +
    '<path d="M0 136Q90 120 180 132T360 126T400 128V170H0Z" fill="' + hex(p.areia, -.12) + '"/>' +
    '<g fill="none" stroke="' + hex(p.areia, -.25) + '" stroke-width="2" stroke-linecap="round" opacity=".55">' +
    '<path d="M24 150q14-5 28 0t28 0"/><path d="M150 156q14-5 28 0t28 0"/><path d="M290 148q14-5 28 0t28 0"/></g>' +
    '<g fill="' + p.vida + '" opacity=".8"><path d="M46 118q-8-30 3-58q-1 30 5 58Z"/><path d="M56 118q2-26 16-44q-9 24-9 44Z"/>' +
    '<path d="M338 108q-6-26 5-50q-1 26 5 50Z"/><path d="M348 108q4-20 16-34q-8 20-9 34Z"/></g>',
  coral: p =>
    '<path d="M0 128Q60 112 120 124T250 118T400 122V170H0Z" fill="' + p.fundo + '"/>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M58 126V92M58 106l-16-16M58 100l14-18M42 90l-6-14M72 82l8-10M58 92V70" stroke="' + p.vida + '" stroke-width="7" opacity=".85"/>' +
    '<path d="M330 124V96M330 110l14-12M330 104l-12-14M344 98l4-12M318 90l-4-10" stroke="' + p.acento + '" stroke-width="6" opacity=".7"/></g>' +
    '<path d="M150 126c0-22 18-34 36-34s36 12 36 34Z" fill="' + hex(p.vida, -.25) + '" opacity=".75"/>' +
    '<path d="M156 118q30-8 60 0M160 108q26-8 52 0M168 99q18-6 36 0" fill="none" stroke="' + hex(p.vida, -.45) + '" stroke-width="2.4" opacity=".7"/>' +
    '<path d="M262 126q-4-30 14-50q18 20 14 50Z" fill="' + p.acento + '" opacity=".4"/>',
  casco: p =>
    '<path d="M0 132Q80 120 170 128T400 124V170H0Z" fill="' + p.fundo + '"/>' +
    '<g opacity=".95"><path d="M196 124L214 70Q280 58 354 76L372 126Z" fill="' + hex(p.fundo, -.35) + '"/>' +
    '<path d="M214 70Q280 58 354 76" fill="none" stroke="' + hex(p.fundo, .12) + '" stroke-width="4"/>' +
    '<path d="M250 64L236 8M236 8l26 10" fill="none" stroke="' + hex(p.fundo, -.35) + '" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="246" cy="96" r="6" fill="' + p.acento + '" opacity=".5"/><circle cx="276" cy="92" r="6" fill="' + p.acento + '" opacity=".4"/>' +
    '<circle cx="306" cy="94" r="6" fill="' + p.acento + '" opacity=".5"/></g>',
  pedra: p =>
    '<path d="M0 124Q40 110 90 120T190 112T300 118T400 110V170H0Z" fill="' + hex(p.fundo, -.25) + '"/>' +
    '<path d="M60 122L92 78L128 122Z" fill="' + hex(p.fundo, -.08) + '"/>' +
    '<path d="M250 120L286 66L330 120Z" fill="' + hex(p.fundo, -.14) + '"/>' +
    '<path d="M150 124L176 96L206 124Z" fill="' + hex(p.fundo, -.02) + '"/>' +
    '<g fill="' + p.acento + '" opacity=".55"><circle cx="96" cy="86" r="3"/><circle cx="288" cy="74" r="2.6"/><circle cx="178" cy="102" r="2.2"/></g>',
  kelp: p => {
    let s = '<path d="M0 134Q90 122 190 130T400 126V170H0Z" fill="' + p.fundo + '"/>';
    for (let i = 0; i < 7; i++) {
      const x = 22 + i * 56, alt = 70 + ((i * 37) % 60), lado = i % 2 ? 1 : -1;
      const d = 'M' + x + ' 132C' + (x + 16 * lado) + ' ' + (132 - alt / 3) + ' ' + (x - 14 * lado) + ' ' + (132 - alt * .7) + ' ' + (x + 6 * lado) + ' ' + (132 - alt);
      s += '<path d="' + d + '" fill="none" stroke="' + p.vida + '" stroke-width="7" stroke-linecap="round" opacity=".75"/>' +
           '<path d="' + d + '" fill="none" stroke="' + hex(p.vida, .25) + '" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>';
    }
    return s;
  },
  gelo: p =>
    '<path d="M0 128Q80 118 170 126T400 120V170H0Z" fill="' + hex(p.gelo, -.35) + '"/>' +
    '<path d="M20 126L64 72L104 126Z" fill="' + p.gelo + '" opacity=".92"/>' +
    '<path d="M64 72L84 100L104 126L74 118Z" fill="' + hex(p.gelo, .2) + '" opacity=".8"/>' +
    '<path d="M250 124L300 60L356 124Z" fill="' + p.gelo + '" opacity=".88"/>' +
    '<path d="M300 60L318 96L356 124L312 112Z" fill="' + hex(p.gelo, .22) + '" opacity=".75"/>' +
    '<path d="M150 0L182 34L208 0Z" fill="' + p.gelo + '" opacity=".5"/>' +
    '<path d="M40 0L58 22L78 0Z" fill="' + p.gelo + '" opacity=".35"/>',
  raizes: p => {
    let s = '<path d="M0 138Q90 126 190 134T400 130V170H0Z" fill="' + hex(p.fundo, -.2) + '"/>';
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 82;
      s += '<path d="M' + x + ' 136C' + (x - 26) + ' 110 ' + (x - 40) + ' 96 ' + (x - 30) + ' 60" fill="none" stroke="' + p.madeira + '" stroke-width="9" stroke-linecap="round"/>' +
           '<path d="M' + x + ' 136C' + (x + 22) + ' 112 ' + (x + 34) + ' 92 ' + (x + 26) + ' 58" fill="none" stroke="' + p.madeira + '" stroke-width="7" stroke-linecap="round"/>' +
           '<path d="M' + (x - 12) + ' 120C' + (x - 2) + ' 104 ' + (x + 8) + ' 100 ' + (x + 14) + ' 86" fill="none" stroke="' + hex(p.madeira, -.2) + '" stroke-width="5" stroke-linecap="round" opacity=".8"/>';
    }
    return s;
  },
  ruinas: p =>
    '<path d="M0 132Q100 122 200 130T400 126V170H0Z" fill="' + hex(p.fundo, -.15) + '"/>' +
    '<g fill="' + p.pedra + '" opacity=".9">' +
    '<rect x="44" y="52" width="26" height="80" rx="4"/><rect x="36" y="44" width="42" height="10" rx="3"/>' +
    '<rect x="300" y="66" width="26" height="66" rx="4"/><rect x="292" y="58" width="42" height="10" rx="3"/>' +
    '<rect x="150" y="118" width="120" height="14" rx="4"/><rect x="168" y="104" width="86" height="14" rx="4"/>' +
    '<rect x="186" y="90" width="52" height="14" rx="4"/></g>' +
    '<g fill="' + p.vida + '" opacity=".55"><path d="M44 66q14-8 26 0v10q-14-8-26 0Z"/><path d="M300 80q14-8 26 0v10q-14-8-26 0Z"/></g>',
  cristal: p =>
    '<path d="M0 126Q60 116 130 122T400 118V170H0Z" fill="' + hex(p.fundo, -.3) + '"/>' +
    '<g opacity=".9"><path d="M60 124L84 58L106 124Z" fill="' + p.acento + '" opacity=".55"/>' +
    '<path d="M84 58L96 92L106 124L88 112Z" fill="' + p.acento + '" opacity=".85"/>' +
    '<path d="M280 122L300 70L322 122Z" fill="' + p.acento + '" opacity=".5"/>' +
    '<path d="M180 124L196 88L212 124Z" fill="' + p.acento + '" opacity=".7"/></g>' +
    '<g fill="' + p.acento + '" opacity=".28"><circle cx="90" cy="70" r="22"/><circle cx="300" cy="82" r="18"/><circle cx="196" cy="98" r="14"/></g>',
  fumarola: p =>
    '<path d="M0 124Q40 110 90 120T190 112T300 118T400 110V170H0Z" fill="' + hex(p.fundo, -.3) + '"/>' +
    '<path d="M322 118L334 72L352 70L362 116Z" fill="' + hex(p.fundo, -.08) + '"/>' +
    '<ellipse cx="343" cy="70" rx="14" ry="6" fill="#FF8A3D" opacity=".35"/>' +
    '<ellipse cx="343" cy="46" rx="22" ry="14" fill="#FF8A3D" opacity=".12"/>' +
    '<path d="M70 118L82 86L98 84L106 116Z" fill="' + hex(p.fundo, -.04) + '"/>' +
    '<ellipse cx="88" cy="84" rx="11" ry="5" fill="#FF8A3D" opacity=".3"/>' +
    '<g stroke="' + p.acento + '" stroke-width="1.6" opacity=".7"><path d="M170 118V96"/><path d="M230 116V100"/></g>' +
    '<g fill="' + p.acento + '"><circle cx="170" cy="95" r="3"/><circle cx="230" cy="99" r="2.4"/></g>',
  sargaco: p => {
    let s = '<path d="M0 140Q100 130 200 138T400 134V170H0Z" fill="' + hex(p.fundo, -.2) + '"/>';
    s += '<path d="M0 0Q60 18 120 6T260 14T400 4V22Q300 34 200 22T60 30T0 18Z" fill="' + p.vida + '" opacity=".55"/>';
    for (let i = 0; i < 9; i++) {
      const x = 14 + i * 44, alt = 24 + ((i * 53) % 40);
      s += '<path d="M' + x + ' 20q6 ' + (alt / 2) + ' -2 ' + alt + '" fill="none" stroke="' + p.vida + '" stroke-width="4" stroke-linecap="round" opacity=".5"/>';
    }
    return s;
  },
  longe: p =>
    '<g opacity=".2" fill="' + p.acento + '"><path d="M60 60c0-14 10-22 22-22s22 8 22 22c-4 2-40 2-44 0Z"/>' +
    '<path d="M66 62q-3 16 2 30M78 62q2 18-2 34M92 62q4 14 0 28" stroke="' + p.acento + '" stroke-width="2" fill="none"/>' +
    '<path d="M300 30c0-10 8-16 16-16s16 6 16 16c-3 2-29 2-32 0Z"/>' +
    '<path d="M306 32q-2 12 2 22M318 32q2 12-1 24" stroke="' + p.acento + '" stroke-width="1.6" fill="none"/></g>'
};

function acasoCena(i, k) { return ((Math.sin(i * 91.7 + k * 13.3) * 43758.5453) % 1 + 1) % 1; }

function particulas(m, acento) {
  let s = '';
  if (m <= 2) {
    const n = [12, 10, 7][m];
    for (let i = 0; i < n; i++) {
      const t = 5 + acasoCena(i, 1) * 8;
      s += '<i class="bolha-amb" style="left:' + (acasoCena(i, 2) * 96).toFixed(1) + '%;width:' + t.toFixed(1) + 'px;height:' + t.toFixed(1) +
           'px;animation-duration:' + (8 + acasoCena(i, 3) * 9).toFixed(1) + 's;animation-delay:-' + (acasoCena(i, 4) * 14).toFixed(1) + 's"></i>';
    }
  } else if (m === 3) {
    for (let i = 0; i < 22; i++) {
      const t = 1.6 + acasoCena(i, 1) * 2.4;
      s += '<i class="neve" style="left:' + (acasoCena(i, 2) * 100).toFixed(1) + '%;width:' + t.toFixed(1) + 'px;height:' + t.toFixed(1) +
           'px;animation-duration:' + (16 + acasoCena(i, 3) * 16).toFixed(1) + 's;animation-delay:-' + (acasoCena(i, 4) * 30).toFixed(1) + 's"></i>';
    }
  } else {
    const cores = [acento, '#9A5CFF', '#5CFF9E', '#5CB4FF', '#FF7390'];
    for (let i = 0; i < 18; i++) {
      const cor = cores[i % cores.length];
      s += '<i class="faisca-bio" style="left:' + (acasoCena(i, 2) * 100).toFixed(1) + '%;top:' + (acasoCena(i, 5) * 88).toFixed(1) +
           '%;background:' + cor + ';box-shadow:0 0 8px 2px ' + cor + ';animation-duration:' + (2.6 + acasoCena(i, 3) * 4).toFixed(1) +
           's;animation-delay:-' + (acasoCena(i, 4) * 6).toFixed(1) + 's"></i>';
    }
  }
  return s;
}

function nadadores(m) {
  const bicho = m === 4 ? 's5' : 's4';
  let s = '';
  for (let i = 0; i < 2; i++) {
    const tam = 30 + acasoCena(i, 7) * 26, topo = 14 + acasoCena(i, 8) * 52;
    s += '<div class="nadador' + (i ? ' volta' : '') + '" style="top:' + topo.toFixed(1) + '%;width:' + tam.toFixed(0) + 'px;height:' + tam.toFixed(0) +
         'px;animation-duration:' + (26 + acasoCena(i, 9) * 22).toFixed(1) + 's;animation-delay:-' + (acasoCena(i, 10) * 20).toFixed(1) +
         's"><svg viewBox="0 0 100 100"><use href="#' + bicho + '"/></svg></div>';
  }
  return s;
}

function paletaChao(amb) {
  const r = amb.reg;
  return { fundo: r.agua[Math.min(amb.banda + 1, 5)], acento: r.acento, vida: r.agua[1],
           pedra: r.moldura, areia: r.moldura, gelo: hex(r.agua[0], .3), madeira: r.moldura };
}

function cena(m, amb) {
  let s = '';
  if (m <= 1) s += '<div class="causticas"></div>';
  if (m <= 2) s += '<div class="raios"><i></i><i></i><i></i><i></i><i></i></div>';
  s += '<svg class="chao" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
       (PROPS[amb.chao] || PROPS.pedra)(paletaChao(amb)) + '</svg>';
  s += nadadores(m);
  s += '<div class="particulas">' + particulas(m, amb.reg.acento) + '</div>';
  return s;
}

function coresBanda(reg, k) {
  const t = reg.agua[k], f = reg.agua[Math.min(k + 1, 5)];
  return [t, '#' + mistura(t, f, .45), '#' + mistura(t, f, .82), f];
}

/* ═══ TROCA DE AMBIENTE ═════════════════════════════════════════
   A profundidade manda na luz e nas peças; a região pinta a água,
   o chão, a moldura da mesa e o que cobre o fundo.                */
let mundoAtual = -1, ambAtual = null;

function instalaMundo(m, i) {
  const amb = ambiente(i == null ? 0 : i);
  const igual = (m === mundoAtual && ambAtual && ambAtual.reg === amb.reg && ambAtual.chao === amb.chao);
  ambAtual = amb;
  const raiz = document.documentElement.style, c = coresBanda(amb.reg, amb.banda);
  c.forEach((cor, k) => raiz.setProperty('--ag' + (k + 1), cor));
  raiz.setProperty('--moldura', amb.reg.moldura);
  raiz.setProperty('--acento', amb.reg.acento);
  /* a mesa precisa ser sempre escura o bastante para a peça saltar,
     mesmo quando a água da região é clara */
  const escuro = luminancia(c[3]) > .45 ? .72 : .5;
  raiz.setProperty('--mesa-a', rgba('#' + mistura(c[3], '#000000', escuro), .68));
  raiz.setProperty('--mesa-b', rgba('#' + mistura(c[3], '#000000', escuro + .16), .78));
  raiz.setProperty('--bl-a', amb.bloq.a); raiz.setProperty('--bl-b', amb.bloq.b);
  raiz.setProperty('--bl-a2', amb.bloq.a2); raiz.setProperty('--bl-b2', amb.bloq.b2);
  document.body.dataset.tex = amb.bloq.tex;
  document.body.dataset.mundo = m;
  const cx = document.getElementById('cena');
  cx.style.filter = amb.tom || '';
  if (igual) return;
  mundoAtual = m;
  document.getElementById('defs-pecas').innerHTML = simbolos(m, '');
  cx.innerHTML = cena(m, amb);
  Som.m = m;
}
function corDaBarra(cor) { const t = document.querySelector('meta[name="theme-color"]'); if (t) t.setAttribute('content', cor); }
const COR_TOPO = ['#9BE9E0', '#3FC0C6', '#1A6E98', '#123067', '#0A0F28'];
