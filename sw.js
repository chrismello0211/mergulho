/* Mergulho: service worker
   Troque VERSAO a cada publicação: o cache velho é apagado sozinho. */
const VERSAO = 'v2026.11.14';
const CACHE = 'mergulho-' + VERSAO;

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-maskable-512.png'
];

/* instala: guarda tudo e assume o comando na hora */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

/* ativa: varre os caches antigos */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n.startsWith('mergulho-') && n !== CACHE)
             .map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* fontes do Google: usa o que está guardado e atualiza por baixo */
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(
      caches.open(CACHE + '-fontes').then(async c => {
        const guardado = await c.match(req);
        const rede = fetch(req).then(r => {
          if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
          return r;
        }).catch(() => guardado);
        return guardado || rede;
      })
    );
    return;
  }

  /* fora do escopo: deixa passar direto */
  if (url.origin !== self.location.origin) return;

  /* navegação: rede primeiro (pra pegar versão nova), cache se estiver sem sinal */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copia));
          return r;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  /* resto: cache primeiro */
  e.respondWith(
    caches.match(req).then(guardado => guardado || fetch(req).then(r => {
      if (r && r.ok && r.type === 'basic') {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return r;
    }).catch(() => guardado))
  );
});

/* permite forçar a atualização a partir da página */
self.addEventListener('message', e => {
  if (e.data === 'atualiza-agora') self.skipWaiting();
});
