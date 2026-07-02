const BASE = import.meta.env.VITE_API_BASE || 'https://phimapi.com'
const MAX_RETRIES = 2
const TIMEOUT_MS = 15000

export async function apiGet(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      const res = await fetch(BASE + url, { signal: ctrl.signal, cache: 'no-cache' })
      clearTimeout(timer)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json()
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
    }
  }
}

export function imgSrc(url) {
  if (!url) return ''
  return BASE + '/image.php?url=' + encodeURIComponent(url)
}

export function fetchMovies(type, page = 1, keyword = '', category = '', country = '') {
  let url = ''
  if (keyword) {
    url = `/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=20`
  } else if (category) {
    url = `/v1/api/the-loai/${encodeURIComponent(category)}?page=${page}&limit=20`
  } else if (country) {
    url = `/v1/api/quoc-gia/${encodeURIComponent(country)}?page=${page}&limit=20`
  } else if (type === 'phim-moi-cap-nhat') {
    url = `/danh-sach/phim-moi-cap-nhat?page=${page}`
  } else {
    url = `/v1/api/danh-sach/${type}?page=${page}&limit=20`
  }
  return apiGet(url)
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
