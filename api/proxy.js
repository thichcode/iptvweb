const PRIMARY = 'https://ophim1.com'
const FALLBACK = 'https://phimapi.com'
const TIMEOUT = 12000
const CACHE_TTL = 5 * 60 * 1000

const cache = new Map()

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'WebPhim/1.0' } })
    clearTimeout(timer)
    return res
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const path = url.searchParams.get('path') || '/'
  const cacheKey = path

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json(cached.data)
  }

  for (const base of [PRIMARY, FALLBACK]) {
    try {
      const r = await fetchWithTimeout(base + path, TIMEOUT)
      if (!r.ok) continue
      const data = await r.json()
      cache.set(cacheKey, { data, ts: Date.now() })
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('X-Cache', 'MISS')
      return res.status(200).json(data)
    } catch {}
  }

  if (cached) {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('X-Cache', 'STALE')
    return res.status(200).json(cached.data)
  }

  res.status(502).json({ error: 'All APIs unavailable' })
}

export const config = { maxDuration: 15 }
