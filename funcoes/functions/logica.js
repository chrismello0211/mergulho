'use strict';
/* Regras dos avisos do Mergulho, sem nada de Firebase: dá pra testar com `npm test`. */
const DIA = 864e5, MIN = 6e4;
/* dia de hoje no Brasil (o jogo usa a data local; o Brasil não tem mais horário de verão: UTC-3) */
const hojeBR = agora => new Date(agora - 3 * 3600e3).toISOString().slice(0, 10);
const querTipo = (no, tipo) => !!no && !(no.perfil && no.perfil.tipos && no.perfil.tipos[tipo] === false);
const tokensDe = no => Object.entries((no && no.aparelhos) || {}).filter(([, v]) => v && v.token).map(([chave, v]) => ({ chave, token: v.token }));
/* um pedido (ou presente) gravado agora, não uma regravação antiga; e no máximo um aviso a cada 30 min pelo mesmo pedido */
function gravacaoNova(antes, depois, agora) {
  if (!depois || !depois.quando) return false;
  if (agora - depois.quando > 15 * MIN) return false;
  if (antes && antes.quando && depois.quando - antes.quando < 30 * MIN) return false;
  return true;
}
function quemAvisarDoPedido(avisos, cardume, de) {
  return Object.keys(avisos || {}).filter(uid => uid !== de && querTipo(avisos[uid], 'pedidos') &&
    avisos[uid].perfil && avisos[uid].perfil.cardume === cardume && tokensDe(avisos[uid]).length > 0);
}
/* vidas que encheram e ainda não foram avisadas (não avisa o que encheu há mais de 6 horas) */
function vidasParaAvisar(avisos, agora) {
  return Object.keys(avisos || {}).filter(uid => {
    const n = avisos[uid] || {};
    return querTipo(n, 'vidas') && n.vidasCheiasEm > 0 && n.vidasCheiasEm <= agora && agora - n.vidasCheiasEm < 6 * 3600e3 &&
      n.avisadoVidas !== n.vidasCheiasEm && tokensDe(n).length > 0;
  });
}
function bauParaAvisar(avisos, agora) {
  const d = hojeBR(agora);
  return Object.keys(avisos || {}).filter(uid => { const n = avisos[uid] || {};
    return querTipo(n, 'bau') && n.bauDia !== d && n.avisadoBau !== d && tokensDe(n).length > 0; });
}
const EVENTOS = { moedas: 'Chuva de moedas', peixe: 'Fim de semana do peixe-guia', dobro: 'Especiais em dobro' };
/* a mesma conta do jogo (m1.js, eventoHoje) */
const eventoDaSemana = agora => ['moedas', 'peixe', 'dobro'][Math.floor((agora / DIA + 3) / 7) % 3];
function mensagem(tipo, d) {
  d = d || {};
  if (tipo === 'pedidos') return { titulo: '❤ ' + (d.nome || 'Alguém do cardume') + ' pediu vida', corpo: 'Abra o jogo e mande uma pro seu cardume.' };
  if (tipo === 'recebida') return { titulo: '🎁 ' + (d.nome || 'Alguém') + ' te mandou uma vida', corpo: 'Ela já está esperando no jogo.' };
  if (tipo === 'vidas') return { titulo: '❤ Suas vidas estão cheias', corpo: 'Cinco vidas prontas pra mergulhar.' };
  if (tipo === 'bau') return { titulo: '🎁 Seu baú do dia está esperando', corpo: 'Pegue antes da meia-noite pra não perder a sequência.' };
  if (tipo === 'evento') return { titulo: '🎉 Começou o evento: ' + (EVENTOS[d.evento] || 'fim de semana'), corpo: 'Vale até domingo à noite.' };
  return { titulo: 'Mergulho', corpo: '' };
}
/* endereço que não existe mais (desinstalou, limpou dados, trocou de celular): sai da lista */
const tokenMorto = codigo => ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(codigo);
module.exports = { hojeBR, querTipo, tokensDe, gravacaoNova, quemAvisarDoPedido, vidasParaAvisar, bauParaAvisar, eventoDaSemana, mensagem, tokenMorto, EVENTOS };
