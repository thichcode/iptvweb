import { $, $$, imgSrc, sanitize, sanitizeAttr, store } from '../utils.js'
import { fetchMovies } from '../api.js'
import { loadMovies } from '../data.js'
import { getFavs, getHist } from '../store.js'

const HOME_ROWS = [
  { type: 'phim-moi-cap-nhat', label: 'Phim Mới Cập Nhật' },
  { type: 'phim-bo', label: 'Phim Bộ' },
  { type: 'phim-le', label: 'Phim Lẻ' },
  { type: 'tv-shows', label: 'Phim Netflix' }
]
const ROW_LIMIT = 10

let rows = []

// ponytail: watch-mode panel reuses already-loaded home rows, never fetches
export function getHomeRows() { return rows }

function renderPosterCard(m) {
  const thumb = imgSrc(m.poster_url || m.thumb_url || m.thumb || m.poster)
  const title = sanitizeAttr(m.name || '')
  const year = m.year || ''
  return `<div class="poster-card" data-slug="${sanitizeAttr(m.slug || '')}">
    <img class="poster-img" src="${thumb}" alt="${title}" loading="lazy" decoding="async" onerror="this.style.display='none'">
    <div class="poster-overlay">
      <div class="poster-year">${sanitize(String(year || ''))}</div>
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
      <img src="${thumb}" alt="${sanitizeAttr(m.name || '')}" loading="eager" onerror="this.style.display='none'">
      <div class="home-hero-shade"></div>
      <div class="home-hero-copy">
        <h2>${title}</h2>
        <div class="home-hero-meta"><span>${year}</span><span>HD</span></div>
        <p>${sanitize(m.origin_name || 'Chọn để xem chi tiết phim.')}</p>
        <div class="home-hero-actions"><button data-slug="${slug}">▶ Xem ngay</button><span>ⓘ Chi tiết</span></div>
      </div>
    </div>`
  }
  return `<div class="home-hero-side" data-slug="${slug}">
    <img src="${thumb}" alt="${sanitizeAttr(m.name || '')}" loading="lazy" onerror="this.style.display='none'">
    <div class="home-hero-side-copy"><h3>${title}</h3><p><span>${year}</span><span>HD</span></p></div>
  </div>`
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
  try {
    homeObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setTimeout(() => mountRowCarousel(e.target), 100)
          homeObserver.unobserve(e.target)
        }
      }
    }, { rootMargin: '100px 0px' })
    carousels.forEach((c, i) => {
      if (i < 1) mountRowCarousel(c)
      else homeObserver.observe(c)
    })
  } catch {
    carousels.forEach(mountRowCarousel)
  }
}

export function renderHome() {
  const container = $('#screen-home')
  if (!container) return

  store.favItems = Object.entries(getFavs()).map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin }))
  store.histItems = Object.entries(getHist()).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin }))

  let html = ''
  const heroMovies = (rows[0] && rows[0].items) || []
  if (heroMovies.length >= 2) {
    const mainHero = heroMovies[0]
    const sideHeroes = heroMovies.slice(1, 5)
    html += `<div class="home-hero-section">
      <div class="home-hero-strip">
        ${renderHeroCard(mainHero, true)}
        <div class="home-hero-side-grid">
          ${sideHeroes.map(m => renderHeroCard(m, false)).join('')}
        </div>
      </div>
    </div>`
  }
  html += '<div class="home-rows">'
  if (rows.length === 0) {
    html += '<div class="home-loading">Đang tải...</div>'
  } else {
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
  resetHomeFocus()
  requestAnimationFrame(() => {
    const first = $('.poster-carousel .poster-card')
    if (first) { first.classList.add('card-focused'); first.scrollIntoView({ block: 'nearest', behavior: 'auto' }) }
  })
}

export async function loadHomeData() {
  rows = []
  renderHome()
  const local = await loadMovies()
  if (local.length) {
    rows = HOME_ROWS.map((rowDef, idx) => ({
      type: rowDef.type,
      label: rowDef.label,
      items: local.slice(idx * ROW_LIMIT, (idx + 1) * ROW_LIMIT)
    }))
    if (store.screen === 'home') renderHome()
  }
  for (const rowDef of HOME_ROWS) {
    try {
      const data = await fetchMovies(rowDef.type, 1, '', '', '', ROW_LIMIT)
      const items = data.items || (data.data && data.data.items) || []
      if (!items.length) continue
      const idx = HOME_ROWS.findIndex(row => row.type === rowDef.type)
      rows[idx] = { type: rowDef.type, label: rowDef.label, items }
      if (store.screen === 'home') renderHome()
    } catch { /* keep static data for this row */ }
  }
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

  carousels.forEach((c, ri) => {
    c.classList.toggle('row-focused', ri === focusedRow)
    c.querySelectorAll('.card-focused').forEach(cf => cf.classList.remove('card-focused'))
  })
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
  const labelMap = { 'phim-bo':'Phim Bộ', 'phim-le':'Phim Lẻ', 'phim-moi-cap-nhat':'Phim Mới' }
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
