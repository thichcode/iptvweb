import { $, $$, store, sanitize, sanitizeAttr } from '../utils.js'
import { saveHist, getHist, getFavs } from '../store.js'
import { fetchDetail } from '../api.js'
import { getHomeRows } from './home.js'
import Hls from 'hls.js'

let hlsInstance = null
let overlayTimer = null
let watchTimer = null
let wpIdx = 0
let wpServer = 0
const WATCH_HIDE_MS = 10000
const WATCH_BROWSE_TYPES = ['phim-moi-cap-nhat', 'phim-bo', 'phim-le']

function showPlayerBtns(show) {
  const els = ['#player-center-btn', '#player-exit-btn', '#player-fs-btn']
  els.forEach(id => $(id)?.classList.toggle('show', show))
}

export function playEpisode(serverIdx, epIdx) {
  if (!store.episodes || !store.episodes[serverIdx]) return
  const server = store.episodes[serverIdx]
  const data = server.server_data || []
  if (!data[epIdx]) return
  const src = data[epIdx].link_m3u8
  if (!src) return

  store.serverIdx = serverIdx
  store.epIdx = epIdx
  store.prePlayerScreen = store.screen
  store.prePlayerScrollY = window.scrollY
  const player = $('#player')
  const wrap = $('#player-wrap')
  const pTitle = $('#p-title')
  wrap.classList.add('active')

  const movie = store.currentMovie
  pTitle.textContent = (movie ? movie.name : '') + ' - ' + (data[epIdx].name || 'Tập ' + (epIdx + 1))

  removeGestureHints()
  const hints = document.createElement('div')
  hints.className = 'gesture-hints'
  hints.id = 'gesture-hints'
  hints.innerHTML = `
    <div class="hint-row"><span class="hint-key">← →</span> Seek 10s</div>
    <div class="hint-row"><span class="hint-key">Space</span> Play / Pause</div>
    <div class="hint-row"><span class="hint-key">Esc</span> Thoát</div>
    <div class="hint-row" style="color:#888;font-size:12px;margin-top:12px">Double-tap trái/phải để seek</div>
  `
  wrap.appendChild(hints)
  setTimeout(removeGestureHints, 3000)

  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  player.removeAttribute('src')

  if (Hls.isSupported()) {
    hlsInstance = new Hls({ maxBufferLength: 30, enableWorker: true })
    hlsInstance.loadSource(src)
    hlsInstance.attachMedia(player)
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => player.play().catch(() => {}))
    hlsInstance.on(Hls.Events.ERROR, (_evt, data) => {
      if (!data.fatal) return
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hlsInstance.startLoad()
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hlsInstance.recoverMediaError()
      } else {
        showPlayerError('Kênh này đang lỗi. Vui lòng thử lại hoặc chọn kênh khác.')
      }
    })
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = src
    player.addEventListener('loadedmetadata', () => player.play().catch(() => {}), { once: true })
    player.addEventListener('error', () => {
      showPlayerError('Kênh này đang lỗi. Vui lòng thử lại hoặc chọn kênh khác.')
    }, { once: true })
  }

  showOverlay()
  showPlayerBtns(true)
  player.onended = () => autoNext()
  player.ontimeupdate = updateProgress
  if (movie) saveHist(movie.slug, movie, data[epIdx].name || 'Tập ' + (epIdx + 1), serverIdx, epIdx)
  // ponytail: keep open panel in sync when episode changes (auto-next, new pick)
  wpServer = serverIdx
  if (isWatchPanelOpen()) { renderWatchPanel(); resetWatchTimer() }
}

function autoNext() {
  let s = store.serverIdx
  let e = store.epIdx + 1
  if (store.episodes[s] && store.episodes[s].server_data && store.episodes[s].server_data[e]) {
    const src = store.episodes[s].server_data[e].link_m3u8
    if (src) { playEpisode(s, e); return }
  }
  s++
  if (store.episodes[s] && store.episodes[s].server_data && store.episodes[s].server_data.length > 0) {
    const src = store.episodes[s].server_data[0].link_m3u8
    if (src) { playEpisode(s, 0); return }
  }
  const wrap = $('#player-wrap')
  if (wrap) {
    const old = wrap.querySelector('.playlist-end')
    if (old) old.remove()
    const el = document.createElement('div')
    el.className = 'playlist-end'
    el.innerHTML = '<div class="player-error-icon">✓</div><div class="player-error-msg">Hết danh sách phát</div>'
    wrap.appendChild(el)
    showOverlay()
    setTimeout(() => { if (wrap.classList.contains('active')) exitPlayer() }, 2000)
  }
}

