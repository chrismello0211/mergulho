'use strict';
/* Testa as regras e as funções de verdade, com o Firebase simulado (não precisa de internet nem de npm install). */
const assert = require('assert'), Module = require('module');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; };
const L = require('./logica');
const AGORA = Date.UTC(2026, 9, 24, 15, 0);       /* sábado 24/10/2026, 12h em Brasília */
const MIN = 6e4;
/* ── regras ── */
ok(L.hojeBR(Date.UTC(2026, 9, 24, 2, 0)) === '2026-10-23', 'às 23h de Brasília ainda é o dia anterior');
ok(L.gravacaoNova(null, { quando: AGORA - MIN }, AGORA), 'pedido novo avisa');
ok(!L.gravacaoNova(null, { quando: AGORA - 20 * MIN }, AGORA), 'gravação velha (sincronização) não avisa');
ok(!L.gravacaoNova({ quando: AGORA - 10 * MIN }, { quando: AGORA }, AGORA), 'repetir o pedido em menos de 30 min não avisa de novo');
ok(L.gravacaoNova({ quando: AGORA - 40 * MIN }, { quando: AGORA }, AGORA), 'pedido de novo depois de 40 min avisa');
ok(!L.gravacaoNova({ quando: AGORA }, null, AGORA), 'apagar (pegou a vida) não avisa');
const tk = t => ({ aparelhos: { a1: { token: t } } });
const AVISOS = {
  rafa:  Object.assign(tk('T-rafa'),  { perfil: { cardume: 'PEIX', tipos: {} } }),
  lais:  Object.assign(tk('T-lais'),  { perfil: { cardume: 'PEIX', tipos: {} }, vidasCheiasEm: AGORA - 5 * MIN, bauDia: '2026-10-23' }),
  chris: Object.assign(tk('T-chris'), { perfil: { cardume: 'PEIX', tipos: { pedidos: false } }, vidasCheiasEm: AGORA + 30 * MIN, bauDia: '2026-10-24' }),
  outro: Object.assign(tk('T-outro'), { perfil: { cardume: 'OUTRO', tipos: {} }, vidasCheiasEm: AGORA - 8 * 3600e3 }),
  semtk: { perfil: { cardume: 'PEIX', tipos: {} } }
};
ok(JSON.stringify(L.quemAvisarDoPedido(AVISOS, 'PEIX', 'rafa')) === '["lais"]', 'pedido do Rafa: só a Laís (Chris desligou pedidos; outro cardume e quem não tem aparelho, não)');
ok(JSON.stringify(L.vidasParaAvisar(AVISOS, AGORA)) === '["lais"]', 'vidas: só quem já encheu, há menos de 6 h');
ok(L.vidasParaAvisar(Object.assign({}, AVISOS, { lais: Object.assign({}, AVISOS.lais, { avisadoVidas: AVISOS.lais.vidasCheiasEm }) }), AGORA).length === 0, 'vidas: não avisa duas vezes');
ok(JSON.stringify(L.bauParaAvisar(AVISOS, AGORA).sort()) === '["lais","outro","rafa"]', 'baú: quem não pegou hoje (Chris já pegou)');
const jogo = agora => ['moedas', 'peixe', 'dobro'][Math.floor((agora / 864e5 + 3) / 7) % 3];   /* m1.js, eventoHoje */
for (let d = 0; d < 60; d++) ok(L.eventoDaSemana(AGORA + d * 864e5) === jogo(AGORA + d * 864e5), 'evento igual ao do jogo');
ok(L.eventoDaSemana(AGORA) === L.eventoDaSemana(AGORA + 864e5), 'sábado e domingo têm o mesmo evento');
ok(L.mensagem('pedidos', { nome: 'Rafa' }).titulo === '❤ Rafa pediu vida', 'texto do pedido');
/* ── funções de verdade, com Firebase simulado ── */
const banco = JSON.parse(JSON.stringify({ mergulho: { avisos: AVISOS } }));
banco.mergulho.avisos.lais.aparelhos.a2 = { token: 'MORTO' };
const pega = c => c.split('/').filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), banco);
const grava = (c, v) => { const p = c.split('/').filter(Boolean), u = p.pop(); const o = p.reduce((o, k) => (o[k] = o[k] || {}), banco); if (v === null) delete o[u]; else o[u] = v; };
const enviados = [];
const admin = {
  initializeApp() {},
  database: () => ({ ref: c => ({ get: async () => ({ val: () => JSON.parse(JSON.stringify(pega(c) === undefined ? null : pega(c))) }),
                                   set: async v => grava(c, v), remove: async () => grava(c, null) }) }),
  messaging: () => ({ sendEachForMulticast: async m => { enviados.push(m);
    const responses = m.tokens.map(t => t === 'MORTO' ? { success: false, error: { code: 'messaging/registration-token-not-registered' } } : { success: true });
    return { successCount: responses.filter(r => r.success).length, responses }; } })
};
const carrega = Module._load;
Module._load = function (pedido) {
  if (pedido === 'firebase-functions/v2/database') return { onValueWritten: (o, f) => ({ o, f }) };
  if (pedido === 'firebase-functions/v2/scheduler') return { onSchedule: (o, f) => ({ o, f }) };
  if (pedido === 'firebase-functions/v2') return { setGlobalOptions() {} };
  if (pedido === 'firebase-admin') return admin;
  return carrega.apply(this, arguments);
};
const F = require('./index.js');
const relogio = Date.now; Date.now = () => AGORA;
const evento = (params, antes, depois) => ({ params, data: { before: { val: () => antes }, after: { val: () => depois } } });
(async () => {
  ok(F.avisaPedidoDeVida.o.ref === '/mergulho/pedidos/{cardume}/{uid}' && F.avisaPedidoDeVida.o.instance === 'mergulho-c6230-default-rtdb', 'gatilho no caminho certo do banco');
  await F.avisaPedidoDeVida.f(evento({ cardume: 'PEIX', uid: 'rafa' }, null, { nome: 'Rafa', quando: AGORA - MIN }));
  ok(enviados.length === 1 && JSON.stringify(enviados[0].tokens) === '["T-lais","MORTO"]', 'pedido do Rafa foi pros aparelhos da Laís');
  ok(enviados[0].webpush.notification.title === '❤ Rafa pediu vida' && enviados[0].data.tipo === 'pedidos', 'com o texto certo');
  ok(!pega('/mergulho/avisos/lais/aparelhos/a2') && pega('/mergulho/avisos/lais/aparelhos/a1'), 'endereço morto saiu da lista, o bom ficou');
  await F.avisaPedidoDeVida.f(evento({ cardume: 'PEIX', uid: 'rafa' }, { quando: AGORA - MIN }, { nome: 'Rafa', quando: AGORA }));
  ok(enviados.length === 1, 'pedido repetido em seguida não avisa de novo');
  await F.avisaVidaRecebida.f(evento({ uid: 'chris', de: 'lais' }, null, { nome: 'Laís', quando: AGORA }));
  ok(enviados.length === 2 && enviados[1].tokens[0] === 'T-chris' && enviados[1].data.titulo === '🎁 Laís te mandou uma vida', 'vida recebida avisa quem recebeu');
  await F.avisaVidasCheias.f();
  ok(enviados.length === 3 && enviados[2].tokens[0] === 'T-lais' && pega('/mergulho/avisos/lais/avisadoVidas') === AVISOS.lais.vidasCheiasEm, 'vidas cheias: avisou a Laís e marcou');
  await F.avisaVidasCheias.f();
  ok(enviados.length === 3, 'vidas cheias: na rodada seguinte não repete');
  await F.lembraBauDoDia.f();
  ok(enviados.length === 6 && !enviados.slice(3).some(m => m.tokens[0] === 'T-chris'), 'baú: avisou os 3 que não pegaram, não a Chris');
  await F.lembraBauDoDia.f();
  ok(enviados.length === 6, 'baú: uma vez por dia');
  await F.avisaEventoDoFimDeSemana.f();
  ok(enviados.length === 10 && enviados[9].data.titulo.startsWith('🎉 Começou o evento: '), 'evento: todo mundo com aparelho');
  Date.now = relogio;
  console.log(n + ' verificações, todas certas');
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
