const CACHE = 'webphim-v1'
const API_HOSTS = ['ophim1.com', 'phimapi.com']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.add('/').catch(() => {})
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.clients.claim()
    const keys = await caches.keys()
    await Promise.all(keys.map(k => { if (k !== CACHE) return caches.delete(k) }))
  })())
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.protocol.startsWith('chrome')) return
  if (url.hostname === 'phimimg.com') {
    e.respondWith(cacheFirst(e.request))
    return
  }
  if (API_HOSTS.includes(url.hostname)) {
    e.respondWith(networkFirst(e.request))
    return
  }
  if (url.origin !== location.origin) return
  if (url.pathname === '/sw.js') return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname === '/' || e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request))
    return
  }
  e.respondWith(cacheFirst(e.request))
})

async function cacheFirst(req) {
  const cached = await caches.match(req)
  if (cached) return cached
  try {
    const res = await fetch(req)
    if (res.ok) {
      caches.open(CACHE).then(c => c.put(req, res.clone()))
    }
    return res
  } catch { return new Response('Offline', { status: 503 }) }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req)
    if (res.ok) {
      caches.open(CACHE).then(c => c.put(req, res.clone()))
    }
    return res
  } catch {
    const cached = await caches.match(req)
    return cached || new Response('Offline', { status: 503 })
  }
}