function formatTime(t) {
  if (isNaN(t) || !isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return m + ':' + (s < 10 ? '0' : '') + s
}

function updateProgress() {
  const wrap = $('#player-wrap')
  if (!wrap || !wrap.classList.contains('active')) return
  const player = $('#player')
  if (!player) return
  const current = $('#p-current')
  const dur = $('#p-duration')
  const bar = $('#p-progress')
  if (current) current.textContent = formatTime(player.currentTime)
  if (dur) dur.textContent = formatTime(player.duration)
  if (bar && player.duration) bar.style.width = (player.currentTime / player.duration * 100) + '%'
}

export function seekTo(e) {
  const bar = $('#p-seekbar')
  const player = $('#player')
  if (!bar || !player) return
  const rect = bar.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  player.currentTime = x * player.duration
  showOverlay()
}

export function exitPlayer() {
  const player = $('#player')
  const wrap = $('#player-wrap')
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  if (player) { player.pause(); player.onended = null; player.ontimeupdate = null; player.removeAttribute('src'); player.load() }
  wrap.classList.remove('active')
  closeWatchPanel()
  if (overlayTimer) { clearTimeout(overlayTimer); overlayTimer = null }
  showPlayerBtns(false)
  $$('.screen').forEach(s => s.classList.remove('active'))
  const targetScreen = store.prePlayerScreen || 'detail'
  const target = $('#screen-' + targetScreen)
  if (target) target.classList.add('active')
  store.screen = targetScreen
  if (store.prePlayerScrollY != null) {
    window.scrollTo({ top: store.prePlayerScrollY, behavior: 'auto' })
  }
  store.prePlayerScreen = null
  store.prePlayerScrollY = null
}

export function togglePlay() {
  const player = $('#player')
  if (!player) return
  if (player.paused) { player.play() } else { player.pause() }
  const ctr = $('#player-center-btn')
  if (ctr) ctr.textContent = player.paused ? '▶' : ''
  showOverlay()
}

export function seek(delta) {
  const player = $('#player')
  if (!player) return
  player.currentTime = Math.max(0, player.currentTime + delta)
  showSeekFeedback(delta)
  showOverlay()
}

export function showOverlay() {
  const ui = $('#player-ui')
  if (!ui) return
  ui.classList.add('show')
  showPlayerBtns(true)
  const player = $('#player')
  const ctr = $('#player-center-btn')
  if (ctr) ctr.textContent = player && !player.paused ? '' : '▶'
  if (overlayTimer) clearTimeout(overlayTimer)
  overlayTimer = setTimeout(() => { ui.classList.remove('show'); showPlayerBtns(false) }, 4000)
}

function removeGestureHints() {
  const hints = $('#gesture-hints')
  if (hints) hints.remove()
}

function showSeekFeedback(delta) {
  document.querySelectorAll('.seek-feedback').forEach(e => e.remove())

  const el = document.createElement('div')
  el.className = 'seek-feedback ' + (delta > 0 ? 'right' : 'left')
  el.textContent = (delta > 0 ? '+' : '') + delta + 's'
  document.body.appendChild(el)

  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => el.remove(), 500)
}

function showPlayerError(msg) {
  const wrap = $('#player-wrap')
  if (!wrap) return

  const old = wrap.querySelector('.player-error')
  if (old) old.remove()

  const el = document.createElement('div')
  el.className = 'player-error'
  el.innerHTML = `
    <div class="player-error-icon">📡</div>
    <div class="player-error-msg">${msg}</div>
    <button class="retry-btn" onclick="this.closest('.player-error').remove();location.reload()">Thử lại</button>
    <button class="player-error-close">Quay lại danh sách</button>
  `
  wrap.appendChild(el)
}

/* Watch-mode panel: Back opens browse panel, video keeps playing */
export function isWatchPanelOpen() {
  const p = $('#watch-panel')
  return !!p && p.classList.contains('show')
}

export function openWatchPanel() {
  const wrap = $('#player-wrap')
  if (!wrap || !wrap.classList.contains('active')) return
  let panel = $('#watch-panel')
  if (!panel) {
    panel = document.createElement('div')
    panel.id = 'watch-panel'
    wrap.appendChild(panel)
  }
  wpServer = store.serverIdx || 0
  wpIdx = 0
  renderWatchPanel()
  panel.classList.add('show')
  resetWatchTimer()
}

export function closeWatchPanel() {
  if (watchTimer) { clearTimeout(watchTimer); watchTimer = null }
  $('#watch-panel')?.classList.remove('show')
}

function resetWatchTimer() {
  if (watchTimer) clearTimeout(watchTimer)
  watchTimer = setTimeout(closeWatchPanel, WATCH_HIDE_MS)
}

function wpItems() {
  return Array.from($('#watch-panel')?.querySelectorAll('.wp-item') || [])
}

