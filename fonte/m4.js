
/* ═══ HUD ═══════════════════════════════════════════════════════ */
const nf = n => n.toLocaleString('pt-BR');
let desafioAtual = null;
const faseAtual = () => J.desafio ? desafioAtual : fase(J.fase);
const icone = t => '<svg class="ic" viewBox="0 0 100 100"><use href="#s' + t + '"/></svg>';

function gastaJogada() {
  J.mov = Math.max(0, J.mov - 1);
  const m = document.getElementById('movimentos');
  m.classList.add('bate'); setTimeout(() => m.classList.remove('bate'), 400);
  atualizaHud();
  const aperto = J.mov <= 5 && J.mov > 0 && !J.fim;
  document.body.classList.toggle('aperto', aperto);
  if (aperto) { Som.liga(); Som.alerta(); vibra(TREMIDA.aperto); }
  Musica.tensao(aperto, 0);
}

/* põe no tabuleiro o que cada objetivo novo precisa */
function preparaEspeciaisDaFase() {
  const f = faseAtual();
  QUADRADO_ATIVO = !!f.quadrado && !J.desafio;   /* toda fase passa por aqui ao começar */
  J.cond = J.desafio ? null : condicaoDa(J.fase); J.corVez = null; J.moedasFundo = null; J.moedasPegas = 0;
  if (J.cond === 'brinde') {
    let n = 0;
    for (let tent = 0; tent < 80 && n < 3; tent++) {
      const r = 2 + sorteia(H - 2), c = sorteia(W), q = grid[r] && grid[r][c];
      if (!q || q.sp || q.bau || q.lixo || q.gaiola || q.bolha) continue;
      q.sp = [LH, LV, BOMBA][n % 3]; n++;
    }
  }
  if (J.cond === 'corvez') J.corVez = ((J.fase + 5) * 31) % 6;
  if (J.cond === 'moedas') {
    J.moedasFundo = Array.from({ length: H }, () => Array(W).fill(0));
    let n = 0;
    for (let tent = 0; tent < 80 && n < 4; tent++) { const r = sorteia(H), c = sorteia(W); if (temCasa(r, c) && !J.moedasFundo[r][c]) { J.moedasFundo[r][c] = 1; n++; } }
  }
  if (f.obj.tipo === 'presos') {
    let postos = 0;
    const quer = Math.min(f.obj.n, 6);
    for (let tent = 0; tent < 300 && postos < quer; tent++) {
      const r = 2 + sorteia(H - 3), c = sorteia(W), p = grid[r][c];
      if (!p || p.gaiola || p.bau || p.sp) continue;
      let perto = false;
      for (let y = r - 1; y <= r + 1 && !perto; y++) for (let x = c - 1; x <= c + 1; x++)
        if (dentro(y, x) && grid[y][x] && grid[y][x].gaiola) { perto = true; break; }
      if (perto) continue;
      p.gaiola = f.obj.rede || 2;
      postos++;
    }
  }
  if (f.obj.tipo === 'bolhas') nasceBolha(f.obj.juntas || 2);
  J.perolas = null; J.coral = null; J.perolasFeitas = 0; J.coralFeito = 0; J.lixoFeito = 0;
  const vazio = () => Array.from({ length: H }, () => Array(W).fill(0));
  const sorteiaCasas = (quantas, filtro) => {
    const lista = [];
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (temCasa(r, c) && (!filtro || filtro(r, c))) lista.push([r, c]);
    for (let k = lista.length - 1; k > 0; k--) { const j = sorteia(k + 1); const x = lista[k]; lista[k] = lista[j]; lista[j] = x; }
    return lista.slice(0, quantas);
  };
  if (f.obj.tipo === 'perolas') {
    J.perolas = vazio();
    /* espalhadas: nunca duas ostras encostadas */
    let postas = 0;
    for (const [r, c] of sorteiaCasas(40, (r) => r >= 1)) {
      if (postas >= f.obj.n) break;
      let perto = false;
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) if (dentro(r + dr, c + dc) && J.perolas[r + dr][c + dc]) perto = true;
      if (perto) continue;
      J.perolas[r][c] = 2; postas++;
    }
  }
  if (f.obj.tipo === 'coral') {
    J.coral = vazio();
    /* um recife morto contínuo, crescendo a partir do fundo */
    let [r, c] = [H - 1, sorteia(W)], feitos = 0, voltas = 0;
    while (feitos < f.obj.n && voltas++ < 400) {
      if (temCasa(r, c) && !J.coral[r][c]) { J.coral[r][c] = 1; feitos++; }
      const [dr, dc] = [[-1,0],[0,-1],[0,1],[-1,0],[1,0]][sorteia(5)];
      if (temCasa(r + dr, c + dc)) { r += dr; c += dc; }
    }
  }
  if (f.obj.tipo === 'lixo') {
    let postos = 0;
    for (const [r, c] of sorteiaCasas(60, (r) => r >= 1)) {
      const q = grid[r][c];
      if (postos >= f.obj.n || !q || q.bau || q.sp) continue;
      q.lixo = f.obj.dura || 1; postos++;
    }
  }
  if (f.obj.tipo === 'ninho') {
    J.ninhos = f.obj.ninhos.map(c => ({ r: TOPO[c] - 1, c: c, vida: f.obj.vida || 3 }));
    J.ninhosFeitos = 0;
    /* cada ninho já começa com uma alga embaixo, pra ninguém ficar sem entender */
    for (const n of J.ninhos) if (temCasa(n.r + 1, n.c)) papel[n.r + 1][n.c] = 1;
    J.papelTotal = contaPapel(papel);
  } else J.ninhos = null;
}
function nasceBolha(quantas) {
  for (let k = 0; k < quantas; k++) {
    for (let tent = 0; tent < 120; tent++) {
      const r = H - 1 - sorteia(2), c = sorteia(W), p = grid[r][c];
      if (!p || p.bolha || p.bau || p.gaiola) continue;
      p.bolha = true;
      if (typeof atualizaEl === 'function') atualizaEl(p);
      break;
    }
  }
}

/* segundo objetivo: juntar peças de uma cor, além do principal */
function faltaExtra() {
  const f = faseAtual(), ex = f.obj.extra;
  if (!ex) return 0;
  return Math.max(0, ex.n - ((J.coletado || [])[ex.t] || 0));
}
function faltaObjetivo() { return faltaPrincipal() + faltaExtra(); }
function faltaPrincipal() {
  const f = faseAtual();
  if (f.obj.tipo === 'chefe') return Math.max(0, f.obj.vida - (J.dano || 0));
  if (f.obj.tipo === 'ninho') return ninhosVivos() + casasCobertas(papel);
  if (f.obj.tipo === 'perolas') { let n = 0; if (J.perolas) for (const l of J.perolas) for (const v of l) if (v > 0) n++; return n; }
  if (f.obj.tipo === 'coral') { let n = 0; if (J.coral) for (const l of J.coral) for (const v of l) if (v === 1) n++; return n; }
  if (f.obj.tipo === 'lixo') return Math.max(0, f.obj.n - (J.lixoFeito || 0));
  if (f.obj.tipo === 'presos') return Math.max(0, f.obj.n - (J.presosFeitos || 0));
  if (f.obj.tipo === 'bolhas') return Math.max(0, f.obj.n - (J.bolhasFeitas || 0));
  if (f.obj.tipo === 'pontos') return Math.max(0, f.marcas[0] - J.pontos);
  if (f.obj.tipo === 'coletar') return f.obj.itens.reduce((a, it) => a + Math.max(0, it[1] - J.coletado[it[0]]), 0);
  if (f.obj.tipo === 'bau') return Math.max(0, f.obj.n - J.bauFeito);
  if (f.obj.tipo === 'especiais') return Math.max(0, f.obj.n - (J.criados || 0));
  return Math.max(0, J.papelTotal - J.papelFeito);
}
function objetivoFeito() { return faltaObjetivo() === 0; }
function nomeBloq(f, n) {
  const b = f.obj.corrente ? BLOQUEIOS.corrente : f.obj.mancha ? BLOQUEIOS.mancha : f.obj.tipo === 'ninho' ? BLOQUEIOS.alga : ambiente(J.desafio ? 0 : J.fase).bloq;
  return n + ' ' + (n === 1 ? b.um : b.varios);
}
function verboBloq(f) {
  const b = f.obj.corrente ? BLOQUEIOS.corrente : f.obj.mancha ? BLOQUEIOS.mancha : f.obj.tipo === 'ninho' ? BLOQUEIOS.alga : ambiente(J.desafio ? 0 : J.fase).bloq;
  return b.verbo;
}

/* tocar no painel do objetivo acende, por dois segundos, as casas que
   ainda faltam: ajuda muito quem enxerga menos, ou quando tudo é verde */
function destacaAlvos() {
  const f = faseAtual(), casas = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = grid[r] && grid[r][c];
    const alvo = (papel[r] && papel[r][c] > 0) || (J.coral && J.coral[r][c] === 1) || (J.perolas && J.perolas[r][c] > 0) ||
      (p && (p.lixo || p.gaiola || p.bolha || p.bau)) ||
      (f.obj.tipo === 'coletar' && p && !p.sp && f.obj.itens && f.obj.itens.some(([tp, n]) => tp === p.t && (J.coletado[tp] || 0) < n));
    if (alvo) casas.push(celulasBox.children[r * W + c]);
  }
  if (!casas.length) return;
  Som.liga(); Som.pop(3);
  casas.forEach(d => { if (!d) return; d.classList.remove('pisca-alvo'); void d.offsetWidth; d.classList.add('pisca-alvo'); });
  setTimeout(() => casas.forEach(d => d && d.classList.remove('pisca-alvo')), 2300);
}
function pintaExtra() {
  const f = faseAtual(), o = document.getElementById('objetivo');
  if (!o) return;
  const vc = o.querySelector('.cond-tag'); if (vc) vc.remove();
  if (J.cond) o.insertAdjacentHTML('beforeend', '<div class="cond-tag">' + CONDICOES[J.cond].ic + ' ' + CONDICOES[J.cond].nome +
    (J.corVez != null ? ' <svg class="ic" viewBox="0 0 100 100"><use href="#s' + J.corVez + '"/></svg>' : '') +
    (J.moedasFundo ? ' · ' + J.moedasPegas + '/4' : '') + '</div>');
  const velho = o.querySelector('.extra-obj'); if (velho) velho.remove();
  if (!f.obj.extra) return;
  const n = faltaExtra();
  o.insertAdjacentHTML('beforeend', '<div class="extra-obj' + (n ? '' : ' feito') + '"><span>e juntar</span>' +
    '<svg class="ic" viewBox="0 0 100 100"><use href="#s' + f.obj.extra.t + '"/></svg><b>' + (n || '✓') + '</b></div>');
}
function atualizaHud() {
  setTimeout(pintaExtra, 0);
  const obj = document.getElementById('objetivo');
  if (obj && !obj.dataset.toca) { obj.dataset.toca = '1'; obj.addEventListener('click', destacaAlvos); obj.title = 'Toque para ver onde estão'; }
  const f = faseAtual();
  document.getElementById('mov-n').textContent = J.mov;
  document.getElementById('mov-lb').textContent = J.mov === 1 ? 'jogada' : 'jogadas';
  document.getElementById('movimentos').classList.toggle('aperto', J.mov <= 5);
  animaPontos();

  const teto = f.marcas[2];
  document.getElementById('barra-cheio').style.width = Math.min(100, J.pontos / teto * 100) + '%';
  [0, 1, 2].forEach(i => {
    const m = document.getElementById('m' + (i + 1));
    const tem = J.pontos >= f.marcas[i], antes = m.dataset.on === '1';
    m.style.left = (f.marcas[i] / teto * 100) + '%';
    m.querySelector('use').setAttribute('href', tem ? '#i-estrela' : '#i-estrela-off');
    if (tem && !antes) {
      m.classList.remove('ganhou'); void m.offsetWidth; m.classList.add('ganhou');
      Som.liga(); Som.sobe(i); vibra(TREMIDA.estrela); clarao('rgba(255,211,92,.3)');
    }
    m.dataset.on = tem ? '1' : '0';
  });
  document.getElementById('meta-texto').textContent = J.pontos >= teto ? 'três estrelas!' : nf(teto) + ' para 3 estrelas';
  document.getElementById('fase-num').textContent = f.desafio ? '★' : (J.fase + 1);
  document.getElementById('fase-nome').textContent = f.nome;
  document.getElementById('fase-prof').textContent = f.desafio ? f.semana : metros(f.prof);

  /* na fase de pontuação a partida vai até a última jogada: avisa quando o objetivo cai */
  if (f.obj.tipo === 'pontos' && !f.desafio && !J.objBatido && J.pontos >= f.marcas[0] && !J.fim) {
    J.objBatido = true;
    faixaTexto('Objetivo batido!');
    Som.liga(); Som.sobe(1); vibra(TREMIDA.estrela);
    clarao('rgba(107,255,224,.3)');
  }
  const o = document.getElementById('objetivo');
  if (f.desafio) {
    o.innerHTML = '<div><div class="rotulo">Objetivo</div><div class="valor">o máximo de pontos</div></div>';
  } else if (f.obj.tipo === 'pontos' && J.pontos >= f.marcas[0]) {
    const falta2 = J.pontos < f.marcas[1] ? f.marcas[1] - J.pontos : (J.pontos < f.marcas[2] ? f.marcas[2] - J.pontos : 0);
    o.innerHTML = '<div><div class="rotulo feito">Objetivo batido ✓</div><div class="valor">' +
      (falta2 ? 'faltam ' + nf(falta2) + ' para a próxima estrela' : 'jogue até acabar as jogadas') + '</div></div>';
  } else if (f.obj.tipo === 'especiais') {
    const falta = Math.max(0, f.obj.n - (J.criados || 0));
    o.innerHTML = '<div><div class="rotulo">Criar especiais</div></div><div class="alvos">' +
      '<div class="alvo' + (falta ? '' : ' feito') + '"><svg class="ic" viewBox="0 0 100 100"><use href="#i-faisca"/></svg><b>' + (falta || '✓') + '</b></div></div>';
  } else if (f.obj.tipo === 'perolas' || f.obj.tipo === 'coral' || f.obj.tipo === 'lixo') {
    const n = faltaPrincipal();
    const rot = { perolas: 'Colher as pérolas', coral: 'Recuperar o coral', lixo: 'Limpar o lixo do fundo' }[f.obj.tipo];
    const ic = { perolas: '#i-perola', coral: '#i-coral', lixo: '#i-lixo0' }[f.obj.tipo];
    o.innerHTML = '<div><div class="rotulo">' + rot + '</div></div><div class="alvos"><div class="alvo' + (n ? '' : ' feito') + '">' +
      '<svg class="ic" viewBox="0 0 100 100"><use href="' + ic + '"/></svg><b>' + (n || '✓') + '</b></div></div>';
  } else if (f.obj.tipo === 'ninho') {
    const nv = ninhosVivos(), al = casasCobertas(papel);
    o.innerHTML = '<div><div class="rotulo">Destruir os ninhos e as algas</div></div><div class="alvos">' +
      '<div class="alvo' + (nv ? '' : ' feito') + '"><svg class="ic" viewBox="0 0 100 100"><use href="#i-ninho"/></svg><b>' + (nv || '✓') + '</b></div>' +
      '<div class="alvo' + (al ? '' : ' feito') + '"><span class="ic-alga"></span><b>' + (al || '✓') + '</b></div></div>';
  } else if (f.obj.tipo === 'chefe') {
    const M = MESTRES[f.obj.mestre], vida = Math.max(0, f.obj.vida - (J.dano || 0));
    const pc = Math.round(vida / f.obj.vida * 100);
    o.innerHTML = '<div class="mestre-hud">' + desenhaMestre(f.obj.mestre) +
      '<div class="mestre-txt"><div class="rotulo">' + M.nome + '</div>' +
      '<div class="vida-mestre"><i style="width:' + pc + '%;background:linear-gradient(90deg,' + M.cor2 + ',' + M.cor + ')"></i></div>' +
      '<div class="valor">' + (vida ? vida + ' de vida' : 'derrotado!') + '</div></div></div>';
  } else if (f.obj.tipo === 'presos') {
    const falta = Math.max(0, f.obj.n - (J.presosFeitos || 0));
    o.innerHTML = '<div><div class="rotulo">Libertar os presos</div></div><div class="alvos">' +
      '<div class="alvo' + (falta ? '' : ' feito') + '"><svg class="ic" viewBox="0 0 100 100"><use href="#i-gaiola"/></svg><b>' + (falta || '✓') + '</b></div></div>';
  } else if (f.obj.tipo === 'bolhas') {
    const falta = Math.max(0, f.obj.n - (J.bolhasFeitas || 0));
    o.innerHTML = '<div><div class="rotulo">Estourar as bolhas</div>' +
      (J.bolhasFugiram ? '<div class="valor">' + J.bolhasFugiram + (J.bolhasFugiram === 1 ? ' fugiu' : ' fugiram') + '</div>' : '') +
      '</div><div class="alvos"><div class="alvo' + (falta ? '' : ' feito') + '"><svg class="ic" viewBox="0 0 100 100"><use href="#i-bolha-ar"/></svg><b>' + (falta || '✓') + '</b></div></div>';
  } else if (f.obj.tipo === 'bau') {
    const falta = Math.max(0, f.obj.n - J.bauFeito);
    o.innerHTML = '<div><div class="rotulo">Descer até o fundo</div></div><div class="alvos">' +
      '<div class="alvo' + (falta ? '' : ' feito') + '"><svg class="ic" viewBox="0 0 100 100"><use href="#i-bau"/></svg><b>' + (falta || '✓') + '</b></div></div>';
  } else if (f.obj.tipo === 'pontos') {
    o.innerHTML = '<div><div class="rotulo">Objetivo</div><div class="valor">' + nf(f.marcas[0]) + ' pontos</div></div>';
  } else if (f.obj.tipo === 'coletar') {
    let s = '<div><div class="rotulo">Juntar</div></div><div class="alvos">';
    for (const it of f.obj.itens) {
      const falta = Math.max(0, it[1] - J.coletado[it[0]]);
      s += '<div class="alvo' + (falta ? '' : ' feito') + '">' + icone(it[0]) + '<b>' + (falta || '✓') + '</b></div>';
    }
    o.innerHTML = s + '</div>';
    o.querySelectorAll('.alvo').forEach((el, k) => {
      const v = el.querySelector('b').textContent;
      if (o.dataset['v' + k] !== undefined && o.dataset['v' + k] !== v) { el.classList.remove('bateu'); void el.offsetWidth; el.classList.add('bateu'); }
      o.dataset['v' + k] = v;
    });
  } else {
    const falta = casasCobertas(papel);
    const aviso = f.obj.mancha ? ' <i class="tag-cresce">espalha</i>' : f.obj.cresce ? ' <i class="tag-cresce">volta a crescer</i>' : '';
    o.innerHTML = '<div><div class="rotulo">' + verboBloq(f) + aviso + '</div>' +
      '<div class="valor">' + (falta ? nomeBloq(f, falta) : 'tudo limpo ✓') + '</div></div>';
  }
}

