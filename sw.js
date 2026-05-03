/* Service Worker para Pedido MAXIFER
 * Cachea SOLO los recursos de pedido.html. El resto del sitio pasa directo.
 */
const CACHE = 'maxifer-pedido-v11';
const APP_PATHS = ['/pedido.html', '/productos.json', '/manifest.webmanifest',
                   '/img/favicon-192.png', '/img/favicon-512.png', '/img/favicon-32.png',
                   '/favicon.ico'];
// Para HTML usamos network-first (siempre version fresca si hay red).
// Para JSON e imagenes usamos stale-while-revalidate (rapido + actualiza en bg).
const NETWORK_FIRST = ['/pedido.html'];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE).then(cache =>
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
    if (!APP_PATHS.includes(url.pathname)) return;

    if (NETWORK_FIRST.includes(url.pathname)){
        // Network-first: pedimos a la red, si falla usamos cache
        e.respondWith(
            fetch(req).then(r => {
                if (r && r.ok){
                    const copy = r.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                }
                return r;
            }).catch(() => caches.match(req))
        );
        return;
    }

    // Stale-while-revalidate para los demas
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