function wpHighlight() {
  const items = wpItems()
  if (!items.length) return
  wpIdx = Math.max(0, Math.min(wpIdx, items.length - 1))
  items.forEach((el, i) => el.classList.toggle('wp-active', i === wpIdx))
  items[wpIdx].scrollIntoView({ block: 'nearest', behavior: 'auto' })
}

export function watchPanelMove(dir) {
  const n = wpItems().length
  if (!n) return
  wpIdx = (wpIdx + dir + n) % n
  wpHighlight()
  resetWatchTimer()
}

export function watchPanelSelect(el) {
  const items = wpItems()
  if (el) { const i = items.indexOf(el); if (i >= 0) wpIdx = i }
  const item = el || items[wpIdx]
  if (!item) return
  const d = item.dataset
  if (d.kind === 'ep') {
    playEpisode(parseInt(d.s, 10) || 0, parseInt(d.e, 10) || 0)
  } else if (d.kind === 'server') {
    wpServer = parseInt(d.s, 10) || 0
    renderWatchPanel()
    resetWatchTimer()
  } else if (d.kind === 'movie' && d.slug) {
    playFirst(d.slug)
  }
}

async function playFirst(slug) {
  const panel = $('#watch-panel')
  if (panel) panel.innerHTML = '<div class="wp-loading">Đang tải...</div>'
  try {
    const data = await fetchDetail(slug)
    if (!data || !data.movie || !(data.episodes || []).length) throw new Error('empty')
    store.currentMovie = data.movie
    store.episodes = data.episodes
    wpServer = 0
    playEpisode(0, 0)
  } catch {
    if (panel) {
      renderWatchPanel()
      const err = document.createElement('div')
      err.className = 'wp-err'
      err.textContent = 'Không tải được phim, thử phim khác'
      panel.prepend(err)
      resetWatchTimer()
    }
  }
}

function renderWatchPanel() {
  const panel = $('#watch-panel')
  if (!panel) return
  const servers = store.episodes || []
  const cur = servers[wpServer] || servers[store.serverIdx] || {}
  const eps = cur.server_data || []
  let html = ''
  // Episodes of current movie
  if (eps.length) {
    if (servers.length > 1) {
      html += '<div class="wp-sec-title">Server</div><div class="wp-row">' + servers.map((s, i) =>
        `<div class="wp-item wp-chip${i === wpServer ? ' wp-current' : ''}" data-kind="server" data-s="${i}">${sanitize(s.server_name || ('Server ' + (i + 1)))}</div>`
      ).join('') + '</div>'
    }
    html += '<div class="wp-sec-title">Tập khác</div>' + eps.map((e, i) => {
      const cur_ = wpServer === (store.serverIdx || 0) && i === (store.epIdx || 0)
      return `<div class="wp-item${cur_ ? ' wp-current' : ''}" data-kind="ep" data-s="${wpServer}" data-e="${i}">${cur_ ? '▶ ' : ''}${sanitize(e.name || ('Tập ' + (i + 1)))}</div>`
    }).join('')
  }
  // History (10 latest)
  const hist = Object.entries(getHist()).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 10)
  if (hist.length) {
    html += '<div class="wp-sec-title">Đã xem</div>' + hist.map(([slug, v]) =>
      `<div class="wp-item" data-kind="movie" data-slug="${sanitizeAttr(slug)}">${sanitize(v.name || slug)}<div class="wp-sub">${sanitize(v.episode || '')}</div></div>`
    ).join('')
  }
  // Favorites (10)
  const favs = Object.entries(getFavs()).slice(0, 10)
  if (favs.length) {
    html += '<div class="wp-sec-title">Yêu thích</div>' + favs.map(([slug, v]) =>
      `<div class="wp-item" data-kind="movie" data-slug="${sanitizeAttr(slug)}">♥ ${sanitize(v.name || slug)}<div class="wp-sub">${sanitize(String(v.year || ''))}</div></div>`
    ).join('')
  }
  // Browse from already-loaded home rows, never fetch here
  for (const r of getHomeRows()) {
    if (!WATCH_BROWSE_TYPES.includes(r.type) || !r.items || !r.items.length) continue
    html += `<div class="wp-sec-title">${sanitize(r.label || r.type)}</div>` + r.items.slice(0, 10).map(m =>
      `<div class="wp-item" data-kind="movie" data-slug="${sanitizeAttr(m.slug || '')}">${sanitize(m.name || '')}<div class="wp-sub">${sanitize(String(m.year || ''))}</div></div>`
    ).join('')
  }
  if (!html) html = '<div class="wp-loading">Chưa có gì để xem</div>'
  panel.innerHTML = html
  wpHighlight()
}