let pontosNaTela = 0, pontosRaf = null;
function animaPontos() {
  const el = document.getElementById('pontos');
  if (Math.abs(J.pontos - pontosNaTela) < 1) { pontosNaTela = J.pontos; el.textContent = nf(J.pontos); pontosRaf = null; return; }
  pontosNaTela += (J.pontos - pontosNaTela) * 0.22 + 1;
  el.textContent = nf(Math.round(pontosNaTela));
  el.classList.add('sobe');
  clearTimeout(animaPontos.t);
  animaPontos.t = setTimeout(() => el.classList.remove('sobe'), 300);
  pontosRaf = requestAnimationFrame(animaPontos);
}

/* ═══ FIM DE FASE ═══════════════════════════════════════════════ */
async function confere() {
  if (J.fim) return;
  if (J.desafio) { if (J.mov <= 0) { J.fim = true; apagaDica(); clearTimeout(dicaTimer); fimDesafio(); } return; }
  const porPontos = faseAtual().obj.tipo === 'pontos';
  const fecha = f => { J.fim = true; apagaDica(); clearTimeout(dicaTimer); return f(); };
  /* fase de pontuação joga até a última jogada: é lá que moram a 2ª e a 3ª estrela */
  if (porPontos) {
    if (J.mov <= 0) return fecha(objetivoFeito() ? venceu : perdeu);
    /* bateu o objetivo antes da hora: explica uma vez e libera o
       botão de encerrar, pra ninguém ficar achando que travou */
    if (objetivoFeito() && !J.avisouPontos) {
      J.avisouPontos = true;
      mostraBotaoEncerrar();
      const vezes = prog.vistos.pontosOk || 0;
      if (vezes < 2) {
        prog.vistos.pontosOk = vezes + 1;
        salvaProg();
        cartao('<h3>Objetivo batido!</h3>' +
          '<p>Nesta fase o objetivo é pontuação, então ela não acaba aqui: as jogadas que sobraram valem a segunda e a terceira estrela. ' +
          'Quando quiser parar, é só tocar em Encerrar, no alto da tela.</p>' +
          '<div class="bts"><button class="bt vidro" data-ac="encerra">Encerrar agora</button>' +
          '<button class="bt" data-ac="fecha">Continuar jogando</button></div>', true);
      }
    }
    return;
  }
  if (objetivoFeito()) return fecha(venceu);
  if (J.mov <= 0) return fecha(perdeu);
}

function mostraBotaoEncerrar() {
  const alvo = document.getElementById('painel') || document.querySelector('.painel');
  if (!alvo || document.getElementById('bt-encerra')) return;
  const b = document.createElement('button');
  b.id = 'bt-encerra';
  b.className = 'bt-encerra';
  b.textContent = 'Encerrar';
  b.onclick = () => { Som.liga(); Som.toque(); encerraAgora(); };
  alvo.appendChild(b);
}
function tiraBotaoEncerrar() { const b = document.getElementById('bt-encerra'); if (b) b.remove(); }
async function encerraAgora() {
  fechaCartao();
  if (J.fim || J.ocupado) return;
  J.fim = true;
  apagaDica();
  clearTimeout(dicaTimer);
  tiraBotaoEncerrar();
  J.mov = 0;
  atualizaHud();
  await venceu();
}

/* deixa a última jogada terminar antes de jogar o cartão na cara:
   espera o tabuleiro assentar e o contador de pontos alcançar o
   total, com teto pra nunca ficar parado esperando à toa.        */
async function esperaAcalmar(minimo) {
  J.ocupado = true;
  await espera(minimo || 600);
  const limite = Date.now() + 1400;
  while (Math.round(pontosNaTela) < J.pontos - 1 && Date.now() < limite) await espera(90);
  await espera(320);
}

/* Quem resolve rápido tinha nota menor que quem enrolava até a
   última jogada. Agora o que sobrou de fôlego vira especial no
   tabuleiro e estoura junto: eficiência passa a valer ponto.    */
/* Bônus de eficiência. Serve pra uma coisa só: quem bateu o
   objetivo gastando bem menos jogadas do que a fase dava não pode
   sair com nota pior do que quem enrolou até o fim. Por isso:
   · não vale se comprou fôlego (a jogada não foi economizada);
   · só conta quem economizou pelo menos 20% das jogadas da fase;
   · só completa até a nota da terceira estrela, nunca além:
     é compensação, não prêmio extra pra quem já pontuou alto.  */
async function bonusDoFolego() {
  const f = faseAtual();
  J.folegoBonus = null;
  if (f.obj.tipo === 'pontos' || f.obj.tipo === 'chefe') return 0;
  if (J.movExtra > 0) return 0;
  const sobra = Math.max(0, J.mov | 0);
  const minimo = Math.max(2, Math.ceil(f.mov * .2));
  if (sobra < minimo) return 0;
  const teto = f.marcas[2];
  const falta = Math.max(0, teto - J.pontos);
  if (!falta) return 0;
  const porJogada = Math.max(250, Math.round(teto / Math.max(1, f.mov)));
  const bonus = Math.min(falta, sobra * porJogada);
  faixaTexto('Resolveu com ' + sobra + ' jogadas de sobra!', 2200);
  Som.liga(); Som.especial();
  await espera(700);
  J.pontos += bonus;
  J.folegoBonus = { sobra: sobra, extra: bonus, chegouNoTeto: bonus === falta };
  J.mov = 0;
  atualizaHud();
  await espera(500);
  return bonus;
}

async function venceu() {
  const eraMestre = faseAtual().obj.tipo === 'chefe';
  J.folegoBonus = null;
  await bonusDoFolego();
  tiraBotaoEncerrar();
  if (eraMestre) {
    prog.mestres = (prog.mestres || 0) + 1;
    ['arpao', 'troca', 'giro', 'isca', 'folego'].forEach(k => prog.poderes[k] = (prog.poderes[k] || 0) + 1);
    const ret = document.querySelector('.retrato-mestre');
    if (ret) ret.classList.add('derrotado');
    faixaTexto('Mestre derrotado!');
    fogos(); await espera(700);
  }
  const explodiuNoFim = await estouroFinal();   /* o resto dos especiais estoura antes do cartão */

  J.ocupado = true;
  if (J.mov > 0) {
    faixaTexto('Sobrou jogada!');
    await espera(500);
    const passos = Math.min(J.mov, 10), porPasso = Math.ceil(J.mov / passos);
    while (J.mov > 0) {
      const usa = Math.min(porPasso, J.mov);
      J.mov -= usa; J.pontos += 250 * usa;
      Som.liga(); Som.pop(4);
      respingos(sorteia(H), sorteia(W), corDe(sorteia(TIPOS)), 7);
      atualizaHud();
      await espera(110);
    }
    await espera(280);
  }
  const f = faseAtual();
  let e = 1;
  if (J.pontos >= f.marcas[1]) e = 2;
  if (J.pontos >= f.marcas[2]) e = 3;
  const primeira = !prog.estrelas[J.fase];
  limpaPartida();
  prog.estrelas[J.fase] = Math.max(prog.estrelas[J.fase] || 0, e);
  if (J.fase + 1 > prog.max) prog.max = J.fase + 1;
  await esperaAcalmar(explodiuNoFim ? 900 : eraMestre ? 300 : 700);
  const ganho = moedasDaFase(e, primeira) + (eraMestre ? 150 : 0);
  prog.moedas += ganho;
  salvaProg();
  salvaNaNuvemDepois();
  pintaMoedas();

  const frases = ['Passou, mas no último fôlego.', 'Mergulho bonito.', 'Impecável. Nem levantou areia.'];
  const fimExp = (J.fase + 1) % CICLO === 0;
  const prox = fase(J.fase + 1);
  const muda = !fimExp && prox.m !== f.m;
  cartao(
    '<h3>' + (fimExp ? 'Você chegou ao fundo' : 'Fase concluída!') + '</h3>' +
    (J.desafio ? '' : '<span class="selo-classe selo-mini" style="--cor-classe:' + CLASSES[classeDaFase(J.fase)].cor + '">' +
      CLASSES[classeDaFase(J.fase)].emoji + ' ' + CLASSES[classeDaFase(J.fase)].nome.toUpperCase() + '</span>') +
    '<div class="estrelas-grandes">' +
      [0, 1, 2].map(i => '<div class="e' + (i < e ? ' on' : '') + '" style="animation-delay:' + (i * .22) + 's"><svg viewBox="0 0 100 100"><use href="#' + (i < e ? 'i-estrela' : 'i-estrela-off') + '"/></svg></div>').join('') +
    '</div>' +
    '<p class="placar-final">' + nf(J.pontos) + '<small>pontos</small></p>' +
    colheitaDaFase() +
    '<p class="ganho-moedas"><svg viewBox="0 0 100 100"><use href="#i-moeda"/></svg>+' + ganho + '</p>' +
    '<p class="pos-fase" id="pos-fase"></p>' +
    (eraMestre ? '<div class="tesouro"><b>Tesouro do mestre</b><span>150 moedas e um de cada poder</span></div>' : '') +
    (J.folegoBonus ? '<div class="folego-bonus"><b>Bônus de eficiência</b><span>resolveu com ' +
      J.folegoBonus.sobra + ' jogadas de sobra · +' + nf(J.folegoBonus.extra) + ' pontos' +
      (J.folegoBonus.chegouNoTeto ? ' (até a 3ª estrela)' : '') + '</span></div>' : '') +
    '<p>' + (fimExp ? 'Foram 4.000 metros. A Expedição ' + expedicao(J.fase + 1) + ' começa de novo no raso, mais apertada.'
             : muda ? frases[e - 1] + ' Daqui pra baixo começa ' + ambiente(J.fase + 1).nome + '.' : frases[e - 1]) + '</p>' +
    '<div class="bts">' +
      '<button class="bt vidro" data-ac="mapa">Mapa</button>' +
      '<button class="bt" data-ac="proxima">' + (fimExp ? 'Nova expedição' : muda ? 'Descer para ' + ambiente(J.fase + 1).nome : 'Próxima fase') + '</button>' +
    '</div>'
  );
  if (Conta.ligada) Conta.garante().then(() => {
    if (!Ranking.ligado) return;
    Ranking.pontuaFase(J.fase, J.pontos);
    Ranking.subeFicha();
    mostraPosicaoFase(J.fase, J.pontos);
  });
  Som.liga(); Som.vitoria();
  document.body.classList.remove('aperto');
  Musica.tensao(false, 0);
  fogos(2 + e * 2);
  for (let i = 0; i < e; i++) setTimeout(() => { Som.estrela(i); vibra(TREMIDA.estrela); }, 260 + i * 220);
  vibra(TREMIDA.vitoria);
}

async function perdeu() {
  J.ocupado = true;
  await esperaAcalmar(750);
  limpaPartida();
  document.body.classList.remove('aperto');
  Musica.tensao(false, 0);
  Som.liga(); Som.derrota(); vibra(TREMIDA.derrota);
  const f = faseAtual();
  let falta;
  if (f.obj.tipo === 'pontos') falta = 'Faltaram ' + nf(f.marcas[0] - J.pontos) + ' pontos.';
  else if (f.obj.tipo === 'coletar') { const n = faltaObjetivo(); falta = 'Faltou juntar ' + n + (n === 1 ? ' peça.' : ' peças.'); }
  else if (f.obj.tipo === 'bau') { const n = faltaObjetivo(); falta = n === 1 ? 'Faltou um baú chegar no fundo.' : 'Faltaram ' + n + ' baús chegarem no fundo.'; }
  else if (f.obj.tipo === 'especiais') { const n = faltaObjetivo(); falta = n === 1 ? 'Faltou criar um especial.' : 'Faltou criar ' + n + ' especiais.'; }
  else if (f.obj.tipo === 'chefe') { const n = faltaObjetivo(); falta = 'O mestre ainda tinha ' + n + ' de vida.'; }
  else if (f.obj.tipo === 'perolas') { const n = faltaPrincipal(); falta = n === 1 ? 'Faltou colher uma pérola.' : 'Faltaram ' + n + ' pérolas.'; }
  else if (f.obj.tipo === 'coral') { const n = faltaPrincipal(); falta = n === 1 ? 'Faltou um pedaço de coral.' : 'Faltaram ' + n + ' pedaços de coral.'; }
  else if (f.obj.tipo === 'lixo') { const n = faltaPrincipal(); falta = n === 1 ? 'Sobrou um lixo no fundo.' : 'Sobraram ' + n + ' lixos no fundo.'; }
  else if (f.obj.tipo === 'ninho') { const nv = ninhosVivos(), al = casasCobertas(papel);
    falta = 'Faltaram ' + (nv ? nv + (nv === 1 ? ' ninho' : ' ninhos') + (al ? ' e ' : '') : '') + (al ? al + (al === 1 ? ' alga' : ' algas') : '') + '.'; }
  else if (f.obj.tipo === 'presos') { const n = faltaObjetivo(); falta = n === 1 ? 'Faltou libertar um bicho.' : 'Faltaram ' + n + ' bichos presos.'; }
  else if (f.obj.tipo === 'bolhas') { const n = faltaObjetivo(); falta = n === 1 ? 'Faltou estourar uma bolha.' : 'Faltaram ' + n + ' bolhas.'; }
  else { const n = casasCobertas(papel); falta = (n === 1 ? 'Sobrou ' : 'Sobraram ') + nomeBloq(f, n) + '.'; }
  /* quão perto chegou: decide se oferece a segunda chance */
  const faltaAgora = faltaObjetivo(), faltaIni = Math.max(1, J.faltaInicial || faltaAgora || 1);
  const razao = faltaAgora / faltaIni;
  const perto = f.obj.tipo !== 'chefe' && (razao <= .35 || (f.obj.tipo !== 'pontos' && faltaAgora <= 3));
  const muitoPerto = razao <= .15 || (f.obj.tipo !== 'pontos' && faltaAgora <= 2);
  J.derrota = true; J.vidaCobrada = false;
  if (faltaExtra()) falta += ' E faltou juntar ' + faltaExtra() + (faltaExtra() === 1 ? ' peça' : ' peças') + ' da cor pedida.';
  await espera(400);
  cartao(
    '<h3>' + (perto && !J.segundaChance ? (muitoPerto ? 'Você quase conseguiu! 🌊' : 'Foi por pouco! 🌊') : 'Acabaram as jogadas') + '</h3>' +
    '<p>' + falta + '</p>' +
    (perto && !J.segundaChance ? '<div class="continuar-info"><span>Continuar com <b>+5 jogadas</b> do ponto em que parou</span>' +
      '<span class="preco"><svg viewBox="0 0 100 100"><use href="#i-moeda"/></svg>' + CUSTO_CONTINUAR + '</span></div>' : '') +
    (perto && !J.segundaChance && prog.moedas < CUSTO_CONTINUAR ? '<p class="aviso">Você precisa de mais ' + (CUSTO_CONTINUAR - prog.moedas) + ' moedas para continuar.</p>' : '') +
    '<p class="vidas-derrota">Desistir gasta uma vida · ❤&nbsp;' + prog.vidas + '</p>' +
    '<p class="placar-final">' + nf(J.pontos) + '<small>pontos</small></p>' +
    '<div class="bts">' +
      '<button class="bt vidro" data-ac="mapa">Mapa</button>' +
      (perto && !J.segundaChance
        ? (prog.poderes.folego > 0 ? '<button class="bt" data-ac="folego">Usar fôlego do estoque</button>' : '') +
          '<button class="bt"' + (prog.moedas >= CUSTO_CONTINUAR ? '' : ' disabled') + ' data-ac="continuar">Continuar por ' + CUSTO_CONTINUAR + '</button>' +
          '<button class="bt vidro" data-ac="denovo">Tentar de novo</button>'
        : '<button class="bt" data-ac="denovo">Tentar de novo</button>') +
    '</div>'
  );
}

function precoFolego() { const p = PODERES.find(x => x.id === 'folego'); return p ? p.preco : 260; }
/* sem fôlego no estoque, dá pra comprar na hora, direto no cartão */
function compraFolegoNaHora() {
  const preco = precoFolego();
  if (prog.moedas < preco) return;
  prog.moedas -= preco;
  prog.poderes.folego = (prog.poderes.folego || 0) + 1;
  salvaProg(); pintaMoedas();
  usaFolegoNoCartao();
}

/* depois da vitória, a colocação daquela fase aparece no cartão */
/* o que você fez na fase, dito em uma linha, com o desenho de cada coisa */
function colheitaDaFase() {
  const f = faseAtual(), o = f.obj, itens = [];
  const add = (ic, n, txt) => { if (n > 0) itens.push('<span><svg viewBox="0 0 100 100"><use href="' + ic + '"/></svg>' + n + ' ' + txt + '</span>'); };
  if (o.tipo === 'perolas') add('#i-perola', J.perolasFeitas || 0, (J.perolasFeitas === 1 ? 'pérola' : 'pérolas'));
  if (o.tipo === 'lixo') add('#i-lixo0', J.lixoFeito || 0, 'lixo' + (J.lixoFeito === 1 ? '' : 's') + ' fora do mar');
  if (o.tipo === 'coral') add('#i-coral', J.coralFeito || 0, 'de coral de volta');
  if (o.tipo === 'ninho') add('#i-ninho', J.ninhosFeitos || 0, (J.ninhosFeitos === 1 ? 'ninho derrubado' : 'ninhos derrubados'));
  if (o.tipo === 'presos') add('#i-gaiola', J.presosFeitos || 0, 'bicho' + (J.presosFeitos === 1 ? '' : 's') + ' solto' + (J.presosFeitos === 1 ? '' : 's'));
  if (o.tipo === 'bolhas') add('#i-bolha-ar', J.bolhasFeitas || 0, 'bolha' + (J.bolhasFeitas === 1 ? '' : 's'));
  if (o.tipo === 'bau') add('#i-bau', J.bauFeito || 0, 'baú' + (J.bauFeito === 1 ? '' : 's') + ' no fundo');
  if ((J.criados || 0) > 0) add('#s-arco', J.criados, 'especia' + (J.criados === 1 ? 'l' : 'is') + ' criado' + (J.criados === 1 ? '' : 's'));
  return itens.length ? '<div class="colheita">' + itens.join('') + '</div>' : '';
}

async function mostraPosicaoFase(i, pontos) {
  Ranking.cache = {};
  const lista = await Ranking.daFase(i);
  const el = document.getElementById('pos-fase');
  if (!el || !lista || !lista.length) return;
  const ord = lista.slice().sort((a, b) => (b.pontos || 0) - (a.pontos || 0));
  const meu = Conta.dentro ? Conta.sessao.uid : '';
  const k = ord.findIndex(x => x.id === meu);
  if (k < 0) return;
  if (k === 0) el.innerHTML = '🥇 melhor pontuação desta fase';
  else el.innerHTML = medalha(k) + ' nesta fase · o primeiro fez ' + nf(ord[0].pontos) + ' (' + (ord[0].nome || 'alguém') + ')';
  el.classList.add('mostra');
}

