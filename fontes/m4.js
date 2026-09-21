
/* ═══ HUD ═══════════════════════════════════════════════════════ */
const nf = n => n.toLocaleString('pt-BR');
const icone = t => '<svg class="ic" viewBox="0 0 100 100"><use href="#s' + t + '"/></svg>';

function gastaJogada() {
  J.mov = Math.max(0, J.mov - 1);
  const m = document.getElementById('movimentos');
  m.classList.add('bate'); setTimeout(() => m.classList.remove('bate'), 400);
  atualizaHud();
}

function faltaObjetivo() {
  const f = fase(J.fase);
  if (f.obj.tipo === 'pontos') return Math.max(0, f.marcas[0] - J.pontos);
  if (f.obj.tipo === 'coletar') return f.obj.itens.reduce((a, it) => a + Math.max(0, it[1] - J.coletado[it[0]]), 0);
  return Math.max(0, J.papelTotal - J.papelFeito);
}
function objetivoFeito() { return faltaObjetivo() === 0; }
function nomeBloq(f, n) { const b = MUNDOS[f.m].bloq; return n + ' ' + (n === 1 ? b.um : b.varios); }

function atualizaHud() {
  const f = fase(J.fase);
  document.getElementById('mov-n').textContent = J.mov;
  document.getElementById('mov-lb').textContent = J.mov === 1 ? 'jogada' : 'jogadas';
  document.getElementById('movimentos').classList.toggle('aperto', J.mov <= 5);
  document.getElementById('pontos').textContent = nf(J.pontos);

  const teto = f.marcas[2];
  document.getElementById('barra-cheio').style.width = Math.min(100, J.pontos / teto * 100) + '%';
  [0, 1, 2].forEach(i => {
    const m = document.getElementById('m' + (i + 1));
    m.style.left = (f.marcas[i] / teto * 100) + '%';
    m.querySelector('use').setAttribute('href', J.pontos >= f.marcas[i] ? '#i-estrela' : '#i-estrela-off');
  });
  document.getElementById('meta-texto').textContent = J.pontos >= teto ? 'três estrelas!' : nf(teto) + ' para 3 estrelas';
  document.getElementById('fase-nome').textContent = f.nome;
  document.getElementById('fase-prof').textContent = metros(f.prof);

  const o = document.getElementById('objetivo');
  if (f.obj.tipo === 'pontos') {
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

/* ═══ FIM DE FASE ═══════════════════════════════════════════════ */
async function confere() {
  if (J.fim) return;
  const porPontos = fase(J.fase).obj.tipo === 'pontos';
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
  const f = fase(J.fase);
  let e = 1;
  if (J.pontos >= f.marcas[1]) e = 2;
  if (J.pontos >= f.marcas[2]) e = 3;
  const primeira = !prog.estrelas[J.fase];
  prog.estrelas[J.fase] = Math.max(prog.estrelas[J.fase] || 0, e);
  if (J.fase + 1 > prog.max) prog.max = J.fase + 1;
  const ganho = moedasDaFase(e, primeira);
  prog.moedas += ganho;
  salvaProg();
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
  for (let i = 0; i < e; i++) setTimeout(() => Som.estrela(i), 260 + i * 220);
  vibra([20, 60, 20]);
}

async function perdeu() {
  J.ocupado = true;
  Som.liga(); Som.derrota();
  const f = fase(J.fase);
  let falta;
  if (f.obj.tipo === 'pontos') falta = 'Faltaram ' + nf(f.marcas[0] - J.pontos) + ' pontos.';
  else if (f.obj.tipo === 'coletar') { const n = faltaObjetivo(); falta = 'Faltou juntar ' + n + (n === 1 ? ' peça.' : ' peças.'); }
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

    '<h4>Dois especiais juntos</h4>' +
    '<p>Duas correntezas fazem uma cruz. Correnteza com bolha limpa três fileiras e três colunas. Duas pérolas limpam o tabuleiro inteiro.</p>' +

    '<h4>O que cobre o fundo</h4>' +
    '<p>Em algumas fases o fundo vem coberto de areia, alga, rede, lodo ou breu. Estoure uma peça em cima para limpar a casa. As mais escuras precisam de duas.</p>' +

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
    '<p class="bau-premio">' + moedaSvg + '+60</p>' +
    '<p>Volte amanhã que tem outro.</p>' +
    '<div class="bts"><button class="bt" data-ac="bau">Pegar</button></div>'
  );
}
function pegaBau() {
  prog.moedas += 60;
  prog.dia = hoje();
  salvaProg();
  pintaMoedas();
  Som.liga(); Som.vitoria();
  fechaCartao();
}

/* ═══ TELAS ═════════════════════════════════════════════════════ */
function tela(id) {
  ['tela-inicio', 'tela-mapa', 'tela-jogo'].forEach(t =>
    document.getElementById(t).classList.toggle('ativa', t === id));
  document.body.classList.toggle('em-jogo', id === 'tela-jogo');
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
    '<button class="no' + (travada ? ' travada' : '') + (i === prog.max && !travada ? ' atual' : '') + '" data-i="' + i + '" style="transform:translateX(' + desloc.toFixed(1) + 'px)" aria-label="Fase ' + (i + 1) + ': ' + f.nome + (travada ? ', ainda fechada' : '') + '">' +
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

/* ═══ ABRIR UMA FASE ════════════════════════════════════════════ */
function abreFase(i) {
  const f = fase(i);
  instalaMundo(f.m);
  J = { fase: i, mov: f.mov, pontos: 0, coletado: [0, 0, 0, 0, 0, 0],
        papelTotal: 0, papelFeito: 0, ocupado: true, fim: false, cascata: 1 };
  papel = (f.obj.tipo === 'papel') ? fazPapel(f.obj.padrao, f.obj.camadas)
                                   : Array.from({ length: H }, () => Array(W).fill(0));
  J.papelTotal = contaPapel(papel);
  montaTabuleiro();
  fechaCartao();
  tela('tela-jogo');
  requestAnimationFrame(() => {
    montaCasas();
    dimensiona();
    montaPecas();
    atualizaHud();
    desligaPoder();
    if (!prog.vistos[f.m]) { prog.vistos[f.m] = true; salvaProg(); mostraMundo(f.m); }
    else comecaFase();
  });
}
function comecaFase() {
  J.ocupado = false;
  reiniciaDica();
  faixaTexto(metros(fase(J.fase).prof));
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
  pintaBotaoSom();
  pintaMoedas();
  pintaPoderes();
  instalaMundo(fase(prog.max).m);
  tela('tela-inicio');

  document.getElementById('bt-jogar').onclick = () => { Som.liga(); montaMapa(); tela('tela-mapa'); };
  document.getElementById('bt-ajuda').onclick = () => { Som.liga(); mostraAjuda(); };
  document.getElementById('bt-mapa-volta').onclick = () => { instalaMundo(fase(prog.max).m); tela('tela-inicio'); };
  document.getElementById('bt-jogo-volta').onclick = () => { fechaCartao(); montaMapa(); tela('tela-mapa'); };
  document.getElementById('bt-loja').onclick = () => { Som.liga(); mostraLoja(); };
  document.getElementById('poderes').addEventListener('click', e => {
    const b = e.target.closest('[data-p]');
    if (b) clicaPoder(b.dataset.p);
  });
  document.getElementById('bt-som').onclick = () => { prog.som = !prog.som; salvaProg(); pintaBotaoSom(); if (prog.som) { Som.liga(); Som.pop(3); } };

  document.getElementById('veu').addEventListener('click', e => {
    const b = e.target.closest('[data-ac]');
    if (!b) { if (e.target.id === 'veu' && document.querySelector('#cartao .ajuda')) fechaCartao(); return; }
    const ac = b.dataset.ac;
    Som.liga();
    if (ac === 'fecha') fechaCartao();
    else if (ac === 'compra') compra(b.dataset.id);
    else if (ac === 'bau') pegaBau();
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

  if (prog.dia !== hoje()) setTimeout(mostraBau, 700);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
