const EXTERNAL_PRIMARY = 'https://ophim1.com'
const EXTERNAL_FALLBACK = 'https://phimapi.com'
const PROXY_BASE = '/api/proxy'
export const API_BASE = import.meta.env?.VITE_API_BASE || PROXY_BASE
export const FALLBACK_API_BASE = ''
export const IMAGE_BASE = import.meta.env?.VITE_IMAGE_BASE || 'https://img.ophim.live/uploads/movies'
const MAX_RETRIES = 2
const TIMEOUT_MS = 15000
const MOBILE_LIMIT = 5
const DEFAULT_LIMIT = 20

export async function apiGet(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      const res = await fetch(PROXY_BASE + '?path=' + encodeURIComponent(url), { signal: ctrl.signal, cache: 'no-cache' })
      clearTimeout(timer)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    } catch {
      if (attempt < retries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
    }
  }
  for (const base of [EXTERNAL_PRIMARY, EXTERNAL_FALLBACK]) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      const res = await fetch(base + url, { signal: ctrl.signal, cache: 'no-cache' })
      clearTimeout(timer)
      if (!res.ok) continue
      return res.json()
    } catch {}
  }
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