/* ═══ CARTÕES ═══════════════════════════════════════════════════ */
function cartao(html, fechavel) {
  const c = document.getElementById('cartao');
  c.className = 'cartao' + (fechavel ? ' fechavel' : '');
  c.innerHTML = html;
  document.getElementById('veu').classList.add('aberto');
}

/* ── fila de cartões da abertura ────────────────────────────────
   Retomar partida e baú do dia chegavam juntos e um cobria o
   outro. Agora entram um de cada vez.                            */
let filaCartoes = [];
function enfileira(fn) {
  filaCartoes.push(fn);
  if (!document.getElementById('veu').classList.contains('aberto')) tocaFila();
}
function tocaFila() {
  if (document.body.classList.contains('em-jogo')) { filaCartoes.length = 0; return; }
  const f = filaCartoes.shift();
  if (f) f();
}
function fechaCartao() {
  document.getElementById('veu').classList.remove('aberto');
  if (filaCartoes.length) setTimeout(tocaFila, 300);
}

function amostra(base, capa) {
  return '<span class="par"><svg viewBox="0 0 100 100"><use href="#' + base + '"/></svg>' +
    (capa ? '<svg class="sobre" viewBox="0 0 100 100"><use href="#' + capa + '"/></svg>' : '') + '</span>';
}
function mostraAjuda() {
  cartao(
    '<div class="ajuda">' +
    '<h3>Como jogar</h3>' +
    '<p>Arraste uma peça para o lado, para cima ou para baixo. Se ela formar uma fila de três iguais, as três estouram.</p>' +

    '<h4>Quatro em linha viram correnteza</h4>' +
    '<div class="regra"><div class="amostra">' + amostra('s4') + '<span class="seta">›</span>' + amostra('s4', 'sp-lh') + '</div>' +
    '<div>Quando estoura, a correnteza leva a fileira inteira. Se veio de uma fila em pé, leva a coluna.</div></div>' +

    '<h4>Cinco em L ou T viram bolha</h4>' +
    '<div class="regra"><div class="amostra">' + amostra('s2') + '<span class="seta">›</span>' + amostra('s2', 'sp-bomba') + '</div>' +
    '<div>A bolha estoura tudo em volta dela.</div></div>' +

    '<h4>Cinco em linha viram pérola</h4>' +
    '<div class="regra"><div class="amostra">' + amostra('s3') + '<span class="seta">›</span>' + amostra('s-arco') + '</div>' +
    '<div>Troque a pérola com qualquer peça e somem todas daquela cor.</div></div>' +

    '<h4>Seis em linha viram maré</h4>' +
    '<div class="regra"><div class="amostra">' + amostra('s0', 'sp-onda') + '</div>' +
    '<div>A maré leva três fileiras de uma vez. Se veio de uma fila em pé, leva três colunas.</div></div>' +

    '<h4>Montes grandes viram cardume</h4>' +
    '<div class="regra"><div class="amostra">' + amostra('s3', 'sp-cardume') + '</div>' +
    '<div>Quando uma jogada junta sete peças ou mais, nasce um cardume: ele sai caçando a própria cor pelo tabuleiro.</div></div>' +

    '<h4>Especial estoura sozinho</h4>' +
    '<p>Não precisa combinar: troque o especial com qualquer peça do lado, ou toque duas vezes nele, que ele dispara na hora. Gasta uma jogada.</p>' +

    '<h4>Dois especiais juntos</h4>' +
    '<p>Duas correntezas fazem uma cruz. Correnteza com bolha limpa três fileiras e três colunas. Duas pérolas limpam o tabuleiro inteiro.</p>' +

    '<h4>O baú</h4>' +
    '<div class="regra"><div class="amostra">' + amostra('i-bau') + '</div>' +
    '<div>Ele não combina com nada e não sai com especial. Estoure as peças debaixo dele, ou empurre ele de lado gastando uma jogada, até chegar na última fileira.</div></div>' +

    '<h4>Poderes</h4>' +
    '<p>Arpão tira uma peça, troca livre junta duas que estão longe, redemoinho embaralha e fôlego dá mais 5 jogadas, até depois que elas acabaram. Nenhum deles gasta jogada. Moeda para comprar vem de fase concluída e do baú do dia.</p>' +

    '<h4>O que cobre o fundo</h4>' +
    '<p>Em algumas fases o fundo vem coberto de areia, alga, rede, lodo ou breu. Estoure uma peça em cima para limpar a casa. As mais escuras precisam de duas, e em algumas fases a alga volta a crescer: a casa que vai voltar pisca antes.</p>' +

    '<h4>Estrelas</h4>' +
    '<p>Cumprir o objetivo vale uma estrela. As outras duas vêm da pontuação, e ponto bom vem de reação em cadeia e de sobrar jogada no fim.</p>' +
    '</div>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Entendi</button></div>', true
  );
}

/* a primeira vez em cada mundo: onde você está e o que muda */
function mostraMundo(m, i) {
  const mu = ambiente(i == null ? J.fase : i);
  cartao(
    '<div class="intro-mundo">' +
    '<p class="prof-faixa">' + mu.reg.nome + ' · ' + metros(mu.de) + ' a ' + metros(mu.ate) + '</p>' +
    '<h3>' + mu.nome + '</h3>' +
    '<div class="vitrine-mini">' + [0, 1, 2, 3, 4, 5].map(icone).join('') + '</div>' +
    '<p>' + mu.texto + '</p>' +
    '<p class="dica-bloq">' + mu.dica + '</p>' +
    '</div>' +
    '<div class="bts"><button class="bt" data-ac="comeca">Começar</button></div>'
  );
}


/* ═══ PODERES, MOEDAS E LOJA ════════════════════════════════════ */
function pintaMoedas() {
  document.querySelectorAll('.n-moedas').forEach(e => e.textContent = nf(prog.moedas));
}
function pintaPoderes() {
  const bar = document.getElementById('poderes');
  if (!bar) return;
  /* fôlego não fica na barra: ele só é oferecido quando as jogadas
     acabam, como no Candy Crush */
  bar.innerHTML = PODERES.filter(p => p.id !== 'folego').map(p => {
    const n = prog.poderes[p.id] || 0;
    return '<button class="poder' + (n ? '' : ' vazio') + (poderAtivo === p.id ? ' armado' : '') + '" data-p="' + p.id + '" ' +
      'aria-label="' + p.nome + ', ' + n + ' em estoque">' +
      '<svg viewBox="0 0 100 100"><use href="#p-' + p.id + '"/></svg>' +
      '<span class="nome">' + p.nome.split(' ')[0] + '</span><span class="qtd">' + n + '</span></button>';
  }).join('');
}
function gastaPoder(id) {
  prog.poderes[id] = Math.max(0, (prog.poderes[id] || 0) - 1);
  salvaProg();
  pintaPoderes();
}
function desligaPoder() {
  poderAtivo = null; poderAlvo = null;
  limpaMarca();
  document.body.classList.remove('mirando');
  const d = document.getElementById('dica-poder');
  if (d) d.hidden = true;
  pintaPoderes();
}
function clicaPoder(id) {
  const n = prog.poderes[id] || 0;
  Som.liga();
  if (!n) { Som.nao(); mostraLoja(); return; }
  if (J.ocupado || J.fim) return;
  if (poderAtivo === id) { desligaPoder(); return; }
  desligaPoder();
  if (id === 'giro') { gastaPoder('giro'); giroAgora(); return; }
  if (id === 'folego') { gastaPoder('folego'); J.mov += 5; J.movExtra = (J.movExtra || 0) + 5; atualizaHud(); Som.pop(5); faixaTexto('+5 jogadas'); return; }
  poderAtivo = id;
  document.body.classList.add('mirando');
  const d = document.getElementById('dica-poder');
  d.hidden = false;
  d.textContent = id === 'arpao' ? 'Toque na peça que vai sair' : id === 'isca' ? 'Toque na peça que vai virar bolha' : 'Toque nas duas peças que vão trocar de lugar';
  pintaPoderes();
}
/* ═══ VIDAS ══════════════════════════════════════════════════════
   Cinco vidas. Perder a fase custa uma; vencer não custa nada.
   Uma volta a cada 15 minutos, contando mesmo com o jogo fechado. */
