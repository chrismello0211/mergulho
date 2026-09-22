
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
function nomeBloq(f, n) { const b = MUNDOS[f.m].bloq; return n + ' ' + (n === 1 ? b.um : b.varios); }

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
  } else {
    const falta = casasCobertas(papel);
    o.innerHTML = '<div><div class="rotulo">' + MUNDOS[f.m].bloq.verbo + '</div>' +
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
  if (prog.conta) nuvemSalva();
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
             : muda ? frases[e - 1] + ' Daqui pra baixo começa o ' + MUNDOS[prox.m].nome + '.' : frases[e - 1]) + '</p>' +
    '<div class="bts">' +
      '<button class="bt vidro" data-ac="mapa">Mapa</button>' +
      '<button class="bt" data-ac="proxima">' + (fimExp ? 'Nova expedição' : muda ? 'Descer para o ' + MUNDOS[prox.m].nome : 'Próxima fase') + '</button>' +
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
function cartao(html) {
  document.getElementById('cartao').innerHTML = html;
  document.getElementById('veu').classList.add('aberto');
}
function fechaCartao() { document.getElementById('veu').classList.remove('aberto'); }

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
    '<div class="bts"><button class="bt" data-ac="fecha">Entendi</button></div>'
  );
}

/* a primeira vez em cada mundo: onde você está e o que muda */
function mostraMundo(m) {
  const mu = MUNDOS[m];
  cartao(
    '<div class="intro-mundo">' +
    '<p class="prof-faixa">' + metros(mu.de) + ' a ' + metros(mu.ate) + '</p>' +
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
    '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>'
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
  url: '',   /* URL do Realtime Database, ex.: https://seu-projeto.firebaseio.com — vazio, o ranking fica só no aparelho */
  id: null,
  async envia(nome, pontos, semana) {
    if (!this.url || !nome) return;
    try {
      this.id = this.id || Math.random().toString(36).slice(2, 10);
      await fetch(this.url + '/mergulho/' + semana + '/' + this.id + '.json',
        { method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome, pontos: pontos, quando: Date.now() }) });
    } catch (e) { /* sem rede: o recorde continua salvo aqui */ }
  },
  async lista(semana) {
    if (!this.url) return null;
    try {
      const r = await fetch(this.url + '/mergulho/' + semana + '.json');
      const d = await r.json();
      return Object.values(d || {}).sort((a, b) => b.pontos - a.pontos).slice(0, 20);
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
    '<button class="bt" data-ac="desafio">Jogar</button></div>');
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
      (prog.conta ? 'Código ' + prog.conta : 'Ainda só neste aparelho') + '</small></div>' +
      '<button class="bt-compra" data-ac="conta">' + (prog.conta ? 'Ver' : 'Proteger') + '</button></div>' +
    '<p class="versao-cartao">versão ' + VERSAO_JOGO + '</p>' +
    '<div class="bts"><button class="bt" data-ac="fecha">Fechar</button></div>');
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


/* ═══ CONTA E BACKUP ════════════════════════════════════════════
   Ninguém pode perder o que já jogou. Duas redes de segurança:
   1. código de backup, que funciona sem internet nenhuma;
   2. conta na nuvem, que liga quando a URL do banco estiver aqui.
   Em qualquer volta os dois progressos se juntam pelo melhor de
   cada um, então entrar com um código nunca apaga nada.          */
const NUVEM = { url: '' };   /* ex.: https://seu-projeto-default-rtdb.firebaseio.com */

function codigoNovo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += letras[Math.floor(Math.random() * letras.length)];
  return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8, 12);
}
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
  r.desafio = { semana: da.semana === db.semana ? da.semana : (da.melhor >= db.melhor ? da.semana : db.semana),
                melhor: Math.max(da.melhor || 0, db.melhor || 0), nome: da.nome || db.nome || '' };
  r.conta = a.conta || b.conta || '';
  r.apelido = a.apelido || b.apelido || '';
  return r;
}
function aplicaProg(novo) { prog = juntaProg(novo, prog); salvaProg(); pintaMoedas(); pintaPoderes(); pintaBotaoSom(); aplicaLeve(); }

