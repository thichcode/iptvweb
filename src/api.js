const BASE = 'https://phimapi.com'

export async function apiGet(url) {
  const res = await fetch(BASE + url)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
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
