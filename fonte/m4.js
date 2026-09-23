
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

function faltaObjetivo() {
  const f = faseAtual();
  if (f.obj.tipo === 'chefe') return Math.max(0, f.obj.vida - (J.dano || 0));
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
  const b = f.obj.corrente ? BLOQUEIOS.corrente : f.obj.mancha ? BLOQUEIOS.mancha : ambiente(J.desafio ? 0 : J.fase).bloq;
  return n + ' ' + (n === 1 ? b.um : b.varios);
}
function verboBloq(f) {
  const b = f.obj.corrente ? BLOQUEIOS.corrente : f.obj.mancha ? BLOQUEIOS.mancha : ambiente(J.desafio ? 0 : J.fase).bloq;
  return b.verbo;
}

function atualizaHud() {
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

async function venceu() {
  const eraMestre = faseAtual().obj.tipo === 'chefe';
  tiraBotaoEncerrar();
  if (eraMestre) {
    prog.mestres = (prog.mestres || 0) + 1;
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
  const ganho = moedasDaFase(e, primeira) + (eraMestre ? 80 : 0);
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
    '<div class="estrelas-grandes">' +
      [0, 1, 2].map(i => '<div class="e' + (i < e ? ' on' : '') + '" style="animation-delay:' + (i * .22) + 's"><svg viewBox="0 0 100 100"><use href="#' + (i < e ? 'i-estrela' : 'i-estrela-off') + '"/></svg></div>').join('') +
    '</div>' +
    '<p class="placar-final">' + nf(J.pontos) + '<small>pontos</small></p>' +
    '<p class="ganho-moedas"><svg viewBox="0 0 100 100"><use href="#i-moeda"/></svg>+' + ganho + '</p>' +
    '<p class="pos-fase" id="pos-fase"></p>' +
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
  else if (f.obj.tipo === 'presos') { const n = faltaObjetivo(); falta = n === 1 ? 'Faltou libertar um bicho.' : 'Faltaram ' + n + ' bichos presos.'; }
  else if (f.obj.tipo === 'bolhas') { const n = faltaObjetivo(); falta = n === 1 ? 'Faltou estourar uma bolha.' : 'Faltaram ' + n + ' bolhas.'; }
  else { const n = casasCobertas(papel); falta = (n === 1 ? 'Sobrou ' : 'Sobraram ') + nomeBloq(f, n) + '.'; }
  await espera(400);
  cartao(
    '<h3>Acabaram as jogadas</h3>' +
    '<p>' + falta + '</p>' +
    '<p class="placar-final">' + nf(J.pontos) + '<small>pontos</small></p>' +
    '<div class="bts">' +
      '<button class="bt vidro" data-ac="mapa">Mapa</button>' +
      (prog.poderes.folego > 0
        ? '<button class="bt" data-ac="folego">Fôlego: +5 jogadas</button><button class="bt vidro" data-ac="denovo">Tentar de novo</button>'
        : '<button class="bt" data-ac="denovo">Tentar de novo</button>') +
    '</div>'
  );
}

/* depois da vitória, a colocação daquela fase aparece no cartão */
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
  bar.innerHTML = PODERES.map(p => {
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
  if (id === 'folego') { gastaPoder('folego'); J.mov += 5; atualizaHud(); Som.pop(5); faixaTexto('+5 jogadas'); return; }
  poderAtivo = id;
  document.body.classList.add('mirando');
  const d = document.getElementById('dica-poder');
  d.hidden = false;
  d.textContent = id === 'arpao' ? 'Toque na peça que vai sair' : 'Toque nas duas peças que vão trocar de lugar';
  pintaPoderes();
}
function usaFolegoNoCartao() {
  if ((prog.poderes.folego || 0) <= 0) return;
  gastaPoder('folego');
  fechaCartao();
  J.fim = false; J.ocupado = false; J.mov += 5;
  atualizaHud(); reiniciaDica();
  Som.liga(); Som.pop(5);
  faixaTexto('+5 jogadas');
}
const moedaSvg = '<svg viewBox="0 0 100 100"><use href="#i-moeda"/></svg>';
function mostraLoja() {
  cartao(
    '<h3>Loja</h3>' +
    '<p class="saldo">' + moedaSvg + '<span class="n-moedas">' + nf(prog.moedas) + '</span></p>' +
    '<p>Moeda vem de fase concluída e do baú do dia.</p>' +
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
function mostraBau() {
  cartao(
    '<h3>Baú do dia</h3>' +
    '<p class="bau-premio">' + moedaSvg + '+40</p>' +
    '<p>Volte amanhã que tem outro.</p>' +
    '<div class="bts"><button class="bt" data-ac="bau">Pegar</button></div>'
  );
}
function pegaBau() {
  prog.moedas += 40;
  prog.dia = hoje();
  salvaProg();
  pintaMoedas();
  Som.liga(); Som.vitoria();
  fechaCartao();
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
  pintaFundoMestre(f.obj.tipo === 'chefe' ? f.obj.mestre : null);
  document.body.classList.toggle('com-mestre', f.obj.tipo === 'chefe');
  for (let c = 0; c < W; c++) for (let r = 0; r < TOPO[c]; r++) { papel[r][c] = 0; if (J.papelBase) J.papelBase[r][c] = 0; }
  J.papelTotal = contaPapel(papel);
  pontosNaTela = 0;
  montaTabuleiro();
  fechaCartao();
  tela('tela-jogo');
  requestAnimationFrame(() => {
    montaCasas(); dimensiona(); montaPecas(); atualizaHud(); desligaPoder();
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
function linhasGente(lista) {
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
             linhasGente(lista) +
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
  h += ord.slice(0, 3).map((x, k) => '<div class="linha-podio' + (x.id === meu ? ' eu' : '') + '"><span class="pos">' + medalha(k) + '</span>' +
       '<span class="nome">' + (x.nome || 'mergulhador') + '</span><span class="val">fase ' + ((x.max || 0) + 1) + '</span></div>').join('');
  if (minha >= 3) {
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
  if (id === 'tela-inicio') { requestAnimationFrame(encaixaInicio); setTimeout(pintaPodio, 300); }
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
  const trio = (!travada && est) ? '<span class="trio">' + [0, 1, 2].map(q => '<svg viewBox="0 0 100 100"><use href="#' + (q < est ? 'i-estrela' : 'i-estrela-off') + '"/></svg>').join('') + '</span>' : '';
  const lado = desloc < 0 ? 'left:calc(50% + ' + (desloc + 52).toFixed(1) + 'px);text-align:left'
                          : 'right:calc(50% - ' + (desloc - 52).toFixed(1) + 'px);text-align:right';
  return '<div class="no-linha">' +
    '<button class="no' + (travada ? ' travada' : '') + (i === prog.max && !travada ? ' atual' : '') + '" data-i="' + i + '" style="transform:translateX(' + desloc.toFixed(1) + 'px);--dx:' + desloc.toFixed(1) + 'px;animation-delay:' + (((i - mapaIni) % 24) * 26) + 'ms" aria-label="Fase ' + (i + 1) + ': ' + f.nome + (travada ? ', ainda fechada' : '') + '">' +
      '<span class="disco"></span><span class="num">' + (travada ? CADEADO : (i + 1)) + '</span>' + trio +
      (parada ? '<span class="marca-parada" aria-label="partida pela metade">⏸</span>' : '') + '</button>' +
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
        papelBase: d.base };
  papel = d.papel;
  uid = 0;
  grid = d.g.map(l => l.map(cod => {
    if (!cod) return null;
    if (cod === 'b') return novoBau();
    const pd = cod.split('.');
    const p = novaPeca(+pd[0]); p.sp = +pd[1]; return p;
  }));
  pontosNaTela = 0;
  fechaCartao();
  tela('tela-jogo');
  requestAnimationFrame(() => {
    montaCasas(); dimensiona(); montaPecas(); atualizaHud(); desligaPoder();
    mesa.classList.toggle('com-bau', f.obj.tipo === 'bau');
    pintaPapel();
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
  if (!ignoraParada && parada && parada.f === i) {
    cartao('<h3>Você parou aqui</h3>' +
      '<p>Esta fase ficou pela metade, com ' + parada.mov + (parada.mov === 1 ? ' jogada' : ' jogadas') + ' e ' + nf(parada.pontos) + ' pontos.</p>' +
      '<div class="bts"><button class="bt vidro" data-ac="descarta">Começar de novo</button>' +
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
function garanteBolhas() {
  const f = faseAtual();
  if (f.obj.tipo !== 'bolhas') return;
  const quer = f.obj.juntas || 2;
  let n = 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (grid[r][c] && grid[r][c].bolha) n++;
  if (n < quer) nasceBolha(quer - n);
}
function comecaFase() {
  const f = faseAtual();
  garanteBolhas();
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
  if (!prog.vistos.presos && f.obj.tipo === 'presos') { prog.vistos.presos = true; salvaProg(); return mostraAviso('Bicho preso', '#i-gaiola',
    'Os bichos presos na rede não combinam com ninguém. Estoure qualquer peça bem do lado deles e a rede se abre.'); }
  if (!prog.vistos.bolhas && f.obj.tipo === 'bolhas') { prog.vistos.bolhas = true; salvaProg(); return mostraAviso('Bolhas de ar', '#i-bolha-ar',
    'As bolhas sobem sozinhas de duas em duas jogadas. Combine a peça que carrega a bolha para estourar antes que ela chegue na superfície e escape.'); }
  if (!prog.vistos.corrente && f.obj.corrente) { prog.vistos.corrente = true; salvaProg(); return mostraAviso('A corrente', null,
    'Cada elo aguenta três estouros. Não adianta espalhar: bata sempre no mesmo lugar até o elo arrebentar.'); }
  if (!prog.vistos.mancha && f.obj.mancha) { prog.vistos.mancha = true; salvaProg(); return mostraAviso('Maré vermelha', null,
    'A mancha se espalha para as casas vizinhas se você demorar. A próxima a nascer pisca antes, então dá pra chegar na frente.'); }
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
function mostraAviso(titulo, icone, texto) {
  cartao('<h3>' + titulo + '</h3>' +
    (icone ? '<div class="vitrine-mini"><svg class="ic" viewBox="0 0 100 100"><use href="' + icone + '"/></svg></div>' : '') +
    '<p>' + texto + '</p>' +
    '<div class="bts"><button class="bt" data-ac="comeca">Entendi</button></div>');
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
  document.getElementById('bt-jogo-volta').onclick = () => { soltaSemente(); fechaCartao(); montaMapa(); tela('tela-mapa'); };
  if (window.Atualizacao && window.Atualizacao.pronta) avisaVersao();
  document.getElementById('bt-ajustes').onclick = () => { Som.liga(); mostraAjustes(); };
  document.getElementById('podio').onclick = () => { Som.liga(); mostraRanking('geral'); };
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
    else if (ac === 'descarta') { const d = lePartida(); limpaPartida(); if (d) abreFase(d.f, true); else fechaCartao(); }
    else if (ac === 'folego') usaFolegoNoCartao();
    else if (ac === 'comeca') { fechaCartao(); comecaFase(); }
    else if (ac === 'mapa') { fechaCartao(); montaMapa(); tela('tela-mapa'); }
    else if (ac === 'denovo') abreFase(J.fase);
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
