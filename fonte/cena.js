
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
  anemonas: p => {
    let s = '<path d="M0 130Q80 118 170 126T400 122V170H0Z" fill="' + hex(p.fundo, -.2) + '"/>';
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 66, alt = 22 + ((i * 29) % 20), cor = i % 2 ? p.acento : p.vida;
      s += '<ellipse cx="' + x + '" cy="' + (126 - alt * .3) + '" rx="' + (14 + alt * .2) + '" ry="' + (alt * .5) + '" fill="' + cor + '" opacity=".45"/>';
      for (let j = 0; j < 9; j++) {
        const a = -Math.PI + (j / 8) * Math.PI;
        s += '<path d="M' + x + ' ' + (126 - alt * .3) + 'q' + (Math.cos(a) * 10).toFixed(1) + ' ' + (-alt * .7).toFixed(1) + ' ' + (Math.cos(a) * 18).toFixed(1) + ' ' + (-alt).toFixed(1) +
             '" fill="none" stroke="' + cor + '" stroke-width="3" stroke-linecap="round" opacity=".8"/>';
      }
    }
    return s;
  },
  esponjas: p =>
    '<path d="M0 132Q90 120 190 128T400 124V170H0Z" fill="' + hex(p.fundo, -.22) + '"/>' +
    '<g fill="' + p.vida + '" opacity=".75">' +
    '<path d="M50 130V96q0-14 16-14t16 14v34Z"/><ellipse cx="66" cy="96" rx="16" ry="6" fill="' + hex(p.vida, -.3) + '"/>' +
    '<path d="M300 128V84q0-16 18-16t18 16v44Z"/><ellipse cx="318" cy="84" rx="18" ry="7" fill="' + hex(p.vida, -.3) + '"/>' +
    '<path d="M180 130V106q0-10 12-10t12 10v24Z"/></g>' +
    '<g fill="' + p.acento + '" opacity=".5"><circle cx="120" cy="124" r="7"/><circle cx="240" cy="126" r="5"/><circle cx="360" cy="122" r="6"/></g>',
  tubulacao: p =>
    '<path d="M0 134Q100 124 200 132T400 128V170H0Z" fill="' + hex(p.fundo, -.25) + '"/>' +
    '<g fill="' + hex(p.pedra, -.4) + '"><rect x="0" y="108" width="400" height="16" rx="8"/>' +
    '<rect x="96" y="100" width="16" height="32" rx="4"/><rect x="250" y="100" width="16" height="32" rx="4"/></g>' +
    '<g fill="' + p.vida + '" opacity=".55"><path d="M30 108q10-12 22 0Z"/><path d="M180 108q12-14 26 0Z"/><path d="M330 108q10-12 22 0Z"/></g>' +
    '<g fill="' + p.acento + '" opacity=".4"><circle cx="150" cy="116" r="5"/><circle cx="300" cy="116" r="4"/></g>',
  arena: p =>
    /* anfiteatro de pedra com cristais acesos na cor do mestre */
    '<path d="M0 150Q60 132 120 144T250 138T400 146V170H0Z" fill="' + hex(p.fundo, -.35) + '"/>' +
    '<path d="M0 120L46 150H0ZM400 120L354 150H400Z" fill="' + hex(p.fundo, -.2) + '"/>' +
    '<path d="M60 150L96 92L132 150Z" fill="' + hex(p.fundo, -.12) + '"/>' +
    '<path d="M268 150L306 86L344 150Z" fill="' + hex(p.fundo, -.16) + '"/>' +
    '<path d="M160 150L200 104L240 150Z" fill="' + hex(p.fundo, -.06) + '"/>' +
    '<g opacity=".9"><path d="M96 92L104 118L88 118Z" fill="' + p.chefe + '"/>' +
    '<path d="M306 86L316 116L296 116Z" fill="' + p.chefe + '"/>' +
    '<path d="M200 104L208 128L192 128Z" fill="' + p.chefe + '"/></g>' +
    '<g fill="' + p.chefe + '" opacity=".25"><circle cx="96" cy="100" r="26"/><circle cx="306" cy="96" r="30"/><circle cx="200" cy="112" r="22"/></g>' +
    '<path d="M0 150h400" stroke="' + p.chefe + '" stroke-width="2" opacity=".35"/>',
  arena: p =>
    '<path d="M0 132Q100 118 200 128T400 122V170H0Z" fill="' + hex(p.fundo, -.35) + '"/>' +
    '<g fill="' + hex(p.pedra, -.25) + '" opacity=".9">' +
    '<path d="M14 130V70l16-10 16 10v70Z"/><path d="M354 130V70l16-10 16 10v70Z"/>' +
    '<path d="M74 132V92l12-8 12 8v48Z" opacity=".7"/><path d="M302 132V92l12-8 12 8v48Z" opacity=".7"/></g>' +
    '<g fill="' + p.acento + '"><circle cx="30" cy="62" r="5"/><circle cx="370" cy="62" r="5"/>' +
    '<circle cx="86" cy="86" r="3.5" opacity=".8"/><circle cx="314" cy="86" r="3.5" opacity=".8"/></g>' +
    '<g fill="' + p.acento + '" opacity=".22"><circle cx="30" cy="62" r="18"/><circle cx="370" cy="62" r="18"/></g>' +
    '<path d="M120 130q30-16 60 0M220 130q30-16 60 0" fill="none" stroke="' + hex(p.pedra, -.4) + '" stroke-width="7" stroke-linecap="round"/>' +
    '<g stroke="' + p.acento + '" stroke-width="2" opacity=".45"><path d="M150 128V104M250 128V104M200 132V112"/></g>',
  longe: p =>
    '<g opacity=".2" fill="' + p.acento + '"><path d="M60 60c0-14 10-22 22-22s22 8 22 22c-4 2-40 2-44 0Z"/>' +
    '<path d="M66 62q-3 16 2 30M78 62q2 18-2 34M92 62q4 14 0 28" stroke="' + p.acento + '" stroke-width="2" fill="none"/>' +
    '<path d="M300 30c0-10 8-16 16-16s16 6 16 16c-3 2-29 2-32 0Z"/>' +
    '<path d="M306 32q-2 12 2 22M318 32q2 12-1 24" stroke="' + p.acento + '" stroke-width="1.6" fill="none"/></g>'
};