const VIDAS_MAX = 5, VIDA_MS = 15 * 60 * 1000, CUSTO_ENCHER = 200, CUSTO_CONTINUAR = 120;
function atualizaVidas() {
  if (prog.vidas == null) { prog.vidas = VIDAS_MAX; prog.vidaMarca = Date.now(); }
  if (prog.vidas >= VIDAS_MAX) { prog.vidaMarca = Date.now(); return; }
  const ganha = Math.floor((Date.now() - (prog.vidaMarca || Date.now())) / VIDA_MS);
  if (ganha > 0) {
    prog.vidas = Math.min(VIDAS_MAX, prog.vidas + ganha);
    prog.vidaMarca = prog.vidas >= VIDAS_MAX ? Date.now() : prog.vidaMarca + ganha * VIDA_MS;
    salvaProg();
  }
}
const proximaVida = () => { atualizaVidas(); return prog.vidas >= VIDAS_MAX ? 0 : Math.max(0, VIDA_MS - (Date.now() - prog.vidaMarca)); };
const mmss = ms => { const t = Math.ceil(ms / 1000); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
function gastaVida() {
  atualizaVidas();
  if (prog.vidas >= VIDAS_MAX) prog.vidaMarca = Date.now();
  prog.vidas = Math.max(0, prog.vidas - 1);
  salvaProg(); salvaNaNuvemDepois(); pintaVidas();
}
function pintaVidas() {
  atualizaVidas();
  const t = proximaVida();
  document.querySelectorAll('.pilula-vidas').forEach(el => {
    el.innerHTML = '<b>❤ ' + prog.vidas + ((prog.vidasAmigos || 0) > 0 ? '<i>+' + prog.vidasAmigos + '</i>' : '') + '</b><small>' + (prog.vidas < VIDAS_MAX ? mmss(t) : 'cheio') + '</small>';
    el.classList.toggle('vazia', prog.vidas <= 0);
  });
  const conta = document.getElementById('vida-conta');
  if (conta) conta.textContent = prog.vidas > 0 ? 'Voltou uma vida!' : mmss(t);
}
setInterval(pintaVidas, 1000);
/* ═══ VIDAS ENTRE AMIGOS ═══════════════════════════════════════════
   Amigo do cardume manda vida sem perder as dele. As recebidas ficam
   numa reserva separada das 5 normais e só entram quando as normais
   acabam. Recebe no máximo 5 por dia; o que passar espera amanhã.   */
const RECEBE_POR_DIA = 5;
function recebidasHoje() { const r = prog.recebidas || {}; return r.dia === hoje() ? r.n : 0; }
async function recebeVidas() {
  if (!Ranking.ligado) return 0;
  const caixa = await Ranking.pega('/mergulho/presentes/' + Conta.sessao.uid, '');
  if (!caixa || !caixa.length) return 0;
  const nomes = [];
  for (const g of caixa) {
    if (recebidasHoje() >= RECEBE_POR_DIA) break;
    prog.vidasAmigos = (prog.vidasAmigos || 0) + 1;
    prog.recebidas = { dia: hoje(), n: recebidasHoje() + 1 };
    nomes.push(g.nome || 'um amigo');
    await Ranking.manda('/mergulho/presentes/' + Conta.sessao.uid + '/' + g.id, null);
  }
  Ranking.cache = {};
  if (nomes.length) {
    salvaProg(); pintaVidas();
    faixaOuCartao('❤ ' + (nomes.length === 1 ? nomes[0] + ' te mandou uma vida' : nomes.length + ' vidas de ' + nomes.slice(0, 3).join(', ')));
  }
  return nomes.length;
}
/* quem do cardume pediu vida: aparece assim que você abre o jogo,
   com o botão de mandar ali mesmo, e o ícone do app ganha o número */
/* o que mudou nesta versão: aparece uma vez para cada pessoa */
const NOVIDADES = [
  ['❤', 'Sair no meio da fase agora gasta vida', 'O jogo avisa antes, e dá pra desistir de sair.'],
  ['👆', 'Toque no objetivo', 'As casas que faltam acendem por dois segundos. Ótimo quando está tudo da mesma cor.'],
  ['🦑', 'Mestres mais bravos', 'Mais vida, menos jogadas, tinta bem visível e, a cada golpe, ele se recupera um pouco.'],
  ['🌊', 'Fases mais apertadas', 'Menos jogadas nas fases normais, difíceis e lendárias.'],
  ['🎁', 'Mandar vida tem limite', 'Até 5 por dia, pra vida continuar valendo.'],
  ['🎲', 'Condições do mar', 'Muitas fases agora vêm com uma regra extra: especiais de presente, cor que vale o dobro ou moedas escondidas no fundo.'],
  ['🐟', 'Peixe-guia', 'Em algumas fases, 4 peças iguais em quadrado viram um peixe que nada direto até o que o objetivo pede.'],
  ['⚡', 'Enguia-elétrica redesenhada', 'O mestre da fase 200 ganhou cara de bicho de verdade.']
];
function mostraNovidades() {
  if (!prog.max || prog.viuNovidades === VERSAO_JOGO || document.getElementById('veu').classList.contains('aberto')) return false;
  prog.viuNovidades = VERSAO_JOGO; salvaProg();
  cartao('<div class="aviso-arte coracao"><span>✨</span></div><p class="aviso-novo">versão ' + VERSAO_JOGO + '</p><h3>Novidades no fundo do mar</h3>' +
    '<div class="novidades">' + NOVIDADES.map(([ic, t1, t2]) => '<div class="novidade"><span class="ic-nov">' + ic + '</span><div><b>' + t1 + '</b><small>' + t2 + '</small></div></div>').join('') + '</div>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Bora mergulhar</button></div>', true);
  return true;
}
async function avisaPedidos() {
  if (!Ranking.ligado || !prog.cardume) return;
  const ped = await Ranking.pega('/mergulho/pedidos/' + prog.cardume, '');
  if (!ped) return;
  const agora = Date.now(), visto = prog.pedidoVisto || {};
  const abertos = ped.filter(q => q.id !== Conta.sessao.uid && agora - (q.quando || 0) < 864e5 && !jaMandeiHoje(q.id));
  try { if (navigator.setAppBadge) abertos.length ? navigator.setAppBadge(abertos.length) : navigator.clearAppBadge(); } catch (e) {}
  const novos = abertos.filter(q => visto[q.id] !== q.quando);
  if (!novos.length || document.getElementById('veu').classList.contains('aberto')) return;
  prog.pedidoVisto = Object.assign({}, visto); novos.forEach(q => prog.pedidoVisto[q.id] = q.quando); salvaProg();
  const horas = q => { const h = Math.max(1, Math.round((agora - q.quando) / 36e5)); return h < 2 ? 'agora há pouco' : 'há ' + h + ' horas'; };
  Som.liga(); Som.pop(6);
  cartao('<div class="aviso-arte coracao"><span>❤</span></div><p class="aviso-novo">pedido do cardume</p>' +
    '<h3>' + (novos.length === 1 ? novos[0].nome + ' está sem vidas' : novos.length + ' amigos estão sem vidas') + '</h3>' +
    '<p class="aviso-lead">Mandar vida não gasta nenhuma das suas.</p>' +
    '<div class="pedidos-lista">' + novos.map(q => '<div class="pedido"><b>' + (q.nome || 'mergulhador') + '</b><small>' + horas(q) + '</small>' +
      '<button class="bt-vida" data-ac="mandavida" data-id="' + q.id + '" data-nome="' + (q.nome || '') + '">❤ Mandar</button></div>').join('') + '</div>' +
    '<div class="bts"><button class="bt vidro" data-ac="fecha">Depois</button></div>', true);
}
function faixaOuCartao(txt) {
  if (document.body.classList.contains('em-jogo')) return faixaTexto(txt, 2600);
  cartao('<h3>Chegou presente</h3><p class="presente-txt">' + txt + '</p><p>Elas ficam guardadas e entram quando as suas 5 acabarem.</p>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Beleza</button></div>', true);
}
const jaMandeiHoje = uid => (prog.enviadas || {})[uid] === hoje();
const MANDA_POR_DIA = 5;
const mandadasHoje = () => { const e = prog.mandadas || {}; return e.dia === hoje() ? e.n : 0; };
async function mandaVida(uid, nome, botao) {
  if (!Ranking.ligado || jaMandeiHoje(uid) || uid === Conta.sessao.uid) return;
  if (mandadasHoje() >= MANDA_POR_DIA) {
    if (botao) { botao.disabled = true; botao.textContent = 'Limite de hoje'; }
    faixaTexto('Você já mandou ' + MANDA_POR_DIA + ' vidas hoje. Amanhã tem mais.', 2600);
    return;
  }
  if (botao) { botao.disabled = true; botao.textContent = 'Enviando...'; }
  const foi = await Ranking.manda('/mergulho/presentes/' + uid + '/' + Conta.sessao.uid, { nome: Ranking.nome(), quando: Date.now() });
  if (foi) {
    prog.enviadas = Object.assign({}, prog.enviadas || {}, { [uid]: hoje() });
    prog.mandadas = { dia: hoje(), n: mandadasHoje() + 1 };
    salvaProg(); Som.liga(); Som.pop(6);
    if (botao) botao.textContent = '❤ Enviada';
  } else if (botao) { botao.disabled = false; botao.textContent = 'Tentar de novo'; }
}
async function pedeVidas(botao) {
  if (!prog.cardume) { mostraRanking('cardume'); return; }
  await Conta.garante();
  if (botao) { botao.disabled = true; botao.textContent = 'Pedindo...'; }
  const foi = await Ranking.manda('/mergulho/pedidos/' + prog.cardume + '/' + Conta.sessao.uid, { nome: Ranking.nome(), quando: Date.now() });
  if (botao) botao.textContent = foi ? 'Pedido enviado ao cardume' : 'Sem internet agora';
}
function usaVidaDeAmigo() {
  if ((prog.vidasAmigos || 0) <= 0) return;
  prog.vidasAmigos--; prog.vidas = Math.max(prog.vidas, 1);
  salvaProg(); pintaVidas(); Som.liga(); Som.pop(5); fechaCartao();
}

function semVidas() {
  const pode = prog.moedas >= CUSTO_ENCHER;
  cartao('<h3>Sem vidas</h3><p>As vidas voltam sozinhas, uma a cada 15 minutos, mesmo com o jogo fechado.</p>' +
    '<p class="vida-proxima">❤️ Próxima vida em <b id="vida-conta">' + mmss(proximaVida()) + '</b></p>' +
    ((prog.vidasAmigos || 0) > 0 ? '<div class="bts"><button class="bt" data-ac="usavidaamigo">Usar vida de amigo · ' + prog.vidasAmigos + ' guardada' + (prog.vidasAmigos === 1 ? '' : 's') + '</button></div>' : '') +
    '<div class="bts"><button class="bt vidro" data-ac="fecha">Esperar</button>' +
    '<button class="bt"' + (pode ? '' : ' disabled') + ' data-ac="enchevidas">Encher as 5 por ' + CUSTO_ENCHER + ' moedas</button></div>' +
    '<div class="bts"><button class="bt vidro" data-ac="pedevidas">' + (prog.cardume ? 'Pedir vidas ao cardume' : 'Entrar num cardume pra pedir vidas') + '</button></div>' +
    (pode ? '' : '<p class="aviso">Faltam ' + (CUSTO_ENCHER - prog.moedas) + ' moedas para encher agora.</p>'), true);
}
function encheVidas() {
  if (prog.moedas < CUSTO_ENCHER) return;
  prog.moedas -= CUSTO_ENCHER; prog.vidas = VIDAS_MAX; prog.vidaMarca = Date.now();
  salvaProg(); pintaMoedas(); pintaVidas(); salvaNaNuvemDepois();
  Som.liga(); Som.vitoria(); fechaCartao();
}

function semVidasOuConta() {
  if (prog.vidas <= 0) return semVidas();
  cartao('<h3>❤ ' + prog.vidas + ' de 5</h3><p>A próxima volta em <b id="vida-conta">' + mmss(proximaVida()) + '</b>. Cada fase perdida gasta uma vida; vencer não gasta nada.</p>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Beleza</button></div>', true);
}
function cobraDerrota() {
  if (J && J.derrota && !J.vidaCobrada && !J.desafio) { J.vidaCobrada = true; gastaVida(); }
}
function continuaPorMoedas() {
  if (prog.moedas < CUSTO_CONTINUAR || J.segundaChance) return;
  prog.moedas -= CUSTO_CONTINUAR; salvaProg(); pintaMoedas();
  J.segundaChance = true; J.derrota = false;
  fechaCartao();
  J.fim = false; J.ocupado = false; J.mov += 5; J.movExtra = (J.movExtra || 0) + 5;
  atualizaHud(); reiniciaDica(); Som.liga(); Som.pop(5); faixaTexto('+5 jogadas');
}

function usaFolegoNoCartao() {
  if ((prog.poderes.folego || 0) <= 0 || J.segundaChance) return;
  gastaPoder('folego');
  J.segundaChance = true; J.derrota = false;
  fechaCartao();
  J.fim = false; J.ocupado = false; J.mov += 5; J.movExtra = (J.movExtra || 0) + 5;
  atualizaHud(); reiniciaDica();
  Som.liga(); Som.pop(5);
  faixaTexto('+5 jogadas');
}
const moedaSvg = '<svg viewBox="0 0 100 100"><use href="#i-moeda"/></svg>';
function mostraLoja() {
  cartao(
    '<h3>Loja</h3>' +
    '<p class="saldo">' + moedaSvg + '<span class="n-moedas">' + nf(prog.moedas) + '</span></p>' +
    '<p>Moeda vem das fases, da Semana do mergulhador e dos mestres derrotados.</p>' +
    PODERES.map(p => {
      const tem = prog.poderes[p.id] || 0, pode = prog.moedas >= p.preco;
      return '<div class="item-loja"><svg viewBox="0 0 100 100"><use href="#p-' + p.id + '"/></svg>' +
        '<div class="txt"><b>' + p.nome + '</b><small>' + p.texto + '</small><span class="tem">você tem ' + tem + '</span></div>' +
        '<button class="bt-compra" data-ac="compra" data-id="' + p.id + '"' + (pode ? '' : ' disabled') + '>' + moedaSvg + p.preco + '</button></div>';
    }).join('') +
    '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>', true
  );
}
function compra(id) {
  const p = PODERES.find(x => x.id === id);
  if (!p || prog.moedas < p.preco) { Som.nao(); return; }
  prog.moedas -= p.preco;
  prog.poderes[id] = (prog.poderes[id] || 0) + 1;
  salvaProg();
  Som.pop(6);
  pintaMoedas(); pintaPoderes();
  mostraLoja();
}
/* baú do dia: uma vez por dia, sem relógio nem conta */
/* ═══ SEMANA DO MERGULHADOR ═════════════════════════════════════
   Sete dias seguidos, cada um com o seu prêmio e o sétimo com o
   baú do fundo. Faltou um dia, a semana recomeça: é isso que faz
   valer a pena aparecer todo dia.                                */
const SEMANA = [
  { moedas: 40,  texto: 'Primeiro fôlego' },
  { moedas: 60,  texto: 'Pegando o ritmo' },
  { moedas: 40,  poder: 'arpao',  texto: 'Um arpão pra você' },
  { moedas: 100, texto: 'Meio da semana' },
  { moedas: 60,  poder: 'isca',   texto: 'Uma isca de luz' },
  { moedas: 150, texto: 'Quase lá' },
  { moedas: 400, todos: true, texto: 'Baú do fundo' }
];
/* mesma contagem de dia que o resto do jogo usa, pra sequência
   não quebrar por causa de fuso                                  */
const ontem = () => dataLocal(new Date(Date.now() - 864e5));
/* quem jogou na virada do fuso não pode perder a sequência por
   causa da mudança de contagem: o dia velho, em UTC, também vale */
const ontemUTC = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const seguiuOntem = () => prog.dia === ontem() || prog.dia === ontemUTC() || prog.dia === new Date().toISOString().slice(0, 10);
function diaDaSemana() {
  /* que dia da trilha é hoje, sem ainda marcar como pego */
  if (!prog.dia) return 1;
  if (seguiuOntem()) return ((prog.seq || 0) % 7) + 1;
  return 1;                                   /* furou: recomeça */
}
/* cada semana fechada engorda a próxima: o 7º dia da semana 4 vale
   o dobro do da primeira. Sem teto de crescimento infinito.      */
const fatorSemana = () => 1 + Math.min(1.5, (prog.semanas || 0) * .25);
const premioDoDia = k => {
  const d = SEMANA[k], f = fatorSemana();
  return { moedas: Math.round(d.moedas * f / 10) * 10, poder: d.poder, todos: d.todos, texto: d.texto,
           quantos: d.todos ? 1 + Math.min(2, Math.floor((prog.semanas || 0) / 2)) : 1 };
};
function mostraBau() {
  /* já pegou hoje: mostra o dia em que você está, não o próximo */
  const pegou = jaPegouHoje();
  const dia = pegou ? (prog.seq || 1) : diaDaSemana();
  const quebrou = !pegou && prog.dia && !seguiuOntem() && (prog.seq || 0) > 1;
  const semana = (prog.semanas || 0) + 1;
  const trilha = SEMANA.map((_, k) => {
    const d = premioDoDia(k), n = k + 1, passou = n < dia || (n === dia && pegou), hojeE = n === dia && !pegou;
    const premio = d.todos ? '<b>' + d.moedas + '</b><i>+ ' + (d.quantos > 1 ? d.quantos + ' de cada poder' : 'tudo') + '</i>'
      : d.poder ? '<b>' + d.moedas + '</b><i>+ ' + (PODERES.find(p => p.id === d.poder) || {}).nome + '</i>'
      : '<b>' + d.moedas + '</b><i>moedas</i>';
    return '<div class="dia-semana' + (passou ? ' passou' : '') + (hojeE ? ' hoje' : '') + (d.todos ? ' grande' : '') + '">' +
      '<span class="rot">' + (d.todos ? '7º' : n + 'º') + '</span>' +
      '<span class="premio">' + premio + '</span>' +
      (passou ? '<span class="ok">✓</span>' : '') + '</div>';
  }).join('');
  cartao('<h3>Semana ' + semana + '</h3>' +
    '<p>' + (quebrou ? 'Você faltou um dia, então a semana recomeça. ' : '') +
    'Dia <b>' + dia + ' de 7</b>' + (prog.melhorSeq > 1 ? ' · melhor sequência: ' + prog.melhorSeq + ' dias' : '') +
    (semana > 1 ? '<br><i class="premio-cresce">prêmios ' + Math.round((fatorSemana() - 1) * 100) + '% maiores nesta semana</i>' : '') + '</p>' +
    '<div class="trilha-semana">' + trilha + '</div>' +
    (jaPegouHoje()
      ? '<p class="semana-espera">Você já pegou o de hoje. O próximo abre em <b>' + horasAteAmanha() + '</b>.</p>' +
        '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>'
      : '<div class="bts"><button class="bt" data-ac="bau">Pegar o prêmio de hoje</button></div>'), true);
}
function pegaBau() {
  const dia = diaDaSemana(), d = premioDoDia(dia - 1);
  prog.moedas += d.moedas;
  prog.poderes = prog.poderes || {};
  if (d.poder) prog.poderes[d.poder] = (prog.poderes[d.poder] || 0) + 1;
  if (d.todos) {
    ['arpao', 'troca', 'giro', 'isca', 'folego'].forEach(k => prog.poderes[k] = (prog.poderes[k] || 0) + d.quantos);
    prog.semanas = (prog.semanas || 0) + 1;
  }
  prog.seq = dia;
  prog.melhorSeq = Math.max(prog.melhorSeq || 0, dia);
  prog.dia = hoje();
  salvaProg();
  pintaMoedas(); pintaPoderes();
  salvaNaNuvemDepois();
  Som.liga(); Som.vitoria();
  pintaSemanaHome();
  if (d.todos) fogos();
  cartao('<h3>' + d.texto + '</h3>' +
    '<p class="bau-premio">' + moedaSvg + '+' + d.moedas + '</p>' +
    '<p>' + (d.todos ? 'Fechou a semana ' + (prog.semanas) + ' e levou ' + d.quantos + ' de cada poder. A semana que vem paga ainda mais.'
           : d.poder ? 'E mais um ' + (PODERES.find(p => p.id === d.poder) || {}).nome + ' no estoque. Volte amanhã: o prêmio de amanhã é maior.'
           : 'Volte amanhã que o prêmio aumenta. No sétimo dia vem o baú do fundo.') + '</p>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Beleza</button></div>', true);
}


/* ═══ DESAFIO DA SEMANA ════════════════════════════════════════
   Mesma semente para todo mundo na semana: o tabuleiro e a ordem
   das peças novas são iguais, ganha quem jogar melhor.           */
const Placar = {
  async envia(nome, pontos, semana) {
    if (!Conta.ligada || !Conta.dentro) return;
    const t = await Conta.token();
    if (!t) return;
    try {
      await fetch(Conta.cfg.banco + '/mergulho/desafio/' + semana + '/' + Conta.sessao.uid + '.json?auth=' + t,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome || prog.apelido || (Conta.sessao.email || '').split('@')[0], pontos: pontos, quando: Date.now() }) });
    } catch (e) {}
  },
  async lista(semana) {
    if (!Conta.ligada) return null;
    try {
      const r = await fetch(Conta.cfg.banco + '/mergulho/desafio/' + semana + '.json');
      const d = await r.json();
      return Object.keys(d || {}).map(k => d[k]).sort((a, b) => b.pontos - a.pontos).slice(0, 20);
    } catch (e) { return null; }
  }
};
function melhorDaSemana(f) { return prog.desafio.semana === f.semana ? prog.desafio.melhor : 0; }
function mostraDesafio() {
  const f = faseDesafio(), melhor = melhorDaSemana(f);
  cartao('<h3>Desafio da semana</h3>' +
    '<p>O mesmo tabuleiro para todo mundo até domingo. São 25 jogadas e vale quem fizer mais ponto.</p>' +
    '<p class="melhor">' + (melhor ? 'Seu melhor: ' + nf(melhor) : 'Você ainda não jogou esta semana.') + '</p>' +
    '<div class="bts"><button class="bt vidro" data-ac="fecha">Agora não</button>' +
    '<button class="bt" data-ac="desafio">Jogar</button></div>', true);
}
function abreDesafio() {
  const f = faseDesafio();
  desafioAtual = f;
  semeiaJogo(f.semana);
  instalaMundo(f.m, 1);
  descida('Desafio da semana');
  J = { fase: -1, desafio: true, mov: f.mov, pontos: 0, coletado: [0, 0, 0, 0, 0, 0],
        papelTotal: 0, papelFeito: 0, ocupado: true, fim: false, cascata: 1,
        bauFeito: 0, bauNaTela: 0, bauPendentes: 0, criados: 0, objBatido: false, contaCresce: 0, alvoCresce: null };
  papel = Array.from({ length: H }, () => Array(W).fill(0));
  J.papelBase = papel.map(l => l.slice());
  TOPO = (f.forma || Array(W).fill(0)).slice();
  QUADRADO_ATIVO = !!f.quadrado;
  pintaFundoMestre(f.obj.tipo === 'chefe' ? f.obj.mestre : null);
  document.body.classList.toggle('com-mestre', f.obj.tipo === 'chefe');
  for (let c = 0; c < W; c++) for (let r = 0; r < TOPO[c]; r++) { papel[r][c] = 0; if (J.papelBase) J.papelBase[r][c] = 0; }
  J.papelTotal = contaPapel(papel);
  pontosNaTela = 0;
  montaTabuleiro();
  fechaCartao();
  tela('tela-jogo');
  requestAnimationFrame(() => {
    montaCasas(); dimensiona(); montaPecas(); pintaNinhos(); pintaCasasEspeciais(); atualizaHud(); desligaPoder();
    mesa.classList.remove('com-bau');
    comecaFase();
  });
}
async function fimDesafio() {
  J.fim = true; J.ocupado = true;
  const f = desafioAtual;
  if (prog.desafio.semana !== f.semana) { prog.desafio.semana = f.semana; prog.desafio.melhor = 0; }
  const recorde = J.pontos > prog.desafio.melhor;
  if (recorde) prog.desafio.melhor = J.pontos;
  prog.moedas += 20;
  salvaProg(); pintaMoedas();
  Som.liga(); Som.vitoria();
  if (recorde) fogos(6);
  await espera(400);
  cartao('<h3>' + (recorde ? 'Recorde da semana!' : 'Fim do desafio') + '</h3>' +
    '<p class="placar-final">' + nf(J.pontos) + '<small>pontos</small></p>' +
    '<p class="melhor">Seu melhor nesta semana: ' + nf(prog.desafio.melhor) + '</p>' +
    '<p class="ganho-moedas">' + moedaSvg + '+20</p>' +
    '<div class="bts"><button class="bt vidro" data-ac="mapa">Mapa</button>' +
    '<button class="bt vidro" data-ac="compartilha">Mandar pro grupo</button>' +
    '<button class="bt" data-ac="desafio">Jogar de novo</button></div>');
  Placar.envia(prog.desafio.nome, prog.desafio.melhor, f.semana);
}
async function compartilhaDesafio(botao) {
  const txt = 'Fiz ' + nf(prog.desafio.melhor) + ' pontos no desafio da semana do Mergulho (' + desafioAtual.semana + '). Bora bater?\n' + location.href;
  try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch (e) { return; }
  try { await navigator.clipboard.writeText(txt); botao.textContent = 'Copiado!'; setTimeout(() => botao.textContent = 'Mandar pro grupo', 2000); } catch (e) {}
}

/* ═══ VERSÃO NOVA ══════════════════════════════════════════════
   O service worker avisa quando baixou uma versão nova. Nada
   recarrega no meio da partida: aparece uma faixa e você decide.
   Antes de trocar, a partida em andamento é guardada.            */
let precisaTrocar = false, trocando = false;

/* A troca de versão nunca interrompe: se a pessoa está numa fase, a
   nova espera. Ela entra quando volta pro mapa, pro início, ou
   quando o app vai pro segundo plano.                              */
window.avisaVersao = function () { precisaTrocar = true; talvezAtualizar(); };

function talvezAtualizar(mesmoEmJogo) {
  if (!precisaTrocar || trocando) return false;
  if (!mesmoEmJogo && document.body.classList.contains('em-jogo')) return false;
  if (document.getElementById('veu').classList.contains('aberto')) return false;
  aplicaVersao();
  return true;
}

function aplicaVersao() {
  const A = window.Atualizacao;
  trocando = true;
  salvaPartida();
  if (!A || !A.reg || !A.reg.waiting) { location.reload(); return; }
  A.aplicando = true;
  try { A.reg.waiting.postMessage('atualiza-agora'); } catch (e) {}
  setTimeout(() => location.reload(), 1200);   /* rede de segurança */
}

/* procura na hora, quando a pessoa pede nos ajustes */
async function procuraVersao(botao) {
  const A = window.Atualizacao;
  if (botao) botao.textContent = 'Procurando...';
  if (!A || !A.reg) { if (botao) botao.textContent = 'Sem conexão'; return; }
  try { await A.reg.update(); } catch (e) {}
  await espera(900);
  if (A.reg.waiting || precisaTrocar) { precisaTrocar = true; if (botao) botao.textContent = 'Atualizando...'; aplicaVersao(); }
  else if (botao) { botao.textContent = 'Já é a mais nova'; setTimeout(() => botao.textContent = 'Procurar', 2200); }
}

/* ═══ AJUSTES E DESEMPENHO ═════════════════════════════════════
   Aparelho fraco não some com o jogo: entra o modo leve, que tira
   desfoque, partícula e brilho e deixa o essencial.              */
function aplicaLeve() { document.body.classList.toggle('leve', !!prog.leve); }
function decideLeve() {
  if (prog.leve !== null && prog.leve !== undefined) return;
  const nucleos = navigator.hardwareConcurrency || 4;
  const memoria = navigator.deviceMemory || 4;
  prog.leve = nucleos <= 4 && memoria <= 4;   /* na dúvida entra cheio: o vigia de fps corrige depois */
  salvaProg();
}
let olhoFps = null, jaMediu = false;
function vigiaFps() {
  if (jaMediu || prog.leve) return;
  jaMediu = true;
  let quadros = 0;
  const t0 = performance.now();
  const passo = () => {
    quadros++;
    const dt = performance.now() - t0;
    if (dt < 4000) { olhoFps = requestAnimationFrame(passo); return; }
    olhoFps = null;
    if (quadros / (dt / 1000) < 38) {
      prog.leve = true; salvaProg(); aplicaLeve();
      faixaTexto('Modo leve');
      setTimeout(() => cartao('<h3>Liguei o modo leve</h3>' +
        '<p>O jogo estava engasgando neste aparelho, então tirei desfoque, partícula e brilho pra rodar liso. Dá pra voltar atrás nos ajustes, no botão de engrenagem da tela inicial.</p>' +
        '<div class="bts"><button class="bt" data-ac="fecha">Beleza</button></div>'), 900);
    }
  };
  olhoFps = requestAnimationFrame(passo);
}

