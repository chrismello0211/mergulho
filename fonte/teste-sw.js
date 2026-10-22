/* o service worker mostra o aviso e, ao tocar, abre (ou traz pra frente) o jogo */
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const h = {}, mostradas = []; let aberta = null, focada = false, clientes = [];
const self = { addEventListener: (t, f) => (h[t] = f), skipWaiting() {}, location: { origin: 'https://exemplo' },
  registration: { showNotification: async (t, o) => mostradas.push([t, o]) },
  clients: { claim: async () => {}, matchAll: async () => clientes, openWindow: async u => { aberta = u; } } };
vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), { self, caches: { open: async () => ({}), keys: async () => [], match: async () => null }, fetch: async () => ({}), console, URL, Promise });
const roda = (tipo, ev) => new Promise(r => { ev.waitUntil = p => Promise.resolve(p).then(r); h[tipo](ev); });
(async () => {
  await roda('push', { data: { json: () => ({ notification: { title: '❤ Rafa pediu vida', body: 'Abra o jogo' }, data: { tipo: 'pedidos' } }) } });
  assert.deepStrictEqual([mostradas[0][0], mostradas[0][1].body, mostradas[0][1].tag], ['❤ Rafa pediu vida', 'Abra o jogo', 'pedidos']);
  await roda('push', { data: { json: () => ({ data: { titulo: 'Só dados', corpo: 'ok', tipo: 'vidas' } }) } });
  assert.strictEqual(mostradas[1][0], 'Só dados');
  await roda('push', { data: { json: () => { throw new Error('não é json'); }, text: () => 'texto puro' } });
  assert.deepStrictEqual([mostradas[2][0], mostradas[2][1].body], ['Mergulho', 'texto puro']);
  await roda('notificationclick', { notification: { close() {}, data: { url: './' } } });
  assert.strictEqual(aberta, './');
  clientes = [{ focus: async () => { focada = true; } }]; aberta = null;
  await roda('notificationclick', { notification: { close() {}, data: { url: './' } } });
  assert.ok(focada && aberta === null);
  console.log('service worker: 3 formatos de aviso mostrados certo; tocar abre o jogo ou traz o que já está aberto');
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