/* retrato do mestre, desenhado na hora com a cor dele */
function desenhaMestre(idx) {
  const M = MESTRES[idx % MESTRES.length], c = M.cor, c2 = M.cor2;
  const olhos = M.forma === 'enguia'
    ? '<circle cx="62" cy="26" r="6.5" fill="#0A0D1A"/><circle cx="77" cy="24" r="6.5" fill="#0A0D1A"/><circle cx="64" cy="23.5" r="2.4" fill="#fff"/><circle cx="79" cy="21.5" r="2.4" fill="#fff"/>'
    : '<circle cx="38" cy="44" r="8" fill="#0A0D1A"/><circle cx="62" cy="44" r="8" fill="#0A0D1A"/>' +
      '<circle cx="40.5" cy="41" r="2.8" fill="#fff"/><circle cx="64.5" cy="41" r="2.8" fill="#fff"/>';
  const corpos = {
    lula: '<path d="M50 12c18 0 28 14 28 30 0 10-4 16-10 20H32c-6-4-10-10-10-20 0-16 10-30 28-30Z" fill="' + c + '"/>' +
      '<path d="M30 62q-6 18-16 26M40 64q-4 20-10 30M60 64q4 20 10 30M70 62q6 18 16 26M50 66v32" fill="none" stroke="' + c + '" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M50 12c10 0 17 8 20 18-12-6-28-6-40 0 3-10 10-18 20-18Z" fill="' + c2 + '" opacity=".55"/>',
    enguia: '<path d="M8 90C20 82 16 68 28 62S44 46 38 34 44 12 60 12s28 10 28 24-8 22-20 24" fill="none" stroke="' + c2 + '" stroke-width="20" stroke-linecap="round"/>' +
      '<path d="M8 90C20 82 16 68 28 62S44 46 38 34 44 12 60 12s28 10 28 24-8 22-20 24" fill="none" stroke="' + c + '" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M26 58l-9-7M37 36l-11-5M48 16l-5-10M70 12l5-9" stroke="' + c + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M60 40q10 8 22 1" fill="none" stroke="#0A0D1A" stroke-width="4" stroke-linecap="round"/><path d="M64 42l2 4M70 44l1 4M76 43l1 4" stroke="#fff" stroke-width="2"/>' +
      '<path d="M74 62l9 6-7 2 9 7" fill="none" stroke="#FFF36B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M12 28l7 5-6 2 7 5" fill="none" stroke="#FFF36B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>',
    caranguejo: '<path d="M22 56c0-16 12-26 28-26s28 10 28 26c0 12-12 20-28 20s-28-8-28-20Z" fill="' + c + '"/>' +
      '<path d="M22 44C12 40 8 30 12 20c8 2 14 10 14 20M78 44c10-4 14-14 10-24-8 2-14 10-14 20" fill="' + c + '"/>' +
      '<path d="M26 70l-12 14M38 76l-8 18M62 76l8 18M74 70l12 14" fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M34 62q16 8 32 0" fill="none" stroke="' + c2 + '" stroke-width="4" stroke-linecap="round"/>',
    serpente: '<path d="M86 88c-16 2-26-8-26-22 0-12 8-18 8-28 0-12-10-20-22-20S24 26 24 38c0 10 6 14 6 22" fill="none" stroke="' + c + '" stroke-width="15" stroke-linecap="round"/>' +
      '<path d="M46 18c-14 0-24 10-24 22 0 8 6 14 14 16 10 2 18-4 18-14 0-8-4-12-8-14Z" fill="' + c + '"/>' +
      '<path d="M34 50q10 10 22 2" fill="none" stroke="' + c2 + '" stroke-width="5" stroke-linecap="round"/>'
  };
  return '<svg viewBox="0 0 100 100" class="retrato-mestre" aria-hidden="true">' +
    '<circle cx="50" cy="50" r="46" fill="' + c2 + '" opacity=".28"/>' +
    (corpos[M.forma] || corpos.lula) + olhos + '</svg>';
}

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

