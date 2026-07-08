import { $, $$, imgSrc, sanitize, sanitizeAttr, store } from '../utils.js'
import { fetchMovies } from '../api.js'
import { loadMovies } from '../data.js'
import { getFavs, getHist } from '../store.js'

const HOME_ROWS = [
  { type: 'phim-moi-cap-nhat', label: 'Phim Mới Cập Nhật' },
  { type: 'phim-bo', label: 'Phim Bộ' },
  { type: 'phim-le', label: 'Phim Lẻ' },
  { type: 'phim-chieu-rap', label: 'Phim Chiếu Rạp' },
  { type: 'tv-shows', label: 'TV Shows' }
]
const ROW_LIMIT = 12

let rows = []

function renderPosterCard(m) {
  const thumb = imgSrc(m.poster_url || m.thumb_url || m.thumb || m.poster)
  const title = sanitizeAttr(m.name || '')
  const year = m.year || ''
  return `<div class="poster-card" data-slug="${sanitizeAttr(m.slug || '')}">
    <img class="poster-img" src="${thumb}" alt="${title}" loading="lazy" decoding="async" onerror="this.style.display='none'">
    <div class="poster-overlay">
      <div class="poster-year">${year}</div>
      <div class="poster-title">${title}</div>
    </div>
  </div>`
}

function renderHeroCard(m, large = false) {
  const thumb = imgSrc(m.thumb_url || m.poster_url || m.thumb || m.poster)
  const title = sanitize(m.name || '')
  const year = sanitize(String(m.year || ''))
  const slug = sanitizeAttr(m.slug || '')
  if (large) {
    return `<div class="home-hero-main" data-slug="${slug}">
      <img src="${thumb}" alt="${sanitizeAttr(m.name || '')}" loading="eager">
      <div class="home-hero-shade"></div>
      <div class="home-hero-copy">
        <h2>${title}</h2>
        <div class="home-hero-meta"><span>★ 8.5</span><span>${year}</span><span>HD</span></div>
        <p>${sanitize(m.origin_name || 'Chọn để xem chi tiết phim.')}</p>
        <div class="home-hero-actions"><button data-slug="${slug}">▶ Xem ngay</button><span>ⓘ Chi tiết</span></div>
      </div>
    </div>`
  }
  return `<div class="home-hero-side" data-slug="${slug}">
    <img src="${thumb}" alt="${sanitizeAttr(m.name || '')}" loading="lazy">
    <div class="home-hero-side-copy"><h3>${title}</h3><p><span>★ 7.8</span><span>${year}</span><span>HD</span></p></div>
  </div>`
}

function renderHero(items) {
  if (!items || !items.length) return ''
  const main = items[0]
  const side = items.slice(1, 5)
  return `<section class="home-hero-section">
    <h2 class="home-section-title">Đề xuất hôm nay</h2>
    <div class="home-hero-strip">
      ${renderHeroCard(main, true)}
      <div class="home-hero-side-grid">${side.map(m => renderHeroCard(m)).join('')}</div>
    </div>
    <div class="home-dots"><span class="active"></span><span></span><span></span><span></span><span></span></div>
  </section>`
}

function renderHomeRowShell(type, label) {
  return `<div class="home-row">
    <h2 class="home-section-title">${sanitize(label || '')}</h2>
    <div class="poster-carousel" data-row-type="${sanitizeAttr(type)}"></div>
  </div>`
}

function itemsForType(type) {
  if (type === 'history') return store.histItems || []
  if (type === 'favorites') return store.favItems || []
  const r = rows.find(x => x.type === type)
  return r ? r.items : []
}

// ponytail: only build poster DOM for rows near the viewport; on weak TV this
// cuts the initial render from ~70 cards to the first 1-2 screens
let homeObserver = null
function mountRowCarousel(carousel) {
  if (carousel.dataset.mounted) return
  const items = itemsForType(carousel.dataset.rowType)
  if (!items || !items.length) return
  carousel.innerHTML = items.slice(0, ROW_LIMIT).map(renderPosterCard).join('')
  carousel.dataset.mounted = '1'
}

function setupHomeLazy() {
  const carousels = $$('.poster-carousel[data-row-type]')
  if (!carousels.length) return
  if (homeObserver) homeObserver.disconnect()
  if (!('IntersectionObserver' in window)) {
    carousels.forEach(mountRowCarousel)
    return
  }
  homeObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        mountRowCarousel(e.target)
        homeObserver.unobserve(e.target)
      }
    }
  }, { rootMargin: '400px 0px' })
  carousels.forEach((c, i) => {
    if (i < 2) mountRowCarousel(c)
    else homeObserver.observe(c)
  })
}