const CHAVES_AJUSTE = [
  { k: 'som', nome: 'Som', texto: 'Estouros, especiais e avisos.' },
  { k: 'musica', nome: 'Música', texto: 'A trilha que toca por baixo.' },
  { k: 'vibrar', nome: 'Vibração', texto: 'Tremida a cada jogada.' },
  { k: 'cheio', nome: 'Efeitos cheios', texto: 'Desligue se o aparelho engasgar.' }
];
const valorAjuste = k => k === 'cheio' ? !prog.leve : !!prog[k];
function mostraAjustes() {
  cartao('<h3>Ajustes</h3>' +
    CHAVES_AJUSTE.map(a =>
      '<div class="ajuste"><div class="txt"><b>' + a.nome + '</b><small>' + a.texto + '</small></div>' +
      '<button class="chave' + (valorAjuste(a.k) ? ' on' : '') + '" data-ac="mudar" data-k="' + a.k + '" ' +
      'role="switch" aria-checked="' + valorAjuste(a.k) + '" aria-label="' + a.nome + '"><span></span></button></div>').join('') +
    '<div class="ajuste"><div class="txt"><b>Código de presente</b><small>se alguém te passar um</small></div>' +
      '<button class="bt-compra" data-ac="codigo">Usar</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Seu nome no ranking</b><small>' + (prog.apelido || 'ainda sem nome') + '</small></div>' +
      '<button class="bt-compra" data-ac="apelido">' + (prog.apelido ? 'Trocar' : 'Escolher') + '</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Progresso</b><small>' +
      (Conta.dentro ? Conta.sessao.email : Conta.ligada ? 'Ainda só neste aparelho' : 'Guardado neste aparelho') + '</small></div>' +
      '<button class="bt-compra" data-ac="conta">' + (Conta.dentro ? 'Ver' : 'Guardar') + '</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Versão</b><small>' + VERSAO_JOGO +
      (precisaTrocar ? ' · tem uma nova pronta' : '') + '</small></div>' +
      '<button class="bt-compra" data-ac="procura">' + (precisaTrocar ? 'Atualizar' : 'Procurar') + '</button></div>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>', true);
}
function mudaAjuste(k) {
  if (k === 'cheio') { prog.leve = !prog.leve; aplicaLeve(); }
  else prog[k] = !prog[k];
  salvaProg();
  pintaBotaoSom();
  if (k === 'som' || k === 'musica') {
    if (prog.som && prog.musica) { Som.liga(); Musica.liga(document.body.classList.contains('em-jogo') ? 'jogo' : 'menu', mundoAtual); }
    else Musica.para();
  }
  if (prog.som) { Som.liga(); Som.toque(); }
  if (k === 'vibrar' && prog.vibrar) vibra(TREMIDA.especial);
  mostraAjustes();
}


/* ═══ CONTA NA NUVEM ════════════════════════════════════════════
   E-mail e senha pelo REST do Firebase, sem SDK nenhum. Ao entrar,
   o progresso da nuvem e o do aparelho se juntam pelo melhor de
   cada um: entrar numa conta nunca apaga o que já foi jogado.
   O código de backup continua como rede extra, offline.          */
const Conta = {
  cfg: window.MERGULHO_NUVEM || { chave: '', banco: '' },
  sessao: null,
  get ligada() { return !!(this.cfg.chave && this.cfg.banco); },
  get dentro() { return !!(this.sessao && this.sessao.refresh); },
  carrega() { try { this.sessao = JSON.parse(localStorage.getItem(CHAVE + '-sessao')) || null; } catch (e) { this.sessao = null; } },
  guarda() { try { localStorage.setItem(CHAVE + '-sessao', JSON.stringify(this.sessao)); } catch (e) {} },
  sai() { this.sessao = null; try { localStorage.removeItem(CHAVE + '-sessao'); } catch (e) {} },

  async identidade(caminho, corpo) {
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:' + caminho + '?key=' + this.cfg.chave,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
    const d = await r.json();
    if (!r.ok) throw new Error((d && d.error && d.error.message) || 'ERRO');
    return d;
  },
  guardaSessao(d, email) {
    this.sessao = { id: d.idToken, refresh: d.refreshToken, uid: d.localId,
                    email: email || d.email || '', expira: Date.now() + (+d.expiresIn || 3600) * 1000 - 60000 };
    this.guarda();
  },
  /* quem não quer cadastro entra assim: uma conta sem e-mail, criada
     na hora, só pra ter lugar no ranking e guardar o progresso.     */
  async anonimo() {
    if (!this.ligada || this.dentro) return this.dentro;
    try {
      const d = await this.identidade('signUp', { returnSecureToken: true });
      this.sessao = { id: d.idToken, refresh: d.refreshToken, uid: d.localId, email: '', anon: true,
                      expira: Date.now() + (+d.expiresIn || 3600) * 1000 - 60000 };
      this.guarda();
      return true;
    } catch (e) { return false; }
  },
  async garante() { return this.dentro ? true : await this.anonimo(); },
  async cria(email, senha) { this.guardaSessao(await this.identidade('signUp', { email: email, password: senha, returnSecureToken: true }), email); },
  async entra(email, senha) { this.guardaSessao(await this.identidade('signInWithPassword', { email: email, password: senha, returnSecureToken: true }), email); },
  async esqueci(email) { await this.identidade('sendOobCode', { requestType: 'PASSWORD_RESET', email: email }); },

  async token() {
    if (!this.dentro) return null;
    if (Date.now() < this.sessao.expira) return this.sessao.id;
    const r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + this.cfg.chave,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(this.sessao.refresh) });
    const d = await r.json();
    if (!r.ok) return null;
    this.sessao.id = d.id_token; this.sessao.refresh = d.refresh_token;
    this.sessao.expira = Date.now() + (+d.expires_in || 3600) * 1000 - 60000;
    this.guarda();
    return this.sessao.id;
  },
  async salva() {
    if (!this.ligada || !this.dentro) return false;
    const t = await this.token();
    if (!t) return false;
    try {
      const r = await fetch(this.cfg.banco + '/mergulho/jogadores/' + this.sessao.uid + '.json?auth=' + t,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quando: Date.now(), versao: VERSAO_JOGO, prog: prog }) });
      return r.ok;
    } catch (e) { return false; }
  },
  async puxa() {
    if (!this.ligada || !this.dentro) return null;
    const t = await this.token();
    if (!t) return null;
    try {
      const r = await fetch(this.cfg.banco + '/mergulho/jogadores/' + this.sessao.uid + '.json?auth=' + t);
      const d = await r.json();
      return d && d.prog ? d.prog : null;
    } catch (e) { return null; }
  },
  /* junta os dois lados e deixa tudo igual nos dois */
  async sincroniza() {
    const daNuvem = await this.puxa();
    if (daNuvem) aplicaProg(daNuvem);
    prog.email = this.sessao ? this.sessao.email : prog.email;
    salvaProg();
    return await this.salva();
  }
};
let salvarPendente = null;
function salvaNaNuvemDepois() {
  if (!Conta.ligada || !Conta.dentro) return;
  clearTimeout(salvarPendente);
  salvarPendente = setTimeout(() => Conta.salva(), 1500);
}
const RECADOS = {
  EMAIL_EXISTS: 'Esse e-mail já tem conta. Tente entrar.',
  INVALID_PASSWORD: 'Senha errada.',
  INVALID_LOGIN_CREDENTIALS: 'E-mail ou senha errados.',
  EMAIL_NOT_FOUND: 'Não achei conta com esse e-mail.',
  WEAK_PASSWORD: 'A senha precisa de pelo menos 6 letras ou números.',
  INVALID_EMAIL: 'Esse e-mail não parece certo.',
  MISSING_PASSWORD: 'Falta a senha.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Muitas tentativas. Espere um pouco e tente de novo.'
};
const recado = e => {
  const m = String(e && e.message || e || '').split(' : ')[0];
  return RECADOS[m] || 'Não consegui agora. Veja a internet e tente de novo.';
};

function juntaProg(a, b) {
  if (!b) return a;
  const r = JSON.parse(JSON.stringify(a));
  r.max = Math.max(a.max || 0, b.max || 0);
  r.moedas = Math.max(a.moedas || 0, b.moedas || 0);
  r.estrelas = Object.assign({}, b.estrelas || {});
  for (const k in (a.estrelas || {})) r.estrelas[k] = Math.max(a.estrelas[k] || 0, r.estrelas[k] || 0);
  r.poderes = {};
  ['arpao', 'troca', 'giro', 'isca', 'folego'].forEach(k => r.poderes[k] = Math.max((a.poderes || {})[k] || 0, (b.poderes || {})[k] || 0));
  r.vistos = Object.assign({}, b.vistos || {}, a.vistos || {});
  const da = a.desafio || {}, db = b.desafio || {};
  r.desafio = { semana: (da.melhor || 0) >= (db.melhor || 0) ? da.semana : db.semana,
                melhor: Math.max(da.melhor || 0, db.melhor || 0), nome: da.nome || db.nome || '' };
  r.apelido = a.apelido || b.apelido || '';
  r.mestres = Math.max(a.mestres || 0, b.mestres || 0);
  r.seq = (a.dia || '') >= (b.dia || '') ? (a.seq || 0) : (b.seq || 0);
  r.melhorSeq = Math.max(a.melhorSeq || 0, b.melhorSeq || 0);
  r.semanas = Math.max(a.semanas || 0, b.semanas || 0);
  r.vidas = a.vidas != null ? a.vidas : b.vidas;
  r.vidasAmigos = Math.max(a.vidasAmigos || 0, b.vidasAmigos || 0);
  r.enviadas = Object.assign({}, b.enviadas || {}, a.enviadas || {});
  r.recebidas = a.recebidas || b.recebidas;
  r.vidaMarca = a.vidaMarca || b.vidaMarca;
  r.codigos = Array.from(new Set([].concat(a.codigos || [], b.codigos || [])));
  r.cardume = a.cardume || b.cardume || '';
  r.melhores = Object.assign({}, b.melhores || {});
  for (const k in (a.melhores || {})) r.melhores[k] = Math.max(a.melhores[k] || 0, r.melhores[k] || 0);
  r.email = a.email || b.email || '';
  return r;
}
function aplicaProg(novo) { prog = juntaProg(novo, prog); salvaProg(); pintaMoedas(); pintaPoderes(); pintaBotaoSom(); aplicaLeve(); }

async function copia(txt, botao, rotulo) {
  try { await navigator.clipboard.writeText(txt); }
  catch (e) { try { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } catch (e2) { return; } }
  if (botao) { botao.textContent = 'Copiado!'; setTimeout(() => botao.textContent = rotulo, 1800); }
}

/* ── telas da conta ─────────────────────────────────────────── */
function mostraConta(aviso) {
  if (!Conta.ligada) {
    cartao('<h3>Seu progresso</h3>' +
      '<p>A conta ainda não está ligada neste site, então o progresso fica guardado só neste aparelho.</p>' +
      '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>', true);
    return;
  }
  if (!Conta.dentro) {
    cartao('<h3>Guardar meu progresso</h3>' +
      '<p>Crie uma conta com e-mail e senha. O que você já jogou continua: ao entrar, o jogo junta o progresso deste aparelho com o da conta.</p>' +
      (aviso ? '<p class="aviso">' + aviso + '</p>' : '') +
      '<input class="campo" id="campo-email" type="email" inputmode="email" autocomplete="email" placeholder="seu@email.com">' +
      '<input class="campo" id="campo-senha" type="password" autocomplete="current-password" placeholder="senha (mínimo 6)">' +
      '<div class="bts"><button class="bt vidro" data-ac="criaconta">Criar conta</button>' +
      '<button class="bt" data-ac="entrar">Entrar</button></div>' +
      '<div class="bts"><button class="bt-texto" data-ac="esqueci">Esqueci a senha</button>' +
      '<button class="bt-texto" data-ac="fecha">Agora não</button></div>', true);
    return;
  }
  cartao('<h3>Conta</h3>' +
    '<p class="codigo">' + (Conta.sessao.email || 'conectado') + '</p>' +
    '<p>Progresso salvo na nuvem a cada fase. Pra jogar em outro aparelho, entre com esse mesmo e-mail.</p>' +
    (aviso ? '<p class="aviso">' + aviso + '</p>' : '') +
    '<div class="bts"><button class="bt vidro" data-ac="sincroniza">Sincronizar agora</button>' +
    '<button class="bt" data-ac="fecha">Fechar</button></div>' +
    '<div class="bts"><button class="bt-texto" data-ac="sair">Sair desta conta</button></div>', true);
}
async function contaEntrar(criar, botao) {
  const email = (document.getElementById('campo-email') || {}).value || '';
  const senha = (document.getElementById('campo-senha') || {}).value || '';
  if (!email.trim() || !senha) { mostraConta('Preencha o e-mail e a senha.'); return; }
  if (botao) botao.textContent = criar ? 'Criando...' : 'Entrando...';
  if (Conta.sessao && Conta.sessao.anon) await Ranking.apagaFicha();   /* some com o fantasma da conta sem nome */
  try {
    if (criar) await Conta.cria(email.trim(), senha); else await Conta.entra(email.trim(), senha);
  } catch (e) { mostraConta(recado(e)); return; }
  prog.email = Conta.sessao.email;
  salvaProg();
  const ok = await Conta.sincroniza();
  Som.liga(); Som.vitoria();
  cartao('<h3>' + (criar ? 'Conta criada' : 'Bem-vindo de volta') + '</h3>' +
    '<p>Progresso ' + (ok ? 'guardado na nuvem' : 'salvo aqui e vai subir assim que a internet voltar') + '. Você está na fase ' + (prog.max + 1) +
    ' com ' + totalEstrelas() + (totalEstrelas() === 1 ? ' estrela' : ' estrelas') + ' e ' + nf(prog.moedas) + ' moedas.</p>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button>' +
    '<button class="bt" data-ac="mapa">Jogar</button></div>', true);
}
async function contaEsqueci() {
  const email = (document.getElementById('campo-email') || {}).value || '';
  if (!email.trim()) { mostraConta('Escreva o e-mail primeiro, aí eu mando o link de trocar a senha.'); return; }
  try { await Conta.esqueci(email.trim()); mostraConta('Pronto: olhe o e-mail para criar uma senha nova.'); }
  catch (e) { mostraConta(recado(e)); }
}
async function contaSincroniza(botao) {
  if (botao) botao.textContent = 'Sincronizando...';
  const ok = await Conta.sincroniza();
  mostraConta(ok ? 'Tudo sincronizado agora.' : 'Não consegui falar com o servidor agora.');
}
function contaSair() {
  Conta.sai();
  mostraConta('Saí da conta. O progresso continua guardado neste aparelho.');
}


/* ═══ RANKING ═══════════════════════════════════════════════════
   Quatro listas, sempre pela mesma conta: o cardume (a turma da
   pessoa, entra por código de quatro letras como no Dominó), o
   geral, a fase em que ela está e o desafio da semana.
   O que é público é só apelido e número: e-mail nunca sobe.     */
