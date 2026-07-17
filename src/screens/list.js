import { $, $$, imgSrc, switchScreen, sanitize, sanitizeAttr } from '../utils.js'
import { fetchMovies, fetchCategories, fetchCountries, getMovieLimit, isMobileViewport } from '../api.js'
import { store, getFavs, getHist } from '../store.js'

function renderSkeletonList(count = 6) {
  let html = '<div class="local-list">'
  for (let i = 0; i < count; i++) {
    html += `<div class="local-item" style="border-color:transparent;cursor:default">
      <div class="skeleton" style="width:60px;height:84px;border-radius:4px;flex-shrink:0"></div>
      <div class="info" style="flex:1">
        <div class="skeleton skeleton-line" style="height:15px;width:65%;margin-bottom:8px"></div>
        <div class="skeleton skeleton-line" style="height:12px;width:40%"></div>
      </div>
    </div>`
  }
  html += '</div>'
  return html
}


export function renderEmptyState(title = 'Chưa có phim', hint = 'Thử chọn mục khác hoặc quay lại sau.') {
  return `<div class="empty-state"><div class="empty-title">${sanitize(title)}</div><div class="empty-hint">${sanitize(hint)}</div></div>`
}

export function renderMovieCard(m) {
  const title = m.name || ''
  const thumb = imgSrc(m.thumb_url || m.poster_url || m.thumb || m.poster)
  const meta = [m.year, m.origin_name || m.origin].filter(Boolean).join(' • ')
  return `<div class="local-item movie-card" data-slug="${sanitizeAttr(m.slug || '')}"><img class="thumb" src="${thumb}" alt="${sanitizeAttr(title)}" loading="lazy" onerror="this.style.display='none'"><div class="info"><div class="title">${sanitize(title)}</div><div class="meta">${sanitize(meta)}</div></div></div>`
}

export function renderMovieList(items, page, totalPages, type) {
  const container = $('#screen-list')
  if (!items.length) { container.innerHTML = renderEmptyState(); return }
  let html = '<div class="local-list movie-grid">'
  for (const m of items) html += renderMovieCard(m)
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

export function limitRenderedItems(items, isMobile = isMobileViewport()) {
  return isMobile ? items.slice(0, getMovieLimit(true)) : items
}

export function renderSubList(items, type) {
  const container = $('#screen-list')
  if (!items.length) { container.innerHTML = '<div class="empty">Trống</div>'; return }
  container.innerHTML = '<div class="sub-list">' +
    items.map(i => `<div class="sub-item" data-slug="${sanitizeAttr(i.slug || '')}">${sanitize(i.name || '')}</div>`).join('') +
    '</div>'
  store.listType = type
  store.listItems = items
}

export function renderSearchInput(keyword = '') {
  const container = $('#screen-list')
  container.innerHTML = `<div class="search-wrap">
    <input class="search-input" type="text" placeholder="Nhập tên phim..." value="${sanitizeAttr(keyword)}" autofocus>
    <button class="search-btn">Tìm</button>
  </div>`
}

export function renderLocalList(items, title) {
  const container = $('#screen-list')
  let html = '<div class="local-list movie-grid">'
  if (!items.length) { container.innerHTML = renderEmptyState('Danh sách trống', 'Phim đã xem hoặc yêu thích sẽ hiện ở đây.'); return }
  for (const m of items) html += renderMovieCard(m)
  html += '</div>'
  container.innerHTML = html
  store.listItems = items
  store.listType = title
}

export async function loadMovieList(type, page, keyword, category, country) {
  store.searchMode = false
  const container = $('#screen-list')
  const limit = getMovieLimit()
  container.innerHTML = renderSkeletonList(limit)
  switchScreen('list')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  store.listType = type
  try {
    const data = await fetchMovies(type, page, keyword, category, country, limit)
    if (store.screen !== 'list') return
    const items = data.items || (data.data && data.data.items) || []
    const pagination = data.pagination || (data.data && data.data.params && data.data.params.pagination) || {}
    renderMovieList(limitRenderedItems(items), pagination.currentPage || page, pagination.totalPages || 1, type)
  } catch (err) {
    console.error(err)
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Không kết nối được</div>
      <div class="error-hint">Vui lòng kiểm tra kết nối mạng và thử lại</div>
      <button class="retry-btn" onclick="window.location.reload()">Thử lại</button>
    </div>`
  }
}

function renderSkeletonSubList() {
  let html = '<div class="sub-list">'
  for (let i = 0; i < 10; i++) {
    html += `<div class="sub-item" style="border-color:transparent;cursor:default"><div class="skeleton" style="height:16px;width:${60 + Math.random() * 30}%"></div></div>`
  }
  html += '</div>'
  return html
}

export async function loadCategories() {
  const container = $('#screen-list')
  container.innerHTML = renderSkeletonSubList()
  switchScreen('list')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  try {
    const data = await fetchCategories()
    if (store.screen !== 'list') return
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'category')
  } catch (err) {
    console.error(err)
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Không thể tải</div>
      <div class="error-hint">Vui lòng kiểm tra kết nối mạng và thử lại</div>
      <button class="retry-btn" onclick="window.location.reload()">Thử lại</button>
    </div>`
  }
}

export async function loadCountries() {
  const container = $('#screen-list')
  container.innerHTML = renderSkeletonSubList()
  switchScreen('list')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  try {
    const data = await fetchCountries()
    if (store.screen !== 'list') return
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'country')
  } catch (err) {
    console.error(err)
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Không thể tải</div>
      <div class="error-hint">Vui lòng kiểm tra kết nối mạng và thử lại</div>
      <button class="retry-btn" onclick="window.location.reload()">Thử lại</button>
    </div>`
  }
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

export function handleListClick(e) {
  const item = e.target.closest('.page-btn, .sub-item, .local-item')
  if (!item) return null
  if (item.classList.contains('local-item')) {
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
