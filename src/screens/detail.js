import { $, $$, imgSrc, store } from '../utils.js'
import { fetchDetail } from '../api.js'
import { isFav, toggleFav } from '../store.js'

export async function loadDetail(slug) {
  store.prevScreen = store.screen
  const container = $('#screen-detail')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('detail')
  store.currentSlug = slug
  try {
    const data = await fetchDetail(slug)
    if (!data || !data.movie) { container.innerHTML = '<div class="empty">Không tìm thấy phim</div>'; return }
    renderDetail(data.movie, data.episodes || [])
  } catch { container.innerHTML = '<div class="empty">Lỗi kết nối</div>' }
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
  html += `<h2>${movie.name || ''}</h2>`
  html += `<span class="fav-btn" data-slug="${movie.slug || ''}">${favStar}</span></div>`
  if (tags.some(Boolean)) {
    html += '<div class="tags">' + tags.filter(Boolean).map(t => `<span>${t}</span>`).join('') + '</div>'
  }
  html += `<div class="desc">${movie.content || movie.description || 'Chưa có mô tả'}</div></div></div>`

  if (episodes.length) {
    html += '<div class="episode-section">'
    for (let s = 0; s < episodes.length; s++) {
      const ep = episodes[s]
      const data = ep.server_data || []
      html += `<div class="server-name">${ep.server_name || 'Server ' + (s + 1)}</div>`
      html += '<div class="episode-grid">'
      for (let e = 0; e < data.length; e++) {
        html += `<div class="episode-btn" data-server="${s}" data-ep="${e}">${data[e].name || 'Tập ' + (e + 1)}</div>`
      }
      html += '</div>'
    }
    html += '</div>'
  } else {
    html += '<div class="empty">Chưa có tập phim</div>'
  }
  container.innerHTML = html
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'))
  const el = $('#screen-' + id)
  if (el) el.classList.add('active')
  store.screen = id
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
