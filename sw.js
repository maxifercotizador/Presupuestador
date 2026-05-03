/* Service Worker para Pedido MAXIFER
 * Cachea SOLO los recursos de pedido.html. El resto del sitio pasa directo.
 */
const CACHE = 'maxifer-pedido-v3';
const APP_PATHS = ['/pedido.html', '/productos.json', '/manifest.webmanifest',
                   '/img/favicon-192.png', '/img/favicon-512.png', '/img/favicon-32.png',
                   '/favicon.ico'];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE).then(cache =>
            // Best-effort: no tirar el install si alguno falla
            Promise.all(APP_PATHS.map(p => cache.add(p).catch(() => null)))
        )
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;
    let url;
    try { url = new URL(req.url); } catch(_) { return; }
    if (url.origin !== self.location.origin) return;

    // Solo interceptamos rutas conocidas de la app — el resto del sitio
    // (listas.html, compras.html, etc.) pasa directo a la red.
    if (!APP_PATHS.includes(url.pathname)) return;

    // Stale-while-revalidate
    e.respondWith(
        caches.open(CACHE).then(cache =>
            cache.match(req).then(cached => {
                const networked = fetch(req).then(r => {
                    if (r && r.ok) cache.put(req, r.clone());
                    return r;
                }).catch(() => cached);
                return cached || networked;
            })
        )
    );
});
