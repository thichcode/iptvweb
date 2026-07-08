const EXTERNAL_PRIMARY = 'https://ophim1.com'
const EXTERNAL_FALLBACK = 'https://phimapi.com'
const API_SOURCE_KEY = 'wp_api_primary'
export const API_SOURCES = ['proxy', 'ophim', 'phimapi']
const DEFAULT_PROXY_BASE = typeof location !== 'undefined' && location.protocol === 'https:' && location.hostname === 'localhost'
  ? 'https://iptvweb-phim.vercel.app/api/proxy'
  : '/api/proxy'
const PROXY_BASE = import.meta.env?.VITE_API_PROXY || DEFAULT_PROXY_BASE
export const API_BASE = import.meta.env?.VITE_API_BASE || PROXY_BASE
export const FALLBACK_API_BASE = ''
export const IMAGE_BASE = import.meta.env?.VITE_IMAGE_BASE || 'https://img.ophim.live/uploads/movies'
const MAX_RETRIES = 2
const TIMEOUT_MS = 15000
const MOBILE_LIMIT = 5
const DEFAULT_LIMIT = 20

export function getApiSource() {
  try {
    const source = localStorage.getItem(API_SOURCE_KEY)
    return API_SOURCES.includes(source) ? source : 'proxy'
  } catch { return 'proxy' }
}

export function setApiSource(source) {
  if (!API_SOURCES.includes(source)) return
  try { localStorage.setItem(API_SOURCE_KEY, source) } catch {}
}

export function nextApiSource() {
  const current = getApiSource()
  return API_SOURCES[(API_SOURCES.indexOf(current) + 1) % API_SOURCES.length]
}

function apiTargetsForSource(source = getApiSource()) {
  const proxy = { key: 'proxy', base: API_BASE, proxy: true }
  const ophim = { key: 'ophim', base: EXTERNAL_PRIMARY }
  const phimapi = { key: 'phimapi', base: EXTERNAL_FALLBACK }
  if (source === 'ophim') return [ophim, phimapi, proxy]
  if (source === 'phimapi') return [phimapi, ophim, proxy]
  return [proxy, ophim, phimapi]
}

function targetUrl(target, url) {
  return target.proxy ? target.base + '?path=' + encodeURIComponent(url) : target.base + url
}

export async function apiGet(url, retries = MAX_RETRIES) {
  for (const target of apiTargetsForSource()) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
        const res = await fetch(targetUrl(target, url), { signal: ctrl.signal, cache: 'no-cache' })
        clearTimeout(timer)
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      } catch {
        if (attempt < retries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
      }
    }
  }
}

export async function checkApiHealth(source = getApiSource()) {
  const target = apiTargetsForSource(source)[0]
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(targetUrl(target, '/danh-sach/phim-moi-cap-nhat?page=1&limit=1'), { signal: ctrl.signal, cache: 'no-cache' })
    clearTimeout(timer)
    return res.ok
  } catch { return false }
}

export function imgSrc(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('upload/')) return 'https://phimimg.com/' + url
  return IMAGE_BASE.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
}

export function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches
}

export function getMovieLimit(isMobile = isMobileViewport()) {
  return isMobile ? MOBILE_LIMIT : DEFAULT_LIMIT
}

const SORT = '&sort_field=year&sort_type=desc'

export function buildMovieUrl(type, page = 1, keyword = '', category = '', country = '', limit = getMovieLimit()) {
  if (keyword) {
    return `/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}${SORT}`
  }
  if (category) {
    return `/v1/api/the-loai/${encodeURIComponent(category)}?page=${page}&limit=${limit}${SORT}`
  }
  if (country) {
    return `/v1/api/quoc-gia/${encodeURIComponent(country)}?page=${page}&limit=${limit}${SORT}`
  }
  if (type === 'phim-moi-cap-nhat') {
    return `/danh-sach/phim-moi-cap-nhat?page=${page}&limit=${limit}`
  }
  return `/v1/api/danh-sach/${type}?page=${page}&limit=${limit}${SORT}`
}

export function fetchMovies(type, page = 1, keyword = '', category = '', country = '', limit = getMovieLimit()) {
  return apiGet(buildMovieUrl(type, page, keyword, category, country, limit))
}

export function fetchDetail(slug) {
  return apiGet('/phim/' + slug)
}

export function fetchCategories() {
  return apiGet('/the-loai')
}

export function fetchCountries() {
  return apiGet('/quoc-gia')
}
