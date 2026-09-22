
/* ═══ CENÁRIO ═══════════════════════════════════════════════════
   O fundo de cada mundo: a luz que entra (ou não), o chão e o que
   anda pela água. Tudo leve: poucos elementos, só transform e
   opacity animados.                                              */

const CHAO = [
  /* raso: duna de areia, capim-marinho e conchinhas */
  '<path d="M0 116Q70 96 140 110T280 104T400 100V170H0Z" fill="#EAD6A6"/>' +
  '<path d="M0 136Q90 120 180 132T360 126T400 128V170H0Z" fill="#DDC592"/>' +
  '<g fill="none" stroke="#C9AD74" stroke-width="2" stroke-linecap="round" opacity=".55">' +
    '<path d="M24 150q14-5 28 0t28 0"/><path d="M150 156q14-5 28 0t28 0"/><path d="M290 148q14-5 28 0t28 0"/></g>' +
  '<g fill="#3E9E7A" opacity=".8"><path d="M46 118q-8-30 3-58q-1 30 5 58Z"/><path d="M56 118q2-26 16-44q-9 24-9 44Z"/><path d="M38 118q-10-18-22-24q14 4 26 24Z"/>' +
    '<path d="M338 108q-6-26 5-50q-1 26 5 50Z"/><path d="M348 108q4-20 16-34q-8 20-9 34Z"/></g>' +
  '<g opacity=".85"><path d="M210 124l3.6 7.4 8.2 1.2-5.9 5.8 1.4 8.2-7.3-3.9-7.3 3.9 1.4-8.2-5.9-5.8 8.2-1.2Z" fill="#F07A5C"/>' +
    '<path d="M118 136c0-8 12-8 12 0z" fill="#F4E4C4"/><path d="M270 130c3-7 12-5 11 1z" fill="#F9D6C0"/></g>',

  /* recife: coral ramificado, coral-cérebro e leque */
  '<path d="M0 128Q60 112 120 124T250 118T400 122V170H0Z" fill="#0B4F5E"/>' +
  '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M58 126V92M58 106l-16-16M58 100l14-18M42 90l-6-14M72 82l8-10M58 92V70" stroke="#E8707F" stroke-width="7" opacity=".8"/>' +
    '<path d="M330 124V96M330 110l14-12M330 104l-12-14M344 98l4-12M318 90l-4-10" stroke="#F2A14A" stroke-width="6" opacity=".75"/></g>' +
  '<path d="M150 126c0-22 18-34 36-34s36 12 36 34Z" fill="#A67BD6" opacity=".7"/>' +
  '<path d="M156 118q30-8 60 0M160 108q26-8 52 0M168 99q18-6 36 0" fill="none" stroke="#7F55B8" stroke-width="2.4" opacity=".7"/>' +
  '<path d="M262 126q-4-30 14-50q18 20 14 50Z" fill="#E86F9A" opacity=".55"/>' +
  '<path d="M276 124V80M276 110l-10-14M276 100l10-12" stroke="#C94F7A" stroke-width="2" opacity=".6"/>' +
  '<path d="M0 142Q100 130 200 140T400 136V170H0Z" fill="#083F4C"/>',

  /* naufrágio: casco tombado e mastro quebrado */
  '<path d="M0 132Q80 120 170 128T400 124V170H0Z" fill="#082E47"/>' +
  '<g opacity=".92"><path d="M196 124L214 70Q280 58 354 76L372 126Z" fill="#06263C"/>' +
    '<path d="M214 70Q280 58 354 76" fill="none" stroke="#0D3A57" stroke-width="4"/>' +
    '<path d="M250 64L236 8M236 8l26 10" fill="none" stroke="#06263C" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="246" cy="96" r="6" fill="#0E3D5C"/><circle cx="276" cy="92" r="6" fill="#0E3D5C"/><circle cx="306" cy="94" r="6" fill="#0E3D5C"/></g>' +
  '<path d="M20 132l10-12l8 12zM88 128l6-8l6 8z" fill="#0A3552"/>' +
  '<path d="M0 148Q120 138 240 146T400 142V170H0Z" fill="#06233A"/>',

  /* crepúsculo: sem chão à vista, só águas-vivas distantes */
  '<g opacity=".16" fill="#B7A6FF"><path d="M60 60c0-14 10-22 22-22s22 8 22 22c-4 2-40 2-44 0Z"/>' +
    '<path d="M66 62q-3 16 2 30M78 62q2 18-2 34M92 62q4 14 0 28" stroke="#B7A6FF" stroke-width="2" fill="none"/>' +
    '<path d="M300 30c0-10 8-16 16-16s16 6 16 16c-3 2-29 2-32 0Z"/>' +
    '<path d="M306 32q-2 12 2 22M318 32q2 12-1 24" stroke="#B7A6FF" stroke-width="1.6" fill="none"/></g>',

  /* abismo: pedra escura, penas-do-mar acesas e uma chaminé morna */
  '<path d="M0 124Q40 110 90 120T190 112T300 118T400 110V170H0Z" fill="#05060F"/>' +
  '<path d="M322 118L334 72L352 70L362 116Z" fill="#070812"/>' +
  '<ellipse cx="343" cy="70" rx="14" ry="6" fill="#FF8A3D" opacity=".25"/>' +
  '<g stroke="#6BFFE0" stroke-width="1.6" opacity=".7">' +
    '<path d="M70 120V96"/><path d="M130 116V100"/><path d="M230 116V90"/></g>' +
  '<g fill="#6BFFE0"><circle cx="70" cy="95" r="3"/><circle cx="130" cy="99" r="2.4"/><circle cx="230" cy="89" r="3.2"/></g>' +
  '<g fill="#6BFFE0" opacity=".25"><circle cx="70" cy="95" r="8"/><circle cx="130" cy="99" r="6"/><circle cx="230" cy="89" r="9"/></g>'
];

