import { $, $$, imgSrc } from '../utils.js'
import { fetchMovies, fetchCategories, fetchCountries } from '../api.js'
import { store, getFavs, getHist, isFav } from '../store.js'

export function renderMovieList(items, page, totalPages, type) {
  const container = $('#screen-list')
  const hist = getHist()
  let html = '<div class="movie-list">'
  for (const m of items) {
    const thumb = imgSrc(m.thumb_url || m.poster_url)
    const meta = [m.year, m.origin_name].filter(Boolean).join(' • ')
    const h = hist[m.slug]
    const epLabel = h && h.episode ? ' | ' + h.episode : ''
    const fav = isFav(m.slug) ? '<span style="color:#ffd600;margin-left:6px">♥</span>' : ''
    html += `<div class="movie-item" data-slug="${m.slug || ''}">`
    html += `<img class="thumb" src="${thumb}" alt="" loading="lazy" onerror="this.style.display='none'">`
    html += `<div class="info"><div class="title">${m.name || ''}${fav}</div>`
    html += `<div class="meta">${meta}${epLabel}</div></div></div>`
  }
  html += '</div>'
  if (totalPages > 1) {
    html += '<div class="pagination">'
    if (page > 1) html += `<div class="page-btn" data-page="${page - 1}">← Trang trước</div>`
    html += `<span class="page-info">Trang ${page} / ${totalPages}</span>`
    if (page < totalPages) html += `<div class="page-btn" data-page="${page + 1}">Trang sau →</div>`
    html += '</div>'
  }
  container.innerHTML = html
  store.listItems = items
  store.listPage = page
  store.listTotalPages = totalPages
  store.listType = type
}

export function renderSubList(items, type) {
  const container = $('#screen-list')
  container.innerHTML = '<div class="sub-list">' +
    items.map(i => `<div class="sub-item" data-slug="${i.slug || ''}">${i.name || ''}</div>`).join('') +
    '</div>'
  store.listType = type
  store.listItems = items
}

export function renderSearchInput(keyword = '') {
  const container = $('#screen-list')
  container.innerHTML = `<div class="search-wrap">
    <input class="search-input" type="text" placeholder="Nhập tên phim..." value="${keyword}" autofocus>
    <button class="search-btn">Tìm</button>
  </div>`
}

export function renderLocalList(items, title) {
  const container = $('#screen-list')
  let html = '<div class="movie-list">'
  if (!items.length) { html += '<div class="empty">Trống</div>' }
  for (const m of items) {
    const thumb = imgSrc(m.thumb)
    const meta = [m.year, m.origin, m.episode].filter(Boolean).join(' • ')
    html += `<div class="movie-item" data-slug="${m.slug || ''}">`
    html += `<img class="thumb" src="${thumb}" alt="" loading="lazy" onerror="this.style.display='none'">`
    html += `<div class="info"><div class="title">${m.name || ''}</div>`
    html += `<div class="meta">${meta}</div></div></div>`
  }
  html += '</div>'
  container.innerHTML = html
  store.listItems = items
  store.listType = title
}

export async function loadMovieList(type, page, keyword, category, country) {
  store.searchMode = false
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('list')
  store.listType = type
  try {
    const data = await fetchMovies(type, page, keyword, category, country)
    const items = data.items || (data.data && data.data.items) || []
    const pagination = data.pagination || (data.data && data.data.params && data.data.params.pagination) || {}
    renderMovieList(items, pagination.currentPage || page, pagination.totalPages || 1, type)
  } catch {
    container.innerHTML = '<div class="empty">Lỗi kết nối</div>'
  }
}

export async function loadCategories() {
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('list')
  try {
    const data = await fetchCategories()
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'category')
  } catch { container.innerHTML = '<div class="empty">Không thể tải</div>' }
}

export async function loadCountries() {
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('list')
  try {
    const data = await fetchCountries()
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'country')
  } catch { container.innerHTML = '<div class="empty">Không thể tải</div>' }
}

export function loadFavorites() {
  const f = getFavs()
  const items = Object.entries(f).map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin, episode: '' }))
  renderLocalList(items, '♥ Yêu Thích')
}

export function loadHistory() {
  const h = getHist()
  const items = Object.entries(h)
    .sort((a, b) => (b[1].at || 0) - (a[1].at || 0))
    .map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin, episode: v.episode || '' }))
  renderLocalList(items, 'Đã Xem')
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'))
  const el = $('#screen-' + id)
  if (el) el.classList.add('active')
  store.screen = id
}

export function handleListClick(e) {
  const item = e.target.closest('.movie-item, .page-btn, .sub-item')
  if (!item) return null
  if (item.classList.contains('movie-item')) {
    return { action: 'detail', slug: item.dataset.slug }
  }
  if (item.classList.contains('page-btn')) {
    const page = parseInt(item.dataset.page)
    if (!isNaN(page)) return { action: 'page', page, type: store.listType }
  }
  if (item.classList.contains('sub-item')) {
    return { action: 'subSelect', slug: item.dataset.slug, type: store.listType }
  }
  return null
}