const Ranking = {
  cache: {}, pendente: {},
  get ligado() { return Conta.ligada && Conta.dentro; },
  nome() { return (prog.apelido || (Conta.sessao && Conta.sessao.email || '').split('@')[0] || 'mergulhador').slice(0, 16); },

  async manda(caminho, corpo) {
    if (!this.ligado) return false;
    const t = await Conta.token();
    if (!t) return false;
    try {
      const r = await fetch(Conta.cfg.banco + caminho + '.json?auth=' + t,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
      return r.ok;
    } catch (e) { return false; }
  },
  async pega(caminho, consulta) {
    if (!Conta.ligada) return null;
    const chave = caminho + (consulta || '');
    if (this.cache[chave] && Date.now() - this.cache[chave].quando < 45000) return this.cache[chave].dados;
    try {
      const t = Conta.dentro ? await Conta.token() : null;
      const r = await fetch(Conta.cfg.banco + caminho + '.json?' + (consulta || '') + (t ? '&auth=' + t : ''));
      const d = await r.json();
      if (!r.ok || (d && d.error)) return null;            /* servidor recusou: melhor avisar que fingir lista vazia */
      const lista = Object.keys(d || {}).map(k => Object.assign({ id: k }, d[k]))
        .filter(x => x && typeof x === 'object' && x.nome !== undefined);
      this.cache[chave] = { quando: Date.now(), dados: lista };
      return lista;
    } catch (e) { return null; }
  },

  /* sobe a ficha pública da pessoa: onde chegou, quantas estrelas, de que cardume é */
  async apagaFicha() {
    if (!this.ligado) return;
    return this.manda('/mergulho/placar/' + Conta.sessao.uid, null);
  },
  async subeFicha() {
    if (!this.ligado) return;
    let soma = 0;
    for (const k in (prog.melhores || {})) soma += prog.melhores[k] || 0;
    return this.manda('/mergulho/placar/' + Conta.sessao.uid,
      { nome: this.nome(), max: prog.max, estrelas: totalEstrelas(), pontos: soma,
        mestres: prog.mestres || 0, cardume: prog.cardume || '', quando: Date.now() });
  },
  async pontuaFase(i, pontos) {
    if (!this.ligado) return;
    const antes = prog.melhores && prog.melhores[i] || 0;
    if (pontos <= antes) return;
    prog.melhores = prog.melhores || {};
    prog.melhores[i] = pontos;
    salvaProg();
    return this.manda('/mergulho/fases/' + i + '/' + Conta.sessao.uid, { nome: this.nome(), pontos: pontos });
  },
  /* A lista é pequena: baixar inteira e ordenar aqui sai mais barato
     do que depender de índice publicado nas regras do banco.       */
  todos() { return this.pega('/mergulho/placar', ''); },
  async geral() { return await this.todos(); },
  async cardume(cod) {
    const t = await this.todos();
    return t ? t.filter(x => (x.cardume || '') === cod) : null;
  },
  daFase(i) { return this.pega('/mergulho/fases/' + i, ''); },
  daSemana(sem) { return this.pega('/mergulho/desafio/' + sem, ''); }
};

function codigoCardume() {
  const l = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += l[Math.floor(Math.random() * l.length)];
  return s;
}
const medalha = k => k === 0 ? '🥇' : k === 1 ? '🥈' : k === 2 ? '🥉' : (k + 1) + 'º';

/* ranking de gente: manda a estrela, depois a fase, depois o ponto.
   Assim não basta atravessar as fases correndo: tem que jogar bem. */
let ordemRank = 'fase';
function linhasGente(lista, comVida, pediram) {
  if (!lista) return '<p class="vazio">Sem internet pra buscar agora.</p>';
  if (!lista.length) return '<p class="vazio">Ninguém aqui ainda. Seja o primeiro.</p>';
  const meu = Conta.dentro ? Conta.sessao.uid : '';
  /* quem está mais fundo lidera; a chave embaixo troca para estrelas */
  const porFase = (a, b) => (b.max || 0) - (a.max || 0) || (b.estrelas || 0) - (a.estrelas || 0) || (b.pontos || 0) - (a.pontos || 0);
  const porEstrela = (a, b) => (b.estrelas || 0) - (a.estrelas || 0) || (b.max || 0) - (a.max || 0) || (b.pontos || 0) - (a.pontos || 0);
  const ord = lista.slice().sort(ordemRank === 'estrelas' ? porEstrela : porFase);
  const minha = ord.findIndex(x => x.id === meu);
  const linha = (x, k) => '<div class="linha-rank' + (x.id === meu ? ' eu' : '') + '"><span class="pos">' + medalha(k) + '</span>' +
    '<span class="nome">' + (x.nome || 'mergulhador') + (x.mestres ? ' <i class="tag-mestre" title="mestres derrotados">' + x.mestres + '⚔</i>' : '') + '</span>' +
    (comVida && x.id !== meu ? '<button class="bt-vida' + (jaMandeiHoje(x.id) ? ' foi' : '') + '"' + (jaMandeiHoje(x.id) ? ' disabled' : '') +
      ' data-ac="mandavida" data-id="' + x.id + '" data-nome="' + (x.nome || '') + '">' + (jaMandeiHoje(x.id) ? '❤ Enviada' : '❤ Mandar') + '</button>' : '') +
    (pediram && pediram[x.id] ? '<i class="tag-pediu">pediu vida</i>' : '') +
    '<span class="val"><b>' + (ordemRank === 'estrelas' ? (x.estrelas || 0) + '★' : 'fase ' + ((x.max || 0) + 1)) + '</b>' +
    '<small>' + (ordemRank === 'estrelas' ? 'fase ' + ((x.max || 0) + 1) : (x.estrelas || 0) + '★') +
    (x.pontos ? ' · ' + nf(x.pontos) + ' pts' : '') + '</small></span></div>';
  const chave = '<div class="chave-ordem">' +
    '<button class="' + (ordemRank === 'fase' ? 'on' : '') + '" data-ac="ordem" data-id="fase">Por fase</button>' +
    '<button class="' + (ordemRank === 'estrelas' ? 'on' : '') + '" data-ac="ordem" data-id="estrelas">Por estrelas</button></div>';
  let h = chave + ord.slice(0, 20).map(linha).join('');
  if (minha >= 20) h += '<div class="longe">' + linha(ord[minha], minha) + '</div>';
  return h;
}

function linhasRanking(lista, campo, sufixo) {
  if (!lista) return '<p class="vazio">Sem internet pra buscar agora.</p>';
  if (!lista.length) return '<p class="vazio">Ninguém aqui ainda. Seja o primeiro.</p>';
  const meu = Conta.dentro ? Conta.sessao.uid : '';
  const ord = lista.slice().sort((a, b) => (b[campo] || 0) - (a[campo] || 0) || (b.estrelas || 0) - (a.estrelas || 0));
  const minha = ord.findIndex(x => x.id === meu);
  let h = ord.slice(0, 20).map((x, k) =>
    '<div class="linha-rank' + (x.id === meu ? ' eu' : '') + '"><span class="pos">' + medalha(k) + '</span>' +
    '<span class="nome">' + (x.nome || 'mergulhador') + '</span>' +
    '<span class="val">' + nf(campo === 'max' ? (x[campo] || 0) + 1 : (x[campo] || 0)) + sufixo + '</span></div>').join('');
  if (minha >= 20) {
    const x = ord[minha];
    h += '<div class="linha-rank eu longe"><span class="pos">' + (minha + 1) + 'º</span><span class="nome">' + (x.nome || 'você') +
         '</span><span class="val">' + nf(campo === 'max' ? (x[campo] || 0) + 1 : (x[campo] || 0)) + sufixo + '</span></div>';
  }
  return h;
}

let abaRank = 'geral';
async function mostraRanking(aba) {
  abaRank = aba || abaRank;
  if (!Conta.ligada) {
    cartao('<h3>Ranking</h3><p>O ranking ainda não está ligado neste site.</p>' +
      '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>', true);
    return;
  }
  if (!Conta.dentro) {
    cartao('<h3>Ranking</h3><p class="vazio">Entrando na disputa...</p>', true);
    await Conta.garante();
    if (!Conta.dentro) { cartao('<h3>Ranking</h3><p>Não consegui falar com o servidor agora. Tente daqui a pouco.</p>' +
      '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>', true); return; }
  }
  if (!prog.apelido) { pedeApelido(); return; }
  const abas = [['cardume', 'Cardume'], ['geral', 'Geral'], ['fase', 'Esta fase'], ['semana', 'Semana']];
  const topo = '<h3>Ranking</h3><div class="abas">' +
    abas.map(a => '<button class="aba' + (abaRank === a[0] ? ' on' : '') + '" data-ac="aba" data-id="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>';
  cartao(topo + '<div class="lista-rank" id="lista-rank"><p class="vazio">Buscando...</p></div>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>', true);
  Ranking.subeFicha();
  const alvo = () => document.getElementById('lista-rank');
  let html = '';
  if (abaRank === 'cardume') {
    if (!prog.cardume) {
      html = '<p class="vazio">Você ainda não tem cardume. Crie o seu e passe o código pra turma, ou entre no de alguém.</p>' +
             '<div class="bts"><button class="bt vidro" data-ac="entracardume">Entrar num</button><button class="bt" data-ac="criacardume">Criar cardume</button></div>';
    } else {
      const lista = await Ranking.cardume(prog.cardume);
      html = '<p class="cod-cardume">Código <b>' + prog.cardume + '</b> · manda pro grupo</p>' +
             (await (async () => { const ped = await Ranking.pega('/mergulho/pedidos/' + prog.cardume, '');
               const mapa = {}; (ped || []).forEach(q => { if (Date.now() - (q.quando || 0) < 864e5) mapa[q.id] = true; });
               return linhasGente(lista, true, mapa); })()) +
             '<div class="bts"><button class="bt vidro" data-ac="pedevidas">Pedir vidas ao cardume</button></div>' +
             '<div class="bts"><button class="bt-texto" data-ac="copiacardume">Copiar código</button>' +
             '<button class="bt-texto" data-ac="saicardume">Sair do cardume</button></div>';
    }
  } else if (abaRank === 'geral') {
    html = linhasGente(await Ranking.geral());
  } else if (abaRank === 'fase') {
    /* dentro da partida mostra a fase aberta; fora dela, a fase onde a pessoa está */
    const i = (document.body.classList.contains('em-jogo') && J && J.fase >= 0) ? J.fase : prog.max;
    html = '<p class="cod-cardume">Fase ' + (i + 1) + ' · ' + fase(i).nome + '</p>' + linhasRanking(await Ranking.daFase(i), 'pontos', '');
  } else {
    const sem = chaveSemana();
    html = '<p class="cod-cardume">Desafio de ' + sem + '</p>' + linhasRanking(await Ranking.daSemana(sem), 'pontos', '');
  }
  if (alvo() && document.querySelector('.abas .aba.on')) alvo().innerHTML = html;
}
const PRESENTES = {
  /* seu, de 20 mil */
  'ABISMO20000': 20000,
  /* dez de 3 mil, pra distribuir */
  'ONDA3000': 3000, 'RECIFE3000': 3000, 'CONCHA3000': 3000, 'ESTRELA3000': 3000, 'POLVO3000': 3000,
  'ARRAIA3000': 3000, 'GOLFINHO3000': 3000, 'TUBARAO3000': 3000, 'BALEIA3000': 3000, 'TARTARUGA3000': 3000,
  /* estes enchem as vidas em vez de dar moedas */
  'VIDACHEIA': 'vidas', 'FOLEGO5': 'vidas',
  /* cinco de 5 mil, pra distribuir; cada pessoa usa cada código uma vez */
  'PEROLA5000': 5000, 'CARDUME5000': 5000, 'MARESIA5000': 5000, 'NAUFRAGIO5000': 5000, 'CORRENTEZA5000': 5000,
  /* os antigos continuam valendo para quem ainda não usou */
  'MERGULHO5000': 5000, 'CARDUME1000': 1000, 'ABISMO500': 500, 'MARE250': 250
};
function mostraCodigo(aviso) {
  cartao('<h3>Código de presente</h3><p>Se alguém te passou um código, digite aqui.</p>' +
    (aviso ? '<p class="aviso">' + aviso + '</p>' : '') +
    '<input class="campo" id="campo-codigo" maxlength="16" placeholder="CÓDIGO" style="text-transform:uppercase;text-align:center;letter-spacing:.14em">' +
    '<div class="bts"><button class="bt vidro" data-ac="fecha">Fechar</button>' +
    '<button class="bt" data-ac="usacodigo">Usar</button></div>', true);
}
function usaCodigo() {
  const c = document.getElementById('campo-codigo');
  const cod = ((c ? c.value : '') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  prog.codigos = prog.codigos || [];
  if (!PRESENTES[cod]) return mostraCodigo('Esse código não existe.');
  if (prog.codigos.indexOf(cod) >= 0) return mostraCodigo('Esse código você já usou.');
  prog.codigos.push(cod);
  if (PRESENTES[cod] === 'vidas') {
    prog.vidas = VIDAS_MAX; prog.vidaMarca = Date.now(); prog.vidasAmigos = (prog.vidasAmigos || 0) + 3;
    salvaProg(); pintaVidas(); salvaNaNuvemDepois(); Som.liga(); Som.vitoria();
    return cartao('<h3>Vidas cheias</h3><p>Suas 5 vidas voltaram, e mais 3 ficaram guardadas na reserva.</p><div class="bts"><button class="bt" data-ac="fecha">Bora</button></div>', true);
  }
  prog.moedas += PRESENTES[cod];
  salvaProg();
  pintaMoedas();
  salvaNaNuvemDepois();
  Som.liga(); Som.vitoria();
  cartao('<h3>Caiu na conta</h3><p>Mais ' + nf(PRESENTES[cod]) + ' moedas para você. Agora são ' + nf(prog.moedas) + '.</p>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Beleza</button></div>', true);
}

function pedeApelido() {
  cartao('<h3>Como quer aparecer?</h3><p>Esse nome é o que a turma vê no ranking. Seu e-mail não aparece pra ninguém.</p>' +
    '<input class="campo" id="campo-apelido" maxlength="16" placeholder="seu apelido" value="' + (prog.apelido || '') + '">' +
    '<div class="bts"><button class="bt" data-ac="salvaapelido">Pronto</button></div>', true);
}
async function salvaApelido() {
  const c = document.getElementById('campo-apelido');
  prog.apelido = (c ? c.value : '').trim().slice(0, 16) || 'mergulhador';
  await Conta.garante();
  if (prog.desafio && !prog.desafio.nome) prog.desafio.nome = prog.apelido;
  salvaProg();
  Ranking.subeFicha();
  mostraRanking();
}
async function criaCardume() {
  prog.cardume = codigoCardume();
  salvaProg();
  await Ranking.subeFicha();
  Ranking.cache = {};
  mostraRanking('cardume');
}
function entraCardume() {
  cartao('<h3>Entrar num cardume</h3><p>Peça o código de quatro letras pra quem já está lá dentro.</p>' +
    '<input class="campo" id="campo-cardume" maxlength="4" placeholder="ABCD" style="text-transform:uppercase;text-align:center;letter-spacing:.3em">' +
    '<div class="bts"><button class="bt vidro" data-ac="rank">Voltar</button><button class="bt" data-ac="confirmacardume">Entrar</button></div>', true);
}
async function confirmaCardume() {
  const c = document.getElementById('campo-cardume');
  const cod = ((c ? c.value : '') || '').trim().toUpperCase().slice(0, 4);
  if (cod.length !== 4) return;
  prog.cardume = cod;
  salvaProg();
  await Ranking.subeFicha();
  Ranking.cache = {};
  mostraRanking('cardume');
}
async function saiCardume() {
  prog.cardume = '';
  salvaProg();
  await Ranking.subeFicha();
  Ranking.cache = {};
  mostraRanking('cardume');
}

/* ═══ A HOME CABE EM QUALQUER TELA ══════════════════════════════
   Em vez de adivinhar altura de aparelho, ela mede o que desenhou
   e vai apertando por degraus até o último item caber acima da
   barra do sistema. Serve pra celular antigo, novo e tablet.     */
function encaixaInicio() {
  const tela = document.getElementById('tela-inicio');
  if (!tela || !tela.classList.contains('ativa')) return;
  const fim = document.getElementById('versao');
  const sb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-b')) || 0;
  for (let n = 0; n <= 5; n++) {
    tela.dataset.aperto = n;
    if (!fim) return;
    if (fim.getBoundingClientRect().bottom <= window.innerHeight - sb - 6) return;
  }
}

/* a semana fica à vista na home: quantos dias seguidos, qual o
   prêmio de hoje e quanto falta para o próximo virar.            */
const jaPegouHoje = () => prog.dia === hoje();
function horasAteAmanha() {
  const agora = new Date();
  const virada = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1).getTime();
  const falta = virada - agora.getTime();
  const h = Math.floor(falta / 36e5), m = Math.floor((falta % 36e5) / 6e4);
  return h > 0 ? h + 'h' + String(m).padStart(2, '0') : m + ' min';
}
function pintaSemanaHome() {
  const caixa = document.getElementById('semana-home');
  if (!caixa) return;
  const pegou = jaPegouHoje();
  const dia = pegou ? ((prog.seq || 1)) : diaDaSemana();
  const semana = (prog.semanas || 0) + 1;
  const bolinhas = SEMANA.map((_, k) => {
    const n = k + 1, d = premioDoDia(k);
    const feito = n < dia || (n === dia && pegou);
    const agora = n === dia && !pegou;
    return '<span class="bolha-dia' + (feito ? ' feito' : '') + (agora ? ' agora' : '') + (d.todos ? ' final' : '') + '">' +
      (feito ? '✓' : d.todos ? '★' : n) + '</span>';
  }).join('');
  const prox = pegou ? (dia < 7 ? premioDoDia(dia) : premioDoDia(0)) : premioDoDia(dia - 1);
  caixa.className = 'semana-home' + (pegou ? '' : ' tem-premio');
  caixa.innerHTML =
    '<div class="semana-topo"><b>Semana ' + semana + '</b><span>' + (pegou ? 'dia ' + dia + ' de 7' : 'pegue o dia ' + dia) + '</span></div>' +
    '<div class="bolhas-semana">' + bolinhas + '</div>' +
    '<div class="semana-pe">' + (pegou
      ? 'Próximo prêmio em <b>' + horasAteAmanha() + '</b> · ' + (prox.todos ? prox.moedas + ' + poderes' : prox.moedas + ' moedas' + (prox.poder ? ' + poder' : ''))
      : '<b>Prêmio de hoje: ' + prox.moedas + ' moedas' + (prox.todos ? ' + poderes' : prox.poder ? ' + poder' : '') + '</b> · toque para pegar') + '</div>';
  caixa.hidden = false;
  encaixaInicio();
}

/* o ranking também mora na home: três primeiros e onde você está */
async function pintaPodio() {
  const caixa = document.getElementById('podio');
  if (!caixa || !Conta.ligada) return;
  const lista = await Ranking.geral();
  if (!lista || !lista.length) { caixa.hidden = true; return; }
  const meu = Conta.dentro ? Conta.sessao.uid : '';
  const ord = lista.slice().sort((a, b) => (b.max || 0) - (a.max || 0) || (b.estrelas || 0) - (a.estrelas || 0));
  const minha = ord.findIndex(x => x.id === meu);
  let h = '<div class="podio-topo"><b>Ranking</b><span>ver tudo</span></div>';
  h += ord.slice(0, 5).map((x, k) => '<div class="linha-podio' + (x.id === meu ? ' eu' : '') + '"><span class="pos">' + medalha(k) + '</span>' +
       '<span class="nome">' + (x.nome || 'mergulhador') + '</span><span class="val">fase ' + ((x.max || 0) + 1) + '</span></div>').join('');
  if (minha >= 5) {
    const x = ord[minha];
    h += '<div class="linha-podio eu"><span class="pos">' + (minha + 1) + 'º</span><span class="nome">' + (x.nome || 'você') +
         '</span><span class="val">fase ' + ((x.max || 0) + 1) + '</span></div>';
  }
  caixa.innerHTML = h;
  caixa.hidden = false;
  encaixaInicio();
}

/* ═══ TELAS ═════════════════════════════════════════════════════ */
function tela(id) {
  ['tela-inicio', 'tela-mapa', 'tela-jogo'].forEach(t =>
    document.getElementById(t).classList.toggle('ativa', t === id));
  document.body.classList.toggle('em-jogo', id === 'tela-jogo');
  if (id === 'tela-jogo') Musica.liga('jogo', mundoAtual);
  else { document.body.classList.remove('aperto'); Musica.liga('menu', mundoAtual); setTimeout(talvezAtualizar, 400); }
  if (id === 'tela-inicio') { requestAnimationFrame(() => { pintaSemanaHome(); encaixaInicio(); }); setTimeout(pintaPodio, 300); setTimeout(async () => { if (mostraNovidades()) return; await recebeVidas(); avisaPedidos(); }, 1500); }
  /* a faixa de baixo do celular acompanha a cor da tela */
  document.body.style.backgroundColor = id === 'tela-jogo'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--ag4').trim() || '#0B4F7A')
    : id === 'tela-mapa' ? '#02030A' : '#0B4F7A';
  corDaBarra(id === 'tela-jogo' ? COR_TOPO[mundoAtual] : id === 'tela-inicio' ? '#FFF3D2' : '#0B4F7A');
}

/* ═══ MAPA: a coluna d'água, da superfície ao fundo ═════════════ */
const CADEADO = '<svg viewBox="0 0 24 24" class="cadeado"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

let mapaIni = 0, paradaEm = -1;

function superficieMapa(exp, reg) {
  return '<div class="superficie" aria-hidden="true"><div class="sol"></div>' +
    '<svg class="barco" viewBox="0 0 120 60"><path d="M8 38h96l-12 16H22Z" fill="#0B3A55"/><path d="M34 38V22h30v16" fill="#13506F"/>' +
    '<path d="M70 38V6" stroke="#0B3A55" stroke-width="3"/><path d="M71 7h26v16H71Z" fill="#E8412C"/><path d="M71 23L97 7" stroke="#fff" stroke-width="4"/></svg>' +
    '<div class="onda-mapa"></div></div>' +
    '<p class="cab-exped">' + (exp > 1 ? 'Expedição ' + exp + ' · ' : '') + (reg ? reg.nome : '') + '</p>';
}
function leitoMapa() {
  return '<div class="leito" aria-hidden="true"><svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice"><path d="M0 70Q60 50 120 64T240 58T400 60V120H0Z" fill="#05060F"/>' +
    '<circle cx="90" cy="52" r="3" fill="#6BFFE0"/><circle cx="90" cy="52" r="9" fill="#6BFFE0" opacity=".2"/><circle cx="300" cy="46" r="2.6" fill="#9A5CFF"/><circle cx="300" cy="46" r="8" fill="#9A5CFF" opacity=".2"/></svg>' +
    '<p>O fundo, 4.000 m</p></div>';
}
function noDoMapa(i) {
  const f = fase(i), desloc = Math.sin(i * 0.82) * 70, travada = i > prog.max, est = prog.estrelas[i] || 0;
  const parada = paradaEm === i;
  if (ehMestre(i)) {
    const M = MESTRES[f.obj.mestre], venceu = (prog.estrelas[i] || 0) > 0;
    return '<div class="no-linha mestre-linha">' +
      '<div class="portao" style="--cor-mestre:' + M.cor + ';--cor-mestre2:' + M.cor2 + '">' +
      '<div class="portao-txt"><b>Mestre</b><span>' + M.nome + '</span></div>' +
      '<button class="no no-mestre' + (travada ? ' travada' : '') + (venceu ? ' vencido' : '') + '" data-i="' + i + '" ' +
      (travada ? 'disabled ' : '') + 'aria-label="Mestre ' + M.nome + ', fase ' + (i + 1) + '">' +
      '<span class="disco"></span>' + (travada ? '<span class="num">' + CADEADO + '</span>' : desenhaMestre(f.obj.mestre)) +
      '<span class="num-mestre">' + (i + 1) + '</span>' +
      (venceu ? '<span class="tropeu">🏆</span>' : '') + '</button>' +
      '<div class="portao-txt dir"><b>' + metros(f.prof) + '</b><span>' + (venceu ? 'derrotado' : 'te espera') + '</span></div>' +
      '</div></div>';
  }
  if (ehMestre(i)) {
    const M = MESTRES[f.obj.mestre];
    return '<div class="no-linha mestre-linha" style="--cor-mestre:' + M.cor + '">' +
      '<div class="selo-mestre"><span>Mestre</span></div>' +
      '<button class="no no-mestre' + (travada ? ' travada' : '') + (i === prog.max ? ' agora' : '') + '" data-i="' + i + '" data-ac="fase">' +
      '<span class="aro-mestre"></span>' + desenhaMestre(f.obj.mestre) +
      '<span class="num-mestre">' + (travada ? CADEADO : (i + 1)) + '</span>' +
      (est ? '<span class="trio">' + estrelinhas(est) + '</span>' : '') + '</button>' +
      '<div class="rotulo-mestre"><b>' + M.nome + '</b><small>' + metros(f.prof) + '</small></div></div>';
  }
  const trio = (!travada && est) ? '<span class="trio">' + [0, 1, 2].map(q => '<svg viewBox="0 0 100 100"><use href="#' + (q < est ? 'i-estrela' : 'i-estrela-off') + '"/></svg>').join('') + '</span>' : '';
  const lado = desloc < 0 ? 'left:calc(50% + ' + (desloc + 52).toFixed(1) + 'px);text-align:left'
                          : 'right:calc(50% - ' + (desloc - 52).toFixed(1) + 'px);text-align:right';
  return '<div class="no-linha">' +
    '<button class="no' + (travada ? ' travada' : '') + (i === prog.max && !travada ? ' atual' : '') + '" data-i="' + i + '" style="transform:translateX(' + desloc.toFixed(1) + 'px);--dx:' + desloc.toFixed(1) + 'px;animation-delay:' + (((i - mapaIni) % 24) * 26) + 'ms" aria-label="Fase ' + (i + 1) + ': ' + f.nome + (travada ? ', ainda fechada' : '') + '">' +
      '<span class="disco"></span><span class="num">' + (travada ? CADEADO : (i + 1)) + '</span>' + trio +
      (parada ? '<span class="marca-parada" aria-label="partida pela metade">⏸</span>' : '') +
      (!travada && classeDaFase(i) !== 'N' && classeDaFase(i) !== 'F' ? '<span class="selo-no" style="background:' + CLASSES[classeDaFase(i)].cor + '">' + (classeDaFase(i) === 'L' ? '★' : '!') + '</span>' : '') +
      '</button>' +
    '<span class="no-rotulo' + (travada ? ' apagado' : '') + '" style="' + lado + '"><b>' + f.nome + '</b><small>' + metros(f.prof) + '</small></span>' +
  '</div>';
}

/* o mapa mostra uma janela de fases: com dez mil nós na tela o
   celular não aguentaria, então desenha em volta de onde você está */
function montaMapa(mantem) {
  const pp = lePartida();
  paradaEm = pp ? pp.f : -1;
  const col = document.getElementById('coluna'), trilha = document.getElementById('trilha');
  const altaAntes = col.scrollHeight;
  if (!mantem) mapaIni = Math.max(0, prog.max - 17);
  const fim = prog.max + 6;
  let h = '<svg class="trilha-svg" id="trilha-bolhas" aria-hidden="true"></svg>';
  if (mapaIni > 0) h += '<button class="subir" id="bt-subir">Subir para as fases anteriores</button>';
  for (let b = Math.floor(mapaIni / 6); b <= Math.floor(fim / 6); b++) {
    const i0 = b * 6, mundo = Math.floor((i0 % CICLO) / 6), mu = ambiente(i0);
    if (i0 % CICLO === 0 && i0 >= mapaIni) h += superficieMapa(expedicao(i0), mu.reg);
    const cor = coresBanda(mu.reg, mundo);
    h += '<section class="faixa-mundo' + (mundo === 0 ? ' clara' : '') + (mundo >= 3 ? ' funda' : '') + '" ' +
         'style="background:linear-gradient(180deg,' + cor[0] + ',' + cor[1] + ' 45%,' + cor[3] + ');' + (mu.tom ? 'filter:' + mu.tom + ';' : '') + '">' +
         '<header class="cab-mundo"><h3>' + mu.nome + '</h3><p>' + metros(mu.de) + ' a ' + metros(mu.ate) + '</p></header>';
    for (let i = Math.max(i0, mapaIni); i <= Math.min(i0 + 5, fim); i++) h += noDoMapa(i);
    h += '</section>';
    if ((i0 + 5) % CICLO === CICLO - 1 && i0 + 5 <= fim) h += leitoMapa();
  }
  col.innerHTML = h;
  col.querySelectorAll('.no').forEach(b => b.onclick = () => {
    const n = +b.dataset.i;
    Som.liga();
    if (n > prog.max) { b.animate([{ transform: b.style.transform }, { transform: b.style.transform + ' translateX(-7px)' }, { transform: b.style.transform + ' translateX(7px)' }, { transform: b.style.transform }], 260); Som.nao(); return; }
    abreFase(n);
  });
  const subir = document.getElementById('bt-subir');
  if (subir) subir.onclick = () => {
    Som.liga();
    const antes = col.scrollHeight;
    mapaIni = Math.max(0, mapaIni - 18);
    montaMapa(true);
    requestAnimationFrame(() => { trilha.scrollTop += col.scrollHeight - antes; });
  };
  document.getElementById('total-estrelas').textContent = totalEstrelas();
  pintaMoedas();
  pintaAmigos();
  requestAnimationFrame(() => { desenhaTrilha(); if (!mantem) rolaAteAtual(); });
}

function desenhaTrilha() {
  const col = document.getElementById('coluna'), svg = document.getElementById('trilha-bolhas');
  if (!col || !svg) return;
  const nos = [...col.querySelectorAll('.no')];
  if (!nos.length) return;
  const base = col.getBoundingClientRect(), w = base.width, h = col.scrollHeight;
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  svg.style.height = h + 'px';
  const pts = nos.map(b => { const r = b.getBoundingClientRect(); return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2]; });
  let d = 'M' + pts[0][0].toFixed(1) + ' ' + Math.max(0, pts[0][1] - 110).toFixed(1) + ' L' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], my = (a[1] + b[1]) / 2;
    d += ' C' + a[0].toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
  }
  /* até onde você já desceu a trilha fica acesa */
  const ate = Math.min(prog.max - mapaIni, pts.length - 1);
  let dFeito = ate < 0 ? '' : 'M' + pts[0][0].toFixed(1) + ' ' + Math.max(0, pts[0][1] - 110).toFixed(1) + ' L' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
  for (let i = 1; i <= ate; i++) {
    const a = pts[i - 1], b = pts[i], my = (a[1] + b[1]) / 2;
    dFeito += ' C' + a[0].toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
  }
  svg.innerHTML =
    '<path d="' + d + '" fill="none" stroke="rgba(243,251,255,.28)" stroke-width="6" stroke-linecap="round" stroke-dasharray="0 15"/>' +
    '<path d="' + dFeito + '" fill="none" stroke="#F3FBFF" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 15" opacity=".85"/>';
}

