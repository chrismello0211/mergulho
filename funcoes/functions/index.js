'use strict';
/* Avisos do Mergulho (Firebase Cloud Functions, 2ª geração). Como publicar: LEIA-ME.md, na pasta funcoes. */
const { onValueWritten } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const L = require('./logica');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 2 });
const BANCO = 'mergulho-c6230-default-rtdb';
const FUSO = 'America/Sao_Paulo';
const ler = async caminho => (await admin.database().ref(caminho).get()).val();

/* manda pra todos os aparelhos da pessoa e tira da lista os endereços que morreram */
async function envia(uid, no, tipo, msg) {
  const lista = L.tokensDe(no);
  if (!lista.length) return 0;
  const r = await admin.messaging().sendEachForMulticast({
    tokens: lista.map(t => t.token),
    data: { tipo: tipo, titulo: msg.titulo, corpo: msg.corpo },
    webpush: { headers: { Urgency: 'high', TTL: String(6 * 3600) }, notification: { title: msg.titulo, body: msg.corpo, tag: tipo } }
  });
  await Promise.all(r.responses.map((x, i) => (!x.success && x.error && L.tokenMorto(x.error.code))
    ? admin.database().ref('/mergulho/avisos/' + uid + '/aparelhos/' + lista[i].chave).remove() : null));
  return r.successCount;
}

/* alguém pediu vida: avisa o resto do cardume */
exports.avisaPedidoDeVida = onValueWritten({ ref: '/mergulho/pedidos/{cardume}/{uid}', instance: BANCO }, async ev => {
  const antes = ev.data.before.val(), depois = ev.data.after.val();
  if (!L.gravacaoNova(antes, depois, Date.now())) return null;
  const avisos = (await ler('/mergulho/avisos')) || {};
  const msg = L.mensagem('pedidos', { nome: depois.nome });
  await Promise.all(L.quemAvisarDoPedido(avisos, ev.params.cardume, ev.params.uid).map(uid => envia(uid, avisos[uid], 'pedidos', msg)));
  return null;
});

/* alguém mandou vida: avisa quem recebeu */
exports.avisaVidaRecebida = onValueWritten({ ref: '/mergulho/presentes/{uid}/{de}', instance: BANCO }, async ev => {
  const antes = ev.data.before.val(), depois = ev.data.after.val();
  if (!L.gravacaoNova(antes, depois, Date.now())) return null;
  const no = await ler('/mergulho/avisos/' + ev.params.uid);
  if (!L.querTipo(no, 'recebida')) return null;
  await envia(ev.params.uid, no, 'recebida', L.mensagem('recebida', { nome: depois.nome }));
  return null;
});

/* a cada 10 minutos: quem ficou com as vidas cheias */
exports.avisaVidasCheias = onSchedule({ schedule: 'every 10 minutes', timeZone: FUSO }, async () => {
  const avisos = (await ler('/mergulho/avisos')) || {}, agora = Date.now();
  for (const uid of L.vidasParaAvisar(avisos, agora)) {
    await envia(uid, avisos[uid], 'vidas', L.mensagem('vidas'));
    await admin.database().ref('/mergulho/avisos/' + uid + '/avisadoVidas').set(avisos[uid].vidasCheiasEm);
  }
});

/* todo dia às 19h: lembrete do baú pra quem ainda não pegou */
exports.lembraBauDoDia = onSchedule({ schedule: '0 19 * * *', timeZone: FUSO }, async () => {
  const avisos = (await ler('/mergulho/avisos')) || {}, agora = Date.now(), dia = L.hojeBR(agora);
  for (const uid of L.bauParaAvisar(avisos, agora)) {
    await envia(uid, avisos[uid], 'bau', L.mensagem('bau'));
    await admin.database().ref('/mergulho/avisos/' + uid + '/avisadoBau').set(dia);
  }
});

/* sábado às 9h: começou o evento do fim de semana */
exports.avisaEventoDoFimDeSemana = onSchedule({ schedule: '0 9 * * 6', timeZone: FUSO }, async () => {
  const avisos = (await ler('/mergulho/avisos')) || {};
  const msg = L.mensagem('evento', { evento: L.eventoDaSemana(Date.now()) });
  for (const uid of Object.keys(avisos)) if (L.querTipo(avisos[uid], 'evento')) await envia(uid, avisos[uid], 'evento', msg);
});