const paraTexto = () => 'MERGULHO1:' + btoa(unescape(encodeURIComponent(JSON.stringify(prog))));
function doTexto(txt) {
  try {
    const cru = String(txt).trim().replace(/^MERGULHO1:/, '');
    const d = JSON.parse(decodeURIComponent(escape(atob(cru))));
    return (d && typeof d.max === 'number') ? d : null;
  } catch (e) { return null; }
}
async function copia(txt, botao, rotulo) {
  try { await navigator.clipboard.writeText(txt); }
  catch (e) { try { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } catch (e2) { return; } }
  if (botao) { const antes = botao.textContent; botao.textContent = 'Copiado!'; setTimeout(() => botao.textContent = rotulo || antes, 1800); }
}
async function nuvemSalva() {
  if (!NUVEM.url || !prog.conta) return false;
  try {
    const r = await fetch(NUVEM.url + '/mergulho/contas/' + prog.conta.replace(/-/g, '') + '.json',
      { method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apelido: prog.apelido || '', quando: Date.now(), prog: prog }) });
    return r.ok;
  } catch (e) { return false; }
}
async function nuvemLe(codigo) {
  if (!NUVEM.url) return null;
  try {
    const r = await fetch(NUVEM.url + '/mergulho/contas/' + codigo.replace(/-/g, '').toUpperCase() + '.json');
    const d = await r.json();
    return d && d.prog ? d.prog : null;
  } catch (e) { return null; }
}