/* bicho passeando no fundo do cenário, desenhado em silhueta */
const NADANTES = {
  tartaruga: c => '<path d="M50 20c16 0 28 12 28 28S66 76 50 76 22 64 22 48 34 20 50 20Z" fill="' + c + '"/>' +
    '<path d="M22 40L6 32l2 14 14 2ZM78 40l16-8-2 14-14 2ZM30 66l-8 14 12-4ZM70 66l8 14-12-4ZM78 44l14 4-14 6Z" fill="' + c + '"/>' +
    '<path d="M50 24q12 10 12 24t-12 24q-12-10-12-24t12-24Z" fill="rgba(0,0,0,.18)"/>',
  arraia: c => '<path d="M50 24c22 0 44 18 44 34 0 8-10 10-20 6-8-4-16-6-24-6s-16 2-24 6c-10 4-20 2-20-6 0-16 22-34 44-34Z" fill="' + c + '"/>' +
    '<path d="M50 62q4 20 2 34" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="42" cy="38" r="3" fill="rgba(0,0,0,.35)"/><circle cx="58" cy="38" r="3" fill="rgba(0,0,0,.35)"/>',
  golfinho: c => '<path d="M8 56c14-22 44-34 74-30-4 8-2 14 6 20-10 12-30 20-50 18l-8 12-4-14-18-6Z" fill="' + c + '"/>' +
    '<path d="M46 26q6-14 16-14-4 10 0 18Z" fill="' + c + '"/>',
  cardume: c => { let s = ''; for (let i = 0; i < 7; i++) { const x = 10 + (i % 4) * 24, y = 26 + Math.floor(i / 4) * 26;
      s += '<g transform="translate(' + x + ' ' + y + ') scale(.7)"><path d="M-12 0C-8 -7 2 -9 9 -4L16 -9L16 9L9 4C2 9 -8 7 -12 0Z" fill="' + c + '"/></g>'; } return s; },
  medusa: c => '<path d="M18 46c0-18 14-30 32-30s32 12 32 30c-6 4-58 4-64 0Z" fill="' + c + '" opacity=".85"/>' +
    '<path d="M28 48q-4 18 2 34M44 48q-2 20 2 36M58 48q2 20-2 36M72 48q4 18-2 32" fill="none" stroke="' + c + '" stroke-width="3.4" stroke-linecap="round" opacity=".7"/>',
  polvo: c => '<path d="M50 14c18 0 28 12 28 26S66 62 50 62 22 54 22 40 32 14 50 14Z" fill="' + c + '"/>' +
    '<path d="M30 56q-8 16-2 28M42 60q-6 18 0 28M58 60q6 18 0 28M70 56q8 16 2 28" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="42" cy="34" r="4" fill="rgba(0,0,0,.35)"/><circle cx="58" cy="34" r="4" fill="rgba(0,0,0,.35)"/>',
  tubarao: c => '<path d="M4 54c18-18 46-28 78-26l14-14-4 18 8 10-10 8c-24 10-58 10-86 4Z" fill="' + c + '"/>' +
    '<path d="M44 30q4-18 14-20-4 12 0 22Z" fill="' + c + '"/><path d="M40 62q-4 14-14 18 14-2 22-10Z" fill="' + c + '"/>',
  lanterna: c => '<path d="M24 50c0-16 14-28 32-28s30 12 30 28-14 26-30 26-32-10-32-26Z" fill="' + c + '"/>' +
    '<path d="M56 22C48 8 30 6 22 16" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="21" cy="17" r="5" fill="#BFF5EE"/><circle cx="21" cy="17" r="11" fill="#BFF5EE" opacity=".25"/>'
};
const BICHOS_BANDA = [['tartaruga','cardume','arraia'], ['cardume','polvo','arraia'], ['tubarao','arraia','golfinho'],
                      ['medusa','lanterna','arraia'], ['lanterna','medusa','polvo']];
