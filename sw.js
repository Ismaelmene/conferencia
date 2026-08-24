/* Service Worker do AuditaBoi
   Guarda o app (e as bibliotecas que ele usa) no navegador, pra abrir
   e continuar funcionando mesmo sem internet. Estratégia: tenta buscar
   na rede primeiro (pra sempre pegar a versão mais nova quando tem
   sinal); se não conseguir, usa o que já tem guardado. */

const CACHE_NAME = 'auditaboi-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './logo-aimex.jpg',
  './som-abertura.mp3',
  'https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;900&family=Archivo+Expanded:wght@700;900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(()=>{
          // se algum CDN falhar no primeiro carregamento, não trava a instalação inteira
        }))
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // não intercepta chamadas do Firestore/Auth (POST, WebSocket, etc.) — só arquivos estáticos (GET)
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => cached || caches.match('./index.html'))
      )
  );
});