function mostraConta() {
  const temNuvem = !!NUVEM.url;
  if (!prog.conta) {
    cartao('<h3>Seu progresso</h3>' +
      '<p>Hoje ele fica só neste aparelho. Crie um código e guarde: com ele você recupera tudo se trocar de celular ou limpar o navegador.</p>' +
      '<input class="campo" id="campo-apelido" maxlength="18" placeholder="Seu apelido (opcional)">' +
      '<div class="bts"><button class="bt vidro" data-ac="fecha">Agora não</button>' +
      '<button class="bt" data-ac="criaconta">Criar meu código</button></div>');
    return;
  }
  cartao('<h3>Seu código</h3>' +
    '<p class="codigo">' + prog.conta + '</p>' +
    '<p>' + (prog.apelido ? prog.apelido + ', guarde' : 'Guarde') + ' esse código em algum lugar seguro. ' +
    (temNuvem ? 'Ele também sincroniza pela internet: é só entrar com ele em outro aparelho.'
              : 'Ele vem junto no backup abaixo, que funciona sem internet.') + '</p>' +
    '<div class="bts">' +
      '<button class="bt vidro" data-ac="copiacodigo">Copiar código</button>' +
      '<button class="bt vidro" data-ac="copiabackup">Copiar backup</button>' +
    '</div>' +
    '<div class="bts">' +
      '<button class="bt vidro" data-ac="colar">Restaurar backup</button>' +
      (temNuvem ? '<button class="bt" data-ac="salvanuvem">Salvar na nuvem</button>' : '<button class="bt" data-ac="fecha">Fechar</button>') +
    '</div>');
}
function criaConta() {
  const campo = document.getElementById('campo-apelido');
  prog.apelido = campo ? campo.value.trim().slice(0, 18) : '';
  prog.conta = codigoNovo();
  if (prog.desafio && !prog.desafio.nome) prog.desafio.nome = prog.apelido;
  salvaProg();
  nuvemSalva();
  mostraConta();
}
function mostraColar() {
  cartao('<h3>Restaurar</h3>' +
    '<p>Cole aqui o backup que você copiou' + (NUVEM.url ? ', ou digite o código da sua conta' : '') + '. Nada é apagado: o jogo fica com o melhor dos dois progressos.</p>' +
    '<textarea class="campo alto" id="campo-backup" placeholder="MERGULHO1:... ou ABCD-1234-EFGH"></textarea>' +
    '<div class="bts"><button class="bt vidro" data-ac="conta">Voltar</button>' +
    '<button class="bt" data-ac="restaura">Restaurar</button></div>');
}
async function restaura() {
  const campo = document.getElementById('campo-backup');
  const txt = campo ? campo.value.trim() : '';
  if (!txt) return;
  let novo = doTexto(txt);
  if (!novo && NUVEM.url && /^[A-Za-z0-9-]{8,20}$/.test(txt)) novo = await nuvemLe(txt);
  if (!novo) {
    cartao('<h3>Não deu</h3><p>Esse texto não parece um backup nem um código válido. Confira se veio inteiro.</p>' +
      '<div class="bts"><button class="bt" data-ac="colar">Tentar de novo</button></div>');
    return;
  }
  aplicaProg(novo);
  Som.liga(); Som.vitoria();
  cartao('<h3>Pronto</h3><p>Progresso restaurado: fase ' + (prog.max + 1) + ', ' + totalEstrelas() + ' estrelas e ' + nf(prog.moedas) + ' moedas.</p>' +
    '<div class="bts"><button class="bt" data-ac="mapa">Ver o mapa</button></div>');
}
async function salvaNaNuvem(botao) {
  if (botao) botao.textContent = 'Salvando...';
  const ok = await nuvemSalva();
  if (botao) { botao.textContent = ok ? 'Salvo!' : 'Falhou'; setTimeout(() => botao.textContent = 'Salvar na nuvem', 1800); }
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

let mapaIni = 0;

function superficieMapa(exp) {
  return '<div class="superficie" aria-hidden="true"><div class="sol"></div>' +
    '<svg class="barco" viewBox="0 0 120 60"><path d="M8 38h96l-12 16H22Z" fill="#0B3A55"/><path d="M34 38V22h30v16" fill="#13506F"/>' +
    '<path d="M70 38V6" stroke="#0B3A55" stroke-width="3"/><path d="M71 7h26v16H71Z" fill="#E8412C"/><path d="M71 23L97 7" stroke="#fff" stroke-width="4"/></svg>' +
    '<div class="onda-mapa"></div></div>' +
    (exp > 1 ? '<p class="cab-exped">Expedição ' + exp + '</p>' : '');
}
function leitoMapa() {
  return '<div class="leito" aria-hidden="true"><svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice"><path d="M0 70Q60 50 120 64T240 58T400 60V120H0Z" fill="#05060F"/>' +
    '<circle cx="90" cy="52" r="3" fill="#6BFFE0"/><circle cx="90" cy="52" r="9" fill="#6BFFE0" opacity=".2"/><circle cx="300" cy="46" r="2.6" fill="#9A5CFF"/><circle cx="300" cy="46" r="8" fill="#9A5CFF" opacity=".2"/></svg>' +
    '<p>O fundo, 4.000 m</p></div>';
}
function noDoMapa(i) {
  const f = fase(i), desloc = Math.sin(i * 0.82) * 70, travada = i > prog.max, est = prog.estrelas[i] || 0;
  const trio = (!travada && est) ? '<span class="trio">' + [0, 1, 2].map(q => '<svg viewBox="0 0 100 100"><use href="#' + (q < est ? 'i-estrela' : 'i-estrela-off') + '"/></svg>').join('') + '</span>' : '';
  const lado = desloc < 0 ? 'left:calc(50% + ' + (desloc + 52).toFixed(1) + 'px);text-align:left'
                          : 'right:calc(50% - ' + (desloc - 52).toFixed(1) + 'px);text-align:right';
  return '<div class="no-linha">' +
    '<button class="no' + (travada ? ' travada' : '') + (i === prog.max && !travada ? ' atual' : '') + '" data-i="' + i + '" style="transform:translateX(' + desloc.toFixed(1) + 'px);--dx:' + desloc.toFixed(1) + 'px;animation-delay:' + (((i - mapaIni) % 24) * 26) + 'ms" aria-label="Fase ' + (i + 1) + ': ' + f.nome + (travada ? ', ainda fechada' : '') + '">' +
      '<span class="disco"></span><span class="num">' + (travada ? CADEADO : (i + 1)) + '</span>' + trio + '</button>' +
    '<span class="no-rotulo' + (travada ? ' apagado' : '') + '" style="' + lado + '"><b>' + f.nome + '</b><small>' + metros(f.prof) + '</small></span>' +
  '</div>';
}

/* o mapa mostra uma janela de fases: com dez mil nós na tela o
   celular não aguentaria, então desenha em volta de onde você está */
function montaMapa(mantem) {
  const col = document.getElementById('coluna'), trilha = document.getElementById('trilha');
  const altaAntes = col.scrollHeight;
  if (!mantem) mapaIni = Math.max(0, prog.max - 17);
  const fim = prog.max + 6;
  let h = '<svg class="trilha-svg" id="trilha-bolhas" aria-hidden="true"></svg>';
  if (mapaIni > 0) h += '<button class="subir" id="bt-subir">Subir para as fases anteriores</button>';
  for (let b = Math.floor(mapaIni / 6); b <= Math.floor(fim / 6); b++) {
    const i0 = b * 6, mundo = Math.floor((i0 % CICLO) / 6), mu = MUNDOS[mundo];
    if (i0 % CICLO === 0 && i0 >= mapaIni) h += superficieMapa(expedicao(i0));
    h += '<section class="faixa-mundo" data-m="' + mundo + '">' +
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

function abreFase(i) {
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
    if (!prog.vistos[f.m]) { prog.vistos[f.m] = true; salvaProg(); mostraMundo(f.m); }
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
  decideLeve();
  aplicaLeve();
  document.getElementById('versao').textContent = 'v' + VERSAO_JOGO;
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('.bt, .ico-bt, .poder, .no, .bt-compra, .subir')) { Som.liga(); Som.toque(); }
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
    if (!b) { if (e.target.id === 'veu' && document.querySelector('#cartao .ajuda')) fechaCartao(); return; }
    const ac = b.dataset.ac;
    Som.liga();
    if (ac === 'fecha') fechaCartao();
    else if (ac === 'compra') compra(b.dataset.id);
    else if (ac === 'bau') pegaBau();
    else if (ac === 'desafio') abreDesafio();
    else if (ac === 'compartilha') compartilhaDesafio(b);
    else if (ac === 'mudar') mudaAjuste(b.dataset.k);
    else if (ac === 'conta') mostraConta();
    else if (ac === 'criaconta') criaConta();
    else if (ac === 'copiacodigo') copia(prog.conta, b, 'Copiar código');
    else if (ac === 'copiabackup') copia(paraTexto(), b, 'Copiar backup');
    else if (ac === 'colar') mostraColar();
    else if (ac === 'restaura') restaura();
    else if (ac === 'salvanuvem') salvaNaNuvem(b);
    else if (ac === 'retoma') { const d = lePartida(); limpaPartida(); if (d) retomaPartida(d); else fechaCartao(); }
    else if (ac === 'descarta') { limpaPartida(); fechaCartao(); if (prog.dia !== hoje()) setTimeout(mostraBau, 300); }
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
    if (document.hidden) { salvaPartida(); Musica.para(); clearTimeout(dicaTimer); apagaDica(); if (olhoFps) { cancelAnimationFrame(olhoFps); olhoFps = null; } }
    else if (prog.som && prog.musica) Musica.liga(document.body.classList.contains('em-jogo') ? 'jogo' : 'menu', mundoAtual);
  });

  const parada = lePartida();
  if (parada && fase(parada.f)) {
    setTimeout(() => cartao('<h3>Você parou no meio</h3>' +
      '<p>A fase ' + (parada.f + 1) + ' ficou pela metade, com ' + parada.mov + (parada.mov === 1 ? ' jogada' : ' jogadas') + ' e ' + nf(parada.pontos) + ' pontos. Quer voltar pra ela?</p>' +
      '<div class="bts"><button class="bt vidro" data-ac="descarta">Começar de novo</button>' +
      '<button class="bt" data-ac="retoma">Continuar</button></div>'), 500);
  } else if (prog.dia !== hoje()) setTimeout(mostraBau, 700);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
