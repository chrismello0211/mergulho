
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

function faltaObjetivo() {
  const f = faseAtual();
  if (f.obj.tipo === 'pontos') return Math.max(0, f.marcas[0] - J.pontos);
  if (f.obj.tipo === 'coletar') return f.obj.itens.reduce((a, it) => a + Math.max(0, it[1] - J.coletado[it[0]]), 0);
  if (f.obj.tipo === 'bau') return Math.max(0, f.obj.n - J.bauFeito);
  if (f.obj.tipo === 'especiais') return Math.max(0, f.obj.n - (J.criados || 0));
  return Math.max(0, J.papelTotal - J.papelFeito);
}
function objetivoFeito() { return faltaObjetivo() === 0; }
function nomeBloq(f, n) { const b = ambiente(J.desafio ? 0 : J.fase).bloq; return n + ' ' + (n === 1 ? b.um : b.varios); }

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
    o.innerHTML = '<div><div class="rotulo">' + ambiente(J.desafio ? 0 : J.fase).bloq.verbo + '</div>' +
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
    return;
  }
  if (objetivoFeito()) return fecha(venceu);
  if (J.mov <= 0) return fecha(perdeu);
}

async function venceu() {
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
  const ganho = moedasDaFase(e, primeira);
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
    '<p>' + (fimExp ? 'Foram 4.000 metros. A Expedição ' + expedicao(J.fase + 1) + ' começa de novo no raso, mais apertada.'
             : muda ? frases[e - 1] + ' Daqui pra baixo começa ' + ambiente(J.fase + 1).nome + '.' : frases[e - 1]) + '</p>' +
    '<div class="bts">' +
      '<button class="bt vidro" data-ac="mapa">Mapa</button>' +
      '<button class="bt" data-ac="proxima">' + (fimExp ? 'Nova expedição' : muda ? 'Descer para ' + ambiente(J.fase + 1).nome : 'Próxima fase') + '</button>' +
    '</div>'
  );
  Som.liga(); Som.vitoria();
  document.body.classList.remove('aperto');
  Musica.tensao(false, 0);
  fogos(2 + e * 2);
  for (let i = 0; i < e; i++) setTimeout(() => { Som.estrela(i); vibra(TREMIDA.estrela); }, 260 + i * 220);
  vibra(TREMIDA.vitoria);
}

async function perdeu() {
  J.ocupado = true;
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
window.avisaVersao = function () {
  const el = document.getElementById('aviso-versao');
  if (!el) return;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('mostra'));
};
function aplicaVersao() {
  const A = window.Atualizacao;
  salvaPartida();
  if (!A || !A.reg || !A.reg.waiting) { location.reload(); return; }
  A.aplicando = true;
  const el = document.getElementById('bt-atualiza');
  if (el) el.textContent = 'Atualizando...';
  try { A.reg.waiting.postMessage('atualiza-agora'); } catch (e) {}
  setTimeout(() => location.reload(), 1500);
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
    '<div class="ajuste"><div class="txt"><b>Progresso</b><small>' +
      (Conta.dentro ? Conta.sessao.email : Conta.ligada ? 'Ainda só neste aparelho' : 'Guardado neste aparelho') + '</small></div>' +
      '<button class="bt-compra" data-ac="conta">' + (Conta.dentro ? 'Ver' : 'Guardar') + '</button></div>' +
    '<p class="versao-cartao">versão ' + VERSAO_JOGO + '</p>' +
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
  ['arpao', 'troca', 'giro', 'folego'].forEach(k => r.poderes[k] = Math.max((a.poderes || {})[k] || 0, (b.poderes || {})[k] || 0));
  r.vistos = Object.assign({}, b.vistos || {}, a.vistos || {});
  const da = a.desafio || {}, db = b.desafio || {};
  r.desafio = { semana: (da.melhor || 0) >= (db.melhor || 0) ? da.semana : db.semana,
                melhor: Math.max(da.melhor || 0, db.melhor || 0), nome: da.nome || db.nome || '' };
  r.apelido = a.apelido || b.apelido || '';
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

/* ═══ TELAS ═════════════════════════════════════════════════════ */
function tela(id) {
  ['tela-inicio', 'tela-mapa', 'tela-jogo'].forEach(t =>
    document.getElementById(t).classList.toggle('ativa', t === id));
  document.body.classList.toggle('em-jogo', id === 'tela-jogo');
  if (id === 'tela-jogo') Musica.liga('jogo', mundoAtual);
  else { document.body.classList.remove('aperto'); Musica.liga('menu', mundoAtual); }
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
  pontosNaTela = 0;
  montaTabuleiro();
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
function comecaFase() {
  const f = faseAtual();
  if (!prog.vistos.bau && f.obj.tipo === 'bau') { prog.vistos.bau = true; salvaProg(); return mostraAviso('O baú', '#i-bau',
    'O baú só quer chegar na última fileira. Ele não combina com nada e nenhum especial leva ele embora. Estoure as peças debaixo dele para ele descer, e empurre ele de lado para escolher a coluna. Ele também é pesado: a cada quatro jogadas afunda uma casa sozinho.'); }
  if (!prog.vistos.cresce && f.obj.cresce) { prog.vistos.cresce = true; salvaProg(); return mostraAviso('A alga volta', null,
    'Nesta fase a alga cresce de novo se você demorar. A casa que vai voltar pisca antes, então dá pra chegar na frente. Nas últimas jogadas ela para de crescer.'); }
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
  if (Conta.ligada && Conta.dentro) Conta.sincroniza();
  decideLeve();
  aplicaLeve();
  document.getElementById('versao').textContent = 'v' + VERSAO_JOGO;
  document.addEventListener('pointerdown', e => {
    const alvo = e.target.closest('.bt, .ico-bt, .poder, .no, .bt-compra, .subir, .bt-att');
    if (!alvo) return;
    Som.liga(); Som.toque();
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
  document.getElementById('bt-atualiza').onclick = aplicaVersao;
  if (window.Atualizacao && window.Atualizacao.pronta) avisaVersao();
  document.getElementById('bt-ajustes').onclick = () => { Som.liga(); mostraAjustes(); };
  document.getElementById('bt-desafio').onclick = () => { Som.liga(); mostraDesafio(); };
  document.getElementById('bt-loja').onclick = () => { Som.liga(); mostraLoja(); };
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
    }, 140);
  });

  papel = Array.from({ length: H }, () => Array(W).fill(0));
  grid = Array.from({ length: H }, () => Array(W).fill(null));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { salvaPartida(); if (Conta.dentro) Conta.salva(); Musica.para(); clearTimeout(dicaTimer); apagaDica(); if (olhoFps) { cancelAnimationFrame(olhoFps); olhoFps = null; } }
    else if (prog.som && prog.musica) Musica.liga(document.body.classList.contains('em-jogo') ? 'jogo' : 'menu', mundoAtual);
  });

  /* a partida parada não atropela mais a abertura: ela espera você
     tocar naquela fase no mapa */
  setTimeout(() => { if (prog.dia !== hoje()) enfileira(mostraBau); }, 700);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