function acasoCena(i, k) { return ((Math.sin(i * 91.7 + k * 13.3) * 43758.5453) % 1 + 1) % 1; }

function particulas(m) {
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
    const cores = ['#6BFFE0', '#9A5CFF', '#5CFF9E', '#5CB4FF', '#FF7390'];
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
  const bicho = m === 4 ? 's5' : 's4';     /* no abismo passa uma água-viva acesa */
  let s = '';
  for (let i = 0; i < 2; i++) {
    const tam = 30 + acasoCena(i, 7) * 26, topo = 14 + acasoCena(i, 8) * 52;
    s += '<div class="nadador' + (i ? ' volta' : '') + '" style="top:' + topo.toFixed(1) + '%;width:' + tam.toFixed(0) + 'px;height:' + tam.toFixed(0) +
         'px;animation-duration:' + (26 + acasoCena(i, 9) * 22).toFixed(1) + 's;animation-delay:-' + (acasoCena(i, 10) * 20).toFixed(1) +
         's"><svg viewBox="0 0 100 100"><use href="#' + bicho + '"/></svg></div>';
  }
  return s;
}

function cena(m) {
  let s = '';
  if (m <= 1) s += '<div class="causticas"></div>';
  if (m <= 2) s += '<div class="raios"><i></i><i></i><i></i><i></i><i></i></div>';
  s += '<svg class="chao" viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + CHAO[m] + '</svg>';
  s += nadadores(m);
  s += '<div class="particulas">' + particulas(m) + '</div>';
  return s;
}

/* troca tudo que depende do mundo: peças, cenário, som e cor da barra do navegador */
let mundoAtual = -1;
const COR_TOPO = ['#9BE9E0', '#3FC0C6', '#1A6E98', '#123067', '#0A0F28'];
let varianteAtual = -1;
function instalaMundo(m, variante) {
  const v = ((variante || 0) % 3 + 3) % 3;
  const cx = document.getElementById('cena');
  if (m === mundoAtual) { if (v !== varianteAtual) { varianteAtual = v; cx.className = 'v' + v; } return; }
  varianteAtual = v;
  cx.className = 'v' + v;
  mundoAtual = m;
  document.body.dataset.mundo = m;
  document.getElementById('defs-pecas').innerHTML = simbolos(m, '');
  document.getElementById('cena').innerHTML = cena(m);
  Som.m = m;
}
function corDaBarra(cor) { const t = document.querySelector('meta[name="theme-color"]'); if (t) t.setAttribute('content', cor); }