function nadadores(m, amb) {
  const pool = BICHOS_BANDA[m], escuro = m >= 3;
  let s = '';
  for (let i = 0; i < 2; i++) {
    const semente = (amb.banda + 1) * 7 + i * 3 + (amb.reg.nome.length * 5);
    const nome = pool[Math.floor(acasoCena(semente, 11) * pool.length) % pool.length];
    const tam = 46 + acasoCena(i, 7) * 40, topo = 12 + acasoCena(semente, 8) * 54;
    const cor = escuro ? rgba(amb.reg.acento, .5) : rgba('#' + mistura(amb.reg.agua[Math.min(amb.banda + 2, 5)], '#000000', .25), .55);
    s += '<div class="nadador' + (i ? ' volta' : '') + '" style="top:' + topo.toFixed(1) + '%;width:' + tam.toFixed(0) + 'px;height:' + tam.toFixed(0) +
         'px;animation-duration:' + (26 + acasoCena(i, 9) * 24).toFixed(1) + 's;animation-delay:-' + (acasoCena(i, 10) * 22).toFixed(1) +
         's"><svg viewBox="0 0 100 100">' + NADANTES[nome](cor) + '</svg></div>';
  }
  return s;
}

function paletaChao(amb) {
  const r = amb.reg;
  const M = (amb.chefe != null) ? MESTRES[amb.chefe % MESTRES.length] : null;
  return { fundo: r.agua[Math.min(amb.banda + 1, 5)], acento: r.acento, vida: r.agua[1],
           pedra: r.moldura, areia: r.moldura, gelo: hex(r.agua[0], .3), madeira: r.moldura,
           chefe: M ? M.cor : r.acento };
}

