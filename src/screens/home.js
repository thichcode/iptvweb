import { $, $$, imgSrc, sanitize, sanitizeAttr, store } from '../utils.js'
import { fetchMovies } from '../api.js'
import { getFavs, getHist } from '../store.js'

const HOME_ROWS = [
  { type: 'phim-moi-cap-nhat', label: 'Phim Mới Cập Nhật' },
  { type: 'phim-bo', label: 'Phim Bộ' },
  { type: 'phim-le', label: 'Phim Lẻ' },
  { type: 'hoat-hinh', label: 'Hoạt Hình' },
  { type: 'tv-shows', label: 'TV Shows' }
]
const ROW_LIMIT = 12

let rows = []

function renderPosterCard(m) {
  const thumb = imgSrc(m.thumb_url || m.poster_url || m.thumb || m.poster)
  const title = sanitizeAttr(m.name || '')
  const year = m.year || ''
  return `<div class="poster-card" data-slug="${sanitizeAttr(m.slug || '')}">
    <img class="poster-img" src="${thumb}" alt="${title}" loading="lazy" onerror="this.style.display='none'">
    <div class="poster-overlay">
      <div class="poster-year">${year}</div>
      <div class="poster-title">${title}</div>
    </div>
  </div>`
}

function renderHomeRow(data) {
  if (!data || !data.length) return ''
  const items = data.slice(0, ROW_LIMIT)
  return `<div class="home-row">
    <h2 class="home-row-title">${sanitize(data.label || '')}</h2>
    <div class="poster-carousel">${items.map(renderPosterCard).join('')}</div>
  </div>`
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
    for (const rowData of rows) {
      html += renderHomeRow(rowData)
    }
    if (store.histItems.length) {
      html += `<div class="home-row">
        <h2 class="home-row-title">Tiếp Tục Xem</h2>
        <div class="poster-carousel">${store.histItems.map(renderPosterCard).join('')}</div>
      </div>`
    }
    if (store.favItems.length) {
      html += `<div class="home-row">
        <h2 class="home-row-title">Yêu Thích</h2>
        <div class="poster-carousel">${store.favItems.map(renderPosterCard).join('')}</div>
      </div>`
    }
  }
  html += '</div>'
  container.innerHTML = html
}

export async function loadHomeData() {
  rows = []
  for (const rowDef of HOME_ROWS) {
    try {
      const data = await fetchMovies(rowDef.type, 1, '', '', '', ROW_LIMIT)
      const items = data.items || (data.data && data.data.items) || []
      rows.push({ type: rowDef.type, label: rowDef.label, items })
    } catch {
      rows.push({ type: rowDef.type, label: rowDef.label, items: [] })
    }
  }
  renderHome()
}

let focusedRow = 0
let focusedCard = 0
export function resetHomeFocus() { focusedRow = 0; focusedCard = 0 }

export function navigateHome(dir) {
  const carousels = $$('.poster-carousel')
  if (!carousels.length) return

  if (dir === 'down') {
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
  if (activeCarousel) {
    const cards = activeCarousel.querySelectorAll('.poster-card')
    cards.forEach((c, ci) => c.classList.toggle('card-focused', ci === focusedCard))
    const target = cards[focusedCard]
    if (target) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

export function selectHomeFocused() {
  const carousels = $$('.poster-carousel')
  const target = carousels[focusedRow]?.querySelectorAll('.poster-card')[focusedCard]
  const slug = target?.dataset?.slug
  if (slug) {
    import('./detail.js').then(m => {
      m.loadDetail(slug)
      store.prevScreen = 'home'
    })
  }
}

export function handleHomeClick(e) {
  const card = e.target.closest('.poster-card')
  if (!card) return null
  const slug = card.dataset.slug
  if (slug) return { action: 'detail', slug }
  return null
}
