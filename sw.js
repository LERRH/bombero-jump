// Fire Jump: guarda las imágenes en el celular para que el juego abra rápido, gaste menos datos
// y el bombero no desaparezca cuando la señal es mala.
// - Imágenes (img/): se sirven desde el celular y se actualizan en segundo plano para la próxima vez.
// - Todo lo demás (la página, las preguntas): primero internet, para recibir las mejoras al instante;
//   sin señal, la última copia guardada.
const CACHE = 'firejump-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/img/')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(url.pathname);
      const net = fetch(req).then(r => { if (r.ok) c.put(url.pathname, r.clone()); return r; });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
    return;
  }
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