function rolaAteAtual() {
  const trilha = document.getElementById('trilha'), atual = document.querySelector('#coluna .no.atual') || document.querySelectorAll('#coluna .no')[prog.max];
  if (!trilha || !atual) return;
  const alvo = atual.getBoundingClientRect().top - trilha.getBoundingClientRect().top + trilha.scrollTop - trilha.clientHeight / 2 + 40;
  /* chega perto na hora e desce o último pedaço devagar: a descida é o gesto do jogo */
  trilha.scrollTop = Math.max(0, alvo - 180);
  requestAnimationFrame(() => trilha.scrollTo({ top: Math.max(0, alvo), behavior: 'smooth' }));
}

/* a descida entre fases: o mar passa por cima e revela o tabuleiro novo */
function descida(texto) {
  const d = document.getElementById('descida');
  if (!d) return;
  d.querySelector('span').textContent = texto;
  d.classList.remove('roda'); void d.offsetWidth; d.classList.add('roda');
}

/* fichinhas da turma na fase em que cada um parou */
async function pintaAmigos() {
  if (!Ranking.ligado || !prog.cardume) return;
  const lista = await Ranking.cardume(prog.cardume);
  if (!lista) return;
  const meu = Conta.sessao.uid;
  const porFase = {};
  lista.forEach(x => { if (x.id !== meu) (porFase[x.max || 0] = porFase[x.max || 0] || []).push(x.nome || '?'); });
  document.querySelectorAll('#coluna .no').forEach(b => {
    const gente = porFase[+b.dataset.i];
    if (!gente) return;
    const linha = b.parentElement;
    if (linha.querySelector('.amigos')) return;
    const d = document.createElement('div');
    d.className = 'amigos';
    d.innerHTML = gente.slice(0, 3).map(n => '<span>' + n.slice(0, 10) + '</span>').join('') +
                  (gente.length > 3 ? '<span>+' + (gente.length - 3) + '</span>' : '');
    linha.appendChild(d);
  });
}

/* ═══ ABRIR UMA FASE ════════════════════════════════════════════ */
function retomaPartida(d) {
  const f = fase(d.f);
  instalaMundo(f.m, d.f);
  descida(metros(f.prof));
  J = { fase: d.f, mov: d.mov, pontos: d.pontos, coletado: d.col,
        papelTotal: d.pt, papelFeito: d.pf, ocupado: true, fim: false, cascata: 1,
        bauFeito: d.bf, bauNaTela: d.bn, bauPendentes: d.bp, criados: d.cr || 0, objBatido: false, contaCresce: d.cc, alvoCresce: d.ac,
        papelBase: d.base,
        presosFeitos: d.pr || 0, bolhasFeitas: d.bo || 0, bolhasFugiram: d.bfg || 0,
        ninhos: d.nin || null, ninhosFeitos: d.ninf || 0,
        perolas: d.per || null, perolasFeitas: d.pef || 0, coral: d.cor || null, coralFeito: d.cof || 0, lixoFeito: d.lxf || 0,
        cond: d.cnd || null, corVez: d.cvz != null ? d.cvz : null, moedasFundo: d.mfd || null, moedasPegas: d.mpg || 0,
        dano: d.dn || 0, contaMestre: d.cm || 0, contaBolha: d.cb || 0, bauParado: d.bpa || 0 };
  TOPO = (d.topo || f.forma || Array(W).fill(0)).slice();
  QUADRADO_ATIVO = !!f.quadrado;
  pintaFundoMestre(f.obj.tipo === 'chefe' ? f.obj.mestre : null);
  document.body.classList.toggle('com-mestre', f.obj.tipo === 'chefe');
  papel = d.papel;
  uid = 0;
  grid = d.g.map(l => l.map(cod => {
    if (!cod) return null;
    if (cod === 'b') return novoBau();
    const pd = cod.split('.');
    const p = novaPeca(+pd[0]);
    p.sp = +pd[1] || 0;
    if (+pd[2]) p.gaiola = +pd[2];          /* bicho preso volta preso */
    if (+pd[3]) p.bolha = true;             /* e a bolha volta subindo */
    if (+pd[4]) p.lixo = +pd[4];            /* e o lixo volta sujo */
    return p;
  }));
  pontosNaTela = 0;
  fechaCartao();
  tela('tela-jogo');
  requestAnimationFrame(() => {
    montaCasas(); dimensiona(); montaPecas(); atualizaHud(); desligaPoder();
    mesa.classList.toggle('com-bau', f.obj.tipo === 'bau');
    garantePresos(); garanteBolhas(); montaPecas(); atualizaHud();
    pintaPapel(); pintaCasasEspeciais();
    if (J.alvoCresce) pintaAvisoCresce();
    J.ocupado = false;
    reiniciaDica();
    Som.liga(); Som.sobe(0);
    Musica.liga('jogo', mundoAtual);
    faixaTexto('De volta');
  });
}

function abreFase(i, ignoraParada) {
  const parada = lePartida();
  atualizaVidas();
  if (!(parada && parada.f === i) && prog.vidas <= 0) { recebeVidas().then(() => semVidas()); return; }
  if (parada && parada.f === i && parada.ot && parada.ot !== fase(i).obj.tipo) { limpaPartida(); return abreFase(i, true); }
  if (!ignoraParada && parada && parada.f === i) {
    cartao('<h3>Você parou aqui</h3>' +
      '<p>Esta fase ficou pela metade, com ' + parada.mov + (parada.mov === 1 ? ' jogada' : ' jogadas') + ' e ' + nf(parada.pontos) + ' pontos.</p>' +
      '<div class="bts"><button class="bt vidro" data-ac="descarta">Começar de novo (−1 ❤)</button>' +
      '<button class="bt" data-ac="retoma">Continuar daqui</button></div>');
    return;
  }
  limpaPartida();
  const f = fase(i);
  instalaMundo(f.m, i);
  descida(f.desafio ? 'Desafio' : metros(f.prof));
  soltaSemente();
  J = { fase: i, mov: f.mov, pontos: 0, coletado: [0, 0, 0, 0, 0, 0],
        papelTotal: 0, papelFeito: 0, ocupado: true, fim: false, cascata: 1,
        bauFeito: 0, bauNaTela: 0, bauPendentes: f.obj.tipo === 'bau' ? f.obj.n : 0, criados: 0, objBatido: false,
        contaCresce: 0, alvoCresce: null };
  papel = (f.obj.tipo === 'papel') ? fazPapel(f.obj.padrao, f.obj.camadas)
                                   : Array.from({ length: H }, () => Array(W).fill(0));
  J.papelBase = papel.map(l => l.slice());
  J.papelTotal = contaPapel(papel);
  J.presosFeitos = 0; J.bolhasFeitas = 0; J.bolhasFugiram = 0; J.contaBolha = 0;
  TOPO = (f.forma || Array(W).fill(0)).slice();
  pintaFundoMestre(f.obj.tipo === 'chefe' ? f.obj.mestre : null);
  document.body.classList.toggle('com-mestre', f.obj.tipo === 'chefe');
  for (let c = 0; c < W; c++) for (let r = 0; r < TOPO[c]; r++) { papel[r][c] = 0; if (J.papelBase) J.papelBase[r][c] = 0; }
  J.papelTotal = contaPapel(papel);
  pontosNaTela = 0;
  montaTabuleiro();
  preparaEspeciaisDaFase();
  fechaCartao();
  tela('tela-jogo');
  requestAnimationFrame(() => {
    montaCasas();
    dimensiona();
    montaPecas();
    atualizaHud();
    desligaPoder();
    mesa.classList.toggle('com-bau', f.obj.tipo === 'bau');
    const chaveMundo = 'r' + (Math.floor(i / CICLO) % REGIOES.length) + 'b' + f.m;
    if (!prog.vistos[chaveMundo]) { prog.vistos[chaveMundo] = true; salvaProg(); mostraMundo(f.m, i); }
    else comecaFase();
  });
}
/* se por qualquer motivo o tabuleiro ficar sem os bichos presos
   que o objetivo pede, o jogo repõe em vez de virar fase morta. */