export function renderHome() {
  const container = $('#screen-home')
  if (!container) return

  store.favItems = Object.entries(getFavs()).map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin }))
  store.histItems = Object.entries(getHist()).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin }))

  let html = '<div class="home-rows">'
  if (rows.length === 0) {
    html += '<div class="home-loading">Đang tải...</div>'
  } else {
    html += renderHero(rows[0].items)
    for (const rowData of rows) {
      html += renderHomeRowShell(rowData.type, rowData.label)
    }
    if (store.histItems.length) {
      html += renderHomeRowShell('history', 'Tiếp Tục Xem')
    }
    if (store.favItems.length) {
      html += renderHomeRowShell('favorites', 'Yêu Thích')
    }
  }
  html += '</div>'
  container.innerHTML = html
  setupHomeLazy()
}

export async function loadHomeData() {
  rows = []
  renderHome()
  // ponytail: prefer API; only touch the 7.5MB local index when an API row fails
  rows = await Promise.all(HOME_ROWS.map(async rowDef => {
    try {
      const data = await fetchMovies(rowDef.type, 1, '', '', '', ROW_LIMIT)
      const items = data.items || (data.data && data.data.items) || []
      if (items.length) return { type: rowDef.type, label: rowDef.label, items }
      const localMovies = await loadMovies()
      const idx = HOME_ROWS.findIndex(row => row.type === rowDef.type)
      return { type: rowDef.type, label: rowDef.label, items: localMovies.slice(idx * ROW_LIMIT, (idx + 1) * ROW_LIMIT) }
    } catch {
      const localMovies = await loadMovies()
      const idx = HOME_ROWS.findIndex(row => row.type === rowDef.type)
      return { type: rowDef.type, label: rowDef.label, items: localMovies.slice(idx * ROW_LIMIT, (idx + 1) * ROW_LIMIT) }
    }
  }))
  renderHome()
}

export let focusedRow = 0
export let focusedCard = 0
export function resetHomeFocus() { focusedRow = 0; focusedCard = 0 }

export function navigateHome(dir) {
  const carousels = $$('.poster-carousel')
  if (!carousels.length) return

  if (dir === 'reset') {
    focusedRow = 0; focusedCard = 0
  } else if (dir === 'down') {
    focusedRow = Math.min(focusedRow + 1, carousels.length - 1)
    focusedCard = 0
  } else if (dir === 'up') {
    focusedRow = Math.max(focusedRow - 1, 0)
    focusedCard = 0
  } else if (dir === 'right') {
    const cards = carousels[focusedRow].querySelectorAll('.poster-card')
    focusedCard = Math.min(focusedCard + 1, cards.length - 1)
  } else if (dir === 'left') {
    focusedCard = Math.max(focusedCard - 1, 0)
  }

  carousels.forEach((c, ri) => c.classList.toggle('row-focused', ri === focusedRow))
  const activeCarousel = carousels[focusedRow]
  if (activeCarousel && !activeCarousel.dataset.mounted) mountRowCarousel(activeCarousel)
  if (activeCarousel) {
    const cards = activeCarousel.querySelectorAll('.poster-card')
    cards.forEach((c, ci) => c.classList.toggle('card-focused', ci === focusedCard))
    const target = cards[focusedCard]
    if (target) target.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }
}

export function selectHomeFocused() {
  const carousels = $$('.poster-carousel')
  const active = carousels[focusedRow]
  if (active && !active.dataset.mounted) mountRowCarousel(active)
  const target = active?.querySelectorAll('.poster-card')[focusedCard]
  const slug = target?.dataset?.slug
  if (slug) {
    import('./detail.js').then(m => {
      m.loadDetail(slug)
      store.prevScreen = 'home'
    })
  }
}

export function handleHomeClick(e) {
  const card = e.target.closest('.poster-card, .home-hero-main, .home-hero-side')
  if (!card) return null
  const slug = card.dataset.slug
  if (slug) return { action: 'detail', slug }
  return null
}

export async function handleActionRow(id) {
  const labelMap = { 'phim-bo':'Phim Bộ', 'phim-le':'Phim Lẻ', 'phim-chieu-rap':'Phim Chiếu Rạp', 'phim-moi-cap-nhat':'Phim Mới' }
  const label = labelMap[id] || id
  try {
    const data = await fetchMovies(id, 1, '', '', '', ROW_LIMIT)
    const items = data.items || (data.data && data.data.items) || []
    if (!items.length) return
    const oldRow = $(`[data-action-type="${id}"]`)
    if (oldRow) oldRow.remove()
    const el = $('.home-actions-row')
    if (!el) return
    el.insertAdjacentHTML('afterend',
      `<div class="home-row action-result" data-action-type="${id}">
        <h2 class="home-row-title">${sanitize(label)}</h2>
        <div class="poster-carousel">${items.map(renderPosterCard).join('')}</div>
      </div>`)
  } catch {}
}
