import { $, $$, imgSrc, store, switchScreen, sanitize, sanitizeAttr } from '../utils.js'
import { fetchDetail } from '../api.js'
import { isFav, toggleFav } from '../store.js'

function renderSkeletonDetail() {
  return `<div class="detail-layout">
    <div class="detail-poster"><div class="skeleton skeleton-poster" style="width:100%;max-width:260px"></div></div>
    <div class="detail-info">
      <div class="skeleton skeleton-line" style="height:28px;width:200px;margin-bottom:12px"></div>
      <div class="skeleton skeleton-line" style="height:16px;width:120px;margin-bottom:16px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:100%;margin-bottom:8px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:90%;margin-bottom:8px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:70%"></div>
    </div>
  </div>`
}

export async function loadDetail(slug) {
  store.prevScreen = store.screen
  const container = $('#screen-detail')
  container.innerHTML = renderSkeletonDetail()
  switchScreen('detail')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  store.currentSlug = slug
  try {
    const data = await fetchDetail(slug)
    if (!data || !data.movie) { container.innerHTML = '<div class="empty">Không tìm thấy phim</div>'; return }
    renderDetail(data.movie, data.episodes || [])
  } catch (err) {
    console.error(err)
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Lỗi kết nối</div>
      <div class="error-hint">Kiểm tra mạng và thử lại</div>
    </div>`
  }
}

function renderDetail(movie, episodes) {
  const container = $('#screen-detail')
  store.currentMovie = movie
  store.episodes = episodes
  store.serverIdx = 0
  store.epIdx = 0

  const poster = imgSrc(movie.poster_url || movie.thumb_url)
  const favStar = isFav(movie.slug) ? '★' : '☆'
  const tags = [movie.year]
  if (movie.country) movie.country.forEach(c => tags.push(c.name))
  if (movie.quality) tags.push(movie.quality)
  if (movie.lang) tags.push(movie.lang)
  if (movie.time) tags.push(movie.time)

  let html = `<div class="detail-layout"><div class="detail-poster"><img src="${poster}" alt="" onerror="this.style.display='none'"></div>`
  html += `<div class="detail-info"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">`
  html += `<h2>${sanitize(movie.name || '')}</h2>`
  html += `<span class="fav-btn" data-slug="${sanitizeAttr(movie.slug || '')}">${favStar}</span></div>`
  if (tags.some(Boolean)) {
    html += '<div class="tags">' + tags.filter(Boolean).map(t => `<span>${sanitize(t)}</span>`).join('') + '</div>'
  }
  html += `<div class="desc">${movie.content || movie.description || 'Chưa có mô tả'}</div></div></div>`

  if (episodes.length) {
    html += '<div class="episode-section">'
    for (let s = 0; s < episodes.length; s++) {
      const ep = episodes[s]
      const data = ep.server_data || []
      html += `<div class="server-name">${sanitize(ep.server_name || 'Server ' + (s + 1))}</div>`
      html += '<div class="episode-grid">'
      for (let e = 0; e < data.length; e++) {
        html += `<div class="episode-btn" data-server="${s}" data-ep="${e}">${sanitize(data[e].name || 'Tập ' + (e + 1))}</div>`
      }
      html += '</div>'
    }
    html += '</div>'
  } else {
    html += '<div class="empty">Chưa có tập phim</div>'
  }
  container.innerHTML = html
}

export function handleDetailClick(e) {
  const fav = e.target.closest('.fav-btn')
  if (fav) {
    const slug = fav.dataset.slug
    if (slug) {
      toggleFav(slug, store.currentMovie)
      fav.textContent = isFav(slug) ? '★' : '☆'
    }
    return null
  }
  const ep = e.target.closest('.episode-btn')
  if (ep) {
    const serverIdx = parseInt(ep.dataset.server)
    const epIdx = parseInt(ep.dataset.ep)
    if (!isNaN(serverIdx) && !isNaN(epIdx)) {
      return { action: 'play', serverIdx, epIdx }
    }
  }
  return null
}