function garantePresos() {
  const f = faseAtual();
  if (f.obj.tipo !== 'presos') return;
  const falta = Math.max(0, f.obj.n - (J.presosFeitos || 0));
  if (!falta) return;
  let temos = 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] && grid[r][c].gaiola) temos++;
  if (temos >= Math.min(falta, 6)) return;
  const quer = Math.min(falta, 6) - temos;
  for (let k = 0, tent = 0; k < quer && tent < 300; tent++) {
    const r = 1 + sorteia(H - 1), c = sorteia(W), p = grid[r][c];
    if (!p || p.gaiola || p.bau || p.sp || p.bolha) continue;
    p.gaiola = f.obj.rede || 1;
    if (typeof atualizaEl === 'function') atualizaEl(p);
    k++;
  }
}
function garanteBolhas() {
  const f = faseAtual();
  if (f.obj.tipo !== 'bolhas') return;
  const quer = f.obj.juntas || 2;
  let n = 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] && grid[r][c].bolha) n++;
  if (n < quer) nasceBolha(quer - n);
}
/* tela antes da fase: onde, o quê, quantas jogadas e a classificação */
function resumoObjetivo(f) {
  const o = f.obj, ex = o.extra ? ' e juntar a cor abaixo' : '';
  const base = o.tipo === 'pontos' ? 'Fazer ' + nf(f.marcas[0]) + ' pontos'
    : o.tipo === 'coletar' ? 'Juntar estas peças' : o.tipo === 'bau' ? 'Descer ' + o.n + (o.n === 1 ? ' baú' : ' baús') + ' até o fundo'
    : o.tipo === 'especiais' ? 'Criar ' + o.n + ' especiais' : o.tipo === 'presos' ? 'Libertar ' + o.n + ' bichos presos'
    : o.tipo === 'bolhas' ? 'Estourar ' + o.n + ' bolhas de ar' : o.tipo === 'chefe' ? 'Derrotar o mestre'
    : o.tipo === 'perolas' ? 'Colher ' + o.n + ' pérolas' : o.tipo === 'coral' ? 'Recuperar ' + o.n + ' pedaços de coral'
    : o.tipo === 'lixo' ? 'Tirar ' + o.n + ' lixos do fundo' : o.tipo === 'ninho' ? 'Destruir ' + o.ninhos.length + (o.ninhos.length === 1 ? ' ninho' : ' ninhos') + ' e as algas'
    : o.mancha ? 'Conter a maré vermelha' : o.corrente ? 'Quebrar a corrente' : 'Limpar o fundo';
  return base + ex;
}
function iconesObjetivo(f) {
  const o = f.obj, peca = (tp, n) => '<span class="pre-peca"><svg viewBox="0 0 100 100"><use href="#s' + tp + '"/></svg>' + n + '</span>';
  let h = '';
  if (o.tipo === 'coletar' && o.itens) h = o.itens.map(([tp, n]) => peca(tp, n)).join('');
  if (o.extra) h += peca(o.extra.t, o.extra.n);
  return h ? '<div class="pre-pecas">' + h + '</div>' : '';
}
function mostraPreFase() {
  const f = faseAtual(), k = classeDaFase(J.fase), C = CLASSES[k];
  cartao('<div class="pre-fase">' +
    '<p class="pre-num">Fase ' + (J.fase + 1) + ' · ' + metros(f.prof) + '</p>' +
    '<h3>' + f.nome + '</h3>' +
    '<span class="selo-classe" style="--cor-classe:' + C.cor + '">' + C.emoji + ' ' + C.nome.toUpperCase() + '</span>' +
    '<p class="pre-texto">' + C.texto + '</p>' +
    '<div class="pre-linhas"><div class="pre-obj"><small>objetivo</small><b>' + resumoObjetivo(f) + '</b>' + iconesObjetivo(f) + '</div>' +
    '<div><small>jogadas</small><b class="pre-grande">' + f.mov + '</b></div></div>' +
    (condicaoDa(J.fase) ? '<p class="pre-cond">' + CONDICOES[condicaoDa(J.fase)].ic + ' <b>' + CONDICOES[condicaoDa(J.fase)].nome + '</b> · ' + CONDICOES[condicaoDa(J.fase)].texto + '</p>' : '') +
    (f.quadrado ? '<p class="pre-quadrado">🐟 Nesta fase, 4 peças iguais em quadrado viram um peixe-guia</p>' : '') +
    '<div class="pre-estrelas"><span>★ ' + nf(f.marcas[0]) + '</span><span>★★ ' + nf(f.marcas[1]) + '</span><span>★★★ ' + nf(f.marcas[2]) + '</span></div>' +
    (prog.estrelas[J.fase] ? '<p class="pre-recorde">Seu melhor aqui: ' + '★'.repeat(prog.estrelas[J.fase]) + (prog.melhores && prog.melhores[J.fase] ? ' · ' + nf(prog.melhores[J.fase]) + ' pontos' : '') + '</p>' : '') +
    '</div><div class="bts"><button class="bt vidro" data-ac="mapa">Voltar</button>' +
    '<button class="bt" data-ac="comeca">Mergulhar</button></div>');
}
function comecaFase() {
  const f = faseAtual();
  if (!J.viuPre && !J.desafio) { J.viuPre = true; return mostraPreFase(); }
  J.faltaInicial = Math.max(1, faltaObjetivo() || 1);
  garanteBolhas();
  garantePresos();
  if (!prog.vistos.bau && f.obj.tipo === 'bau') { prog.vistos.bau = true; salvaProg(); return mostraAviso('O baú', '#i-bau',
    'O baú só quer chegar na última fileira. Ele não combina com nada e nenhum especial leva ele embora. Estoure as peças debaixo dele para ele descer, ou empurre ele de lado trocando com a peça vizinha. E não se assuste se ele descer sozinho: o baú é pesado e afunda uma casa a cada quatro jogadas.'); }
  if (f.obj.tipo === 'chefe' && !J.viuMestre) {
    J.viuMestre = true;
    const M = MESTRES[f.obj.mestre];
    return cartao('<div class="intro-mestre">' + desenhaMestre(f.obj.mestre) + '</div>' +
      '<p class="prof-faixa">fase ' + (J.fase + 1) + ' · ' + metros(f.prof) + '</p>' +
      '<h3>' + M.nome + '</h3><p>' + M.fala + '</p>' +
      '<p>Cada peça que você estoura machuca ele. De duas em duas jogadas ele revida: rouba uma jogada e cospe tinta, e casa com tinta não machuca. Limpe a tinta e continue batendo.</p>' +
      '<div class="bts"><button class="bt" data-ac="comeca">Encarar</button></div>');
  }
  if (!prog.vistos.perolas2 && f.obj.tipo === 'perolas') { prog.vistos.perolas2 = true; salvaProg(); return mostraAviso('Ostras com pérola', '#i-perola',
    'Algumas casas têm uma ostra fechada no fundo. Estoure a peça em cima uma vez e a ostra abre; estoure de novo e a pérola sobe pra você.'); }
  if (!prog.vistos.coral2 && f.obj.tipo === 'coral') { prog.vistos.coral2 = true; salvaProg(); return mostraAviso('Coral morto', '#i-coral',
    'O coral cinza está morto. Toda peça estourada em cima dele ou bem do lado devolve a cor daquele pedaço. Recupere o recife inteiro.'); }
  if (!prog.vistos.lixo2 && f.obj.tipo === 'lixo') { prog.vistos.lixo2 = true; salvaProg(); return mostraAviso('Lixo no fundo', '#i-lixo0',
    'Garrafas, latas e sacolas não combinam com nada. Estoure peças coladas nelas para tirar do mar; especial que acerta em cheio também leva. Os mais sujos aguentam dois estouros.'); }
  if (!prog.vistos.quadrado && f.quadrado) { prog.vistos.quadrado = true; salvaProg(); return mostraAviso('Peixe-guia', '#sp-peixe',
    'Juntar quatro peças iguais em quadrado cria um peixe-guia. Quando ele dispara, nada direto até três casas que o objetivo pede: cobertura, coral, ostra, lixo ou bicho preso. Ele só aparece em algumas fases, avisadas antes de começar.'); }
  if (!prog.vistos.ninho2 && f.obj.tipo === 'ninho') { prog.vistos.ninho2 = true; salvaProg(); return mostraAviso('Ninho de algas', '#i-ninho',
    'O ninho é a fonte das algas. Toda jogada em que você não destruir nenhuma alga, ele solta uma nova encostada nele. ' +
    'Destruiu pelo menos uma, ele fica quieto. Para parar de vez, estoure três vezes bem colado nele até ele cair. ' +
    'As algas que ele já soltou continuam lá e também contam.'); }
  if (!prog.vistos.presos && f.obj.tipo === 'presos') { prog.vistos.presos = true; salvaProg(); return mostraAviso('Bicho preso', '#i-gaiola',
    'Os bichos presos na rede não combinam com ninguém. Estoure qualquer peça bem do lado deles e a rede se abre.'); }
  if (!prog.vistos.bolhas && f.obj.tipo === 'bolhas') { prog.vistos.bolhas = true; salvaProg(); return mostraAviso('Bolhas de ar', '#i-bolha-ar',
    'As bolhas sobem sozinhas de duas em duas jogadas. Combine a peça que carrega a bolha para estourar antes que ela chegue na superfície e escape.'); }
  if (!prog.vistos.corrente && f.obj.corrente) { prog.vistos.corrente = true; salvaProg(); return mostraAviso('A corrente', null,
    'Cada elo aguenta três estouros. Não adianta espalhar: bata sempre no mesmo lugar até o elo arrebentar.'); }
  if (!prog.vistos.mancha2 && f.obj.mancha) { prog.vistos.mancha2 = true; salvaProg(); return mostraAviso('Maré vermelha', null,
    'A regra é simples: se na jogada você destruir pelo menos uma mancha, ela fica quieta. Se não destruir nenhuma, ela cresce uma casa, ' +
    'sempre encostada nela e de preferência avançando para o lado limpo. Ela pode tomar qualquer parte do tabuleiro, então ataque a borda. ' +
    'Zerou as manchas, acabou: não sobra de onde crescer.'); }
  if (!prog.vistos.cresce2 && f.obj.cresce && !f.obj.mancha) { prog.vistos.cresce2 = true; salvaProg(); return mostraAviso('A alga volta a crescer', null,
    'Aqui a alga não fica quieta: a cada poucas jogadas ela nasce de novo numa casa que você já limpou. É o castigo da fase, então limpar rápido conta mais que limpar bonito. ' +
    'A casa que vai brotar pisca antes, dá pra chegar na frente. E nas três últimas jogadas ela para de crescer, para a fase sempre ter fim.'); }
  J.ocupado = false;
  reiniciaDica();
  Som.liga(); Som.sobe(0);
  Musica.liga('jogo', mundoAtual);
  vigiaFps();
  if (f.desafio) faixaTexto('25 jogadas'); else faixaTexto(metros(f.prof));
}
/* cartão que apresenta cada mecânica: arte grande no topo, a frase
   principal em destaque e o resto em passos curtos e numerados    */
const AVISO_ICONE = { 'Maré vermelha': '#i-mancha', 'A corrente': '#i-corrente', 'A alga volta a crescer': '#i-ninho' };
function mostraAviso(titulo, icone, texto) {
  const ic = icone || AVISO_ICONE[titulo] || '#i-estrela';
  const frases = String(texto).replace(/([.!?])\s+/g, '$1|').split('|').map(s => s.trim()).filter(Boolean);
  const lead = frases.shift() || '';
  cartao('<div class="aviso-arte"><svg viewBox="0 0 100 100"><use href="' + ic + '"/></svg></div>' +
    '<p class="aviso-novo">novidade</p><h3>' + titulo + '</h3>' +
    '<p class="aviso-lead">' + lead + '</p>' +
    (frases.length ? '<ol class="aviso-regras">' + frases.map(f => '<li>' + f + '</li>').join('') + '</ol>' : '') +
    '<div class="bts"><button class="bt" data-ac="comeca">Entendi, bora</button></div>');
}

/* ═══ SOM: BOTÃO ════════════════════════════════════════════════ */
function pintaBotaoSom() {
  const b = document.getElementById('bt-som');
  b.innerHTML = prog.som
    ? '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/></svg>';
  b.setAttribute('aria-label', prog.som ? 'Desligar o som' : 'Ligar o som');
}

/* ═══ ARRANQUE ══════════════════════════════════════════════════ */
function iniciar() {
  mesa = document.getElementById('mesa');
  celulasBox = document.getElementById('celulas');
  pecasBox = document.getElementById('pecas');
  faiscasBox = document.getElementById('faiscas');

  carregaProg();
  Conta.carrega();
  addEventListener('orientationchange', () => setTimeout(encaixaInicio, 250));
  if (Conta.ligada && Conta.dentro) Conta.sincroniza();
  decideLeve();
  aplicaLeve();
  document.getElementById('versao').textContent = 'v' + VERSAO_JOGO;
  document.addEventListener('pointerdown', e => {
    const alvo = e.target.closest('.bt, .ico-bt, .poder, .no, .bt-compra, .subir');
    if (!alvo) return;
    Som.liga(); Som.toque();
    /* poder e nó do mapa têm enfeite pra fora da borda: neles a resposta
       ao toque é um brilho, não a ondinha (que precisaria recortar) */
    if (alvo.classList.contains('poder') || alvo.classList.contains('no')) {
      alvo.classList.remove('tocado'); void alvo.offsetWidth; alvo.classList.add('tocado');
      setTimeout(() => alvo.classList.remove('tocado'), 360);
      return;
    }
    const r = alvo.getBoundingClientRect(), o = document.createElement('span');
    o.className = 'ondinha';
    o.style.left = (e.clientX - r.left) + 'px';
    o.style.top = (e.clientY - r.top) + 'px';
    alvo.appendChild(o);
    setTimeout(() => o.remove(), 620);
  }, true);
  pintaBotaoSom();
  pintaMoedas();
  pintaPoderes();
  instalaMundo(fase(prog.max).m, prog.max);
  tela('tela-inicio');

  document.getElementById('bt-jogar').onclick = () => { Som.liga(); montaMapa(); tela('tela-mapa'); };
  document.getElementById('bt-ajuda').onclick = () => { Som.liga(); mostraAjuda(); };
  document.getElementById('bt-mapa-volta').onclick = () => { instalaMundo(fase(prog.max).m); tela('tela-inicio'); };
  document.getElementById('bt-jogo-volta').onclick = () => {
    /* já jogou nesta tentativa e ela não acabou: sair é desistir, e desistir gasta vida */
    const f = J && J.fase >= 0 ? faseAtual() : null;
    if (f && !J.fim && !J.desafio && J.mov < f.mov) {
      Som.liga();
      return cartao('<h3>Sair da fase?</h3><p>Se sair agora, a tentativa conta como perdida e gasta uma vida. Você tem ❤&nbsp;' + prog.vidas + '.</p>' +
        '<div class="bts"><button class="bt vidro" data-ac="sairfase">Sair (−1 ❤)</button><button class="bt" data-ac="fecha">Continuar jogando</button></div>', true);
    }
    soltaSemente(); fechaCartao(); montaMapa(); tela('tela-mapa');
  };
  if (window.Atualizacao && window.Atualizacao.pronta) avisaVersao();
  document.getElementById('bt-ajustes').onclick = () => { Som.liga(); mostraAjustes(); };
  document.getElementById('podio').onclick = () => { Som.liga(); mostraRanking('geral'); };
  [['#tela-inicio', 'vidas-home'], ['#tela-mapa', 'vidas-mapa']].forEach(([alvo, cls]) => {
    const onde = document.querySelector(alvo);
    if (!onde || onde.querySelector('.pilula-vidas')) return;
    const b = document.createElement('button');
    b.className = 'pilula-vidas ' + cls;
    b.onclick = () => { Som.liga(); atualizaVidas(); prog.vidas >= VIDAS_MAX
      ? cartao('<h3>Vidas cheias</h3><p>Você tem as 5. Cada fase perdida gasta uma, e elas voltam sozinhas, uma a cada 15 minutos.</p><div class="bts"><button class="bt" data-ac="fecha">Beleza</button></div>', true)
      : semVidasOuConta(); };
    onde.appendChild(b);
  });
  pintaVidas();
  document.getElementById('semana-home').onclick = () => { Som.liga(); mostraBau(); };
  document.getElementById('bt-desafio').onclick = () => { Som.liga(); mostraDesafio(); };
  document.getElementById('bt-loja').onclick = () => { Som.liga(); mostraLoja(); };
  document.getElementById('bt-rank').onclick = () => { Som.liga(); mostraRanking(); };
  document.getElementById('poderes').addEventListener('click', e => {
    const b = e.target.closest('[data-p]');
    if (b) clicaPoder(b.dataset.p);
  });
  document.getElementById('bt-som').onclick = () => {
    prog.som = !prog.som; salvaProg(); pintaBotaoSom();
    if (prog.som) { Som.liga(); Som.pop(3); Musica.liga(document.body.classList.contains('em-jogo') ? 'jogo' : 'menu', mundoAtual); }
    else Musica.para();
  };

  document.getElementById('veu').addEventListener('click', e => {
    const b = e.target.closest('[data-ac]');
    if (!b) { if (e.target.id === 'veu' && document.getElementById('cartao').classList.contains('fechavel')) fechaCartao(); return; }
    const ac = b.dataset.ac;
    Som.liga();
    if (ac === 'fecha') fechaCartao();
    else if (ac === 'compra') compra(b.dataset.id);
    else if (ac === 'bau') pegaBau();
    else if (ac === 'desafio') abreDesafio();
    else if (ac === 'compartilha') compartilhaDesafio(b);
    else if (ac === 'mudar') mudaAjuste(b.dataset.k);
    else if (ac === 'procura') procuraVersao(b);
    else if (ac === 'encerra') encerraAgora();
    else if (ac === 'comprafolego') compraFolegoNaHora();
    else if (ac === 'rank') mostraRanking();
    else if (ac === 'apelido') pedeApelido();
    else if (ac === 'codigo') mostraCodigo();
    else if (ac === 'usacodigo') usaCodigo();
    else if (ac === 'aba') mostraRanking(b.dataset.id);
    else if (ac === 'ordem') { ordemRank = b.dataset.id; mostraRanking(); }
    else if (ac === 'salvaapelido') salvaApelido();
    else if (ac === 'criacardume') criaCardume();
    else if (ac === 'entracardume') entraCardume();
    else if (ac === 'confirmacardume') confirmaCardume();
    else if (ac === 'saicardume') saiCardume();
    else if (ac === 'copiacardume') copia(prog.cardume, b, 'Copiar código');
    else if (ac === 'conta') mostraConta();
    else if (ac === 'criaconta') contaEntrar(true, b);
    else if (ac === 'entrar') contaEntrar(false, b);
    else if (ac === 'esqueci') contaEsqueci();
    else if (ac === 'sincroniza') contaSincroniza(b);
    else if (ac === 'sair') contaSair();

    else if (ac === 'retoma') { const d = lePartida(); limpaPartida(); if (d) retomaPartida(d); else fechaCartao(); }
    else if (ac === 'descarta') { const d = lePartida(); limpaPartida(); gastaVida(); if (prog.vidas <= 0 && (prog.vidasAmigos || 0) <= 0) return semVidas(); if (d) abreFase(d.f, true); else fechaCartao(); }
    else if (ac === 'sairfase') { limpaPartida(); gastaVida(); J.fim = true; soltaSemente(); fechaCartao(); montaMapa(); tela('tela-mapa'); }
    else if (ac === 'folego') usaFolegoNoCartao();
    else if (ac === 'comeca') { fechaCartao(); comecaFase(); }
    else if (ac === 'mapa') { cobraDerrota(); fechaCartao(); montaMapa(); tela('tela-mapa'); }
    else if (ac === 'denovo') { cobraDerrota(); if (prog.vidas <= 0) semVidas(); else abreFase(J.fase); }
    else if (ac === 'enchevidas') encheVidas();
    else if (ac === 'usavidaamigo') usaVidaDeAmigo();
    else if (ac === 'pedevidas') pedeVidas(b);
    else if (ac === 'mandavida') mandaVida(b.dataset.id, b.dataset.nome, b);
    else if (ac === 'continuar') continuaPorMoedas();
    else if (ac === 'proxima') abreFase(J.fase + 1);
  });

  mesa.addEventListener('pointerdown', aoPressionar);
  mesa.addEventListener('pointermove', aoMover);
  mesa.addEventListener('pointerup', aoSoltar);
  mesa.addEventListener('pointercancel', () => { arrasto = null; });
  mesa.addEventListener('contextmenu', e => e.preventDefault());

  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (document.getElementById('tela-jogo').classList.contains('ativa')) dimensiona();
      if (document.getElementById('tela-mapa').classList.contains('ativa')) desenhaTrilha();
      encaixaInicio();
    }, 140);
  });

  papel = Array.from({ length: H }, () => Array(W).fill(0));
  grid = Array.from({ length: H }, () => Array(W).fill(null));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { salvaPartida(); if (Conta.dentro) Conta.salva(); Musica.para(); talvezAtualizar(); clearTimeout(dicaTimer); apagaDica(); if (olhoFps) { cancelAnimationFrame(olhoFps); olhoFps = null; } }
    else if (prog.som && prog.musica) Musica.liga(document.body.classList.contains('em-jogo') ? 'jogo' : 'menu', mundoAtual);
  });

  /* a partida parada não atropela mais a abertura: ela espera você
     tocar naquela fase no mapa */
  setTimeout(() => { if (prog.dia !== hoje()) enfileira(mostraBau); }, 700);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