function cena(m, amb) {
  let s = '';
  if (amb.chefe != null) {
    /* a arena do mestre é só dele: nada de bicho passeando, os
       outros sumiram quando ele chegou.                         */
    return '<svg class="chao" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      PROPS.arena(paletaChao(amb)) + '</svg>' +
      '<div class="particulas">' + particulas(4, MESTRES[amb.chefe % MESTRES.length].cor) + '</div>';
  }
  if (m <= 1) s += '<div class="causticas"></div>';
  if (m <= 2) s += '<div class="raios"><i></i><i></i><i></i><i></i><i></i></div>';
  s += '<svg class="chao" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
       (PROPS[amb.chao] || PROPS.pedra)(paletaChao(amb)) + '</svg>';
  s += nadadores(m, amb);
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
let mundoAtual = -1, ambAtual = null, conjAtual = '', acentoAtual = '';

function pintaFundoMestre(idx) {
  const cx = document.getElementById('cena');
  if (!cx) return;
  const velho = cx.querySelector('.mestre-fundo');
  if (velho) velho.remove();
  if (idx == null) return;
  const M = MESTRES[idx % MESTRES.length];
  const d = document.createElement('div');
  d.className = 'mestre-fundo';
  d.style.setProperty('--cor-mestre', M.cor);
  d.innerHTML = desenhaMestre(idx);
  cx.appendChild(d);
}

function instalaMundo(m, i) {
  const amb = ambiente(i == null ? 0 : i);
  /* arena do mestre: chão próprio e água tingida da cor dele */
  const faseDesta = (typeof fase === 'function' && i != null) ? fase(i) : null;
  const chefe = faseDesta && faseDesta.obj && faseDesta.obj.tipo === 'chefe' ? MESTRES[faseDesta.obj.mestre] : null;
  if (chefe) {
    amb.chao = 'arena';
    amb.reg = Object.assign({}, amb.reg, {
      acento: chefe.cor, moldura: chefe.cor2,
      agua: ['#12203A', '#0E1730', '#0A1024', '#070A18', '#' + mistura(chefe.cor2, '#000000', .55), '#02030A']
    });
    amb.tom = '';
  }
  const fx = (i != null && ehMestre(i)) ? fase(i) : null;
  amb.chefe = fx ? fx.obj.mestre : null;
  const trato = amb.reg.trato || 'limpo';
  const igual = (m === mundoAtual && ambAtual && ambAtual.reg === amb.reg && ambAtual.chao === amb.chao && trato === conjAtual && ambAtual.chefe === amb.chefe);
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
  const fa = (typeof J !== 'undefined' && J && J.fase >= 0) ? fase(J.fase) : null;
  const faseAgora = faseDesta || fa;     /* a fase que está abrindo agora, não a anterior */
  const bl = faseAgora && faseAgora.obj.corrente ? BLOQUEIOS.corrente : faseAgora && faseAgora.obj.mancha ? BLOQUEIOS.mancha
           : faseAgora && faseAgora.obj.tipo === 'ninho' ? BLOQUEIOS.alga : faseAgora && faseAgora.obj.tipo === 'chefe' ? BLOQUEIOS.tinta : amb.bloq;
  raiz.setProperty('--bl-a', bl.a); raiz.setProperty('--bl-b', bl.b);
  raiz.setProperty('--bl-a2', bl.a2); raiz.setProperty('--bl-b2', bl.b2);
  document.body.dataset.tex = bl.tex;
  document.body.dataset.mundo = m;
  const cx = document.getElementById('cena');
  cx.style.filter = amb.tom || '';
  if (igual) return;
  mundoAtual = m;
  conjAtual = trato; acentoAtual = amb.reg.acento;
  document.getElementById('defs-pecas').innerHTML = simbolos(m, '', trato, amb.reg.acento);
  cx.innerHTML = cena(m, amb);
  Som.m = m;
}
function corDaBarra(cor) { const t = document.querySelector('meta[name="theme-color"]'); if (t) t.setAttribute('content', cor); }
const COR_TOPO = ['#9BE9E0', '#3FC0C6', '#1A6E98', '#123067', '#0A0F28'];
