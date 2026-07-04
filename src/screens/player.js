import { $, $$, store } from '../utils.js'
import { saveHist } from '../store.js'
import Hls from 'hls.js'

let hlsInstance = null
let overlayTimer = null
let progressTimer = null

export function playEpisode(serverIdx, epIdx) {
  if (!store.episodes || !store.episodes[serverIdx]) return
  const server = store.episodes[serverIdx]
  const data = server.server_data || []
  if (!data[epIdx]) return
  const src = data[epIdx].link_m3u8
  if (!src) return

  store.serverIdx = serverIdx
  store.epIdx = epIdx
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
        // Thử recover network error (ví dụ: mất mạng tạm thời)
        hlsInstance.startLoad()
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hlsInstance.recoverMediaError()
      } else {
        // Lỗi không thể recover — hiển thị thông báo cho người dùng
        showPlayerError('Không thể phát video. Thử chọn server khác.')
      }
    })
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = src
    player.addEventListener('loadedmetadata', () => player.play().catch(() => {}), { once: true })
    player.addEventListener('error', () => {
      showPlayerError('Không thể phát video. Thử chọn server khác.')
    }, { once: true })
  }

  showOverlay()
  player.onended = () => autoNext()
  player.ontimeupdate = updateProgress
  if (movie) saveHist(movie.slug, movie, data[epIdx].name || 'Tập ' + (epIdx + 1), serverIdx, epIdx)
}

function autoNext() {
  let s = store.serverIdx
  let e = store.epIdx + 1
  if (store.episodes[s] && store.episodes[s].server_data && store.episodes[s].server_data[e]) {
    playEpisode(s, e); return
  }
  s++
  if (store.episodes[s] && store.episodes[s].server_data && store.episodes[s].server_data.length > 0) {
    playEpisode(s, 0); return
  }
  showOverlay()
}

function formatTime(t) {
  if (isNaN(t) || !isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return m + ':' + (s < 10 ? '0' : '') + s
}

function updateProgress() {
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
  if (overlayTimer) { clearTimeout(overlayTimer); overlayTimer = null }
  $$('.screen').forEach(s => s.classList.remove('active'))
  const detail = $('#screen-detail')
  if (detail) detail.classList.add('active')
  store.screen = 'detail'
}

export function togglePlay() {
  const player = $('#player')
  if (!player) return
  if (player.paused) { player.play() } else { player.pause() }
  showOverlay()
}

export function seek(delta) {
  const player = $('#player')
  if (!player) return
  player.currentTime = Math.max(0, player.currentTime + delta)
  showSeekFeedback(delta)
  showOverlay()
}

function showOverlay() {
  const ui = $('#player-ui')
  if (!ui) return
  ui.classList.add('show')
  if (overlayTimer) clearTimeout(overlayTimer)
  const player = $('#player')
  if (player && !player.paused) {
    overlayTimer = setTimeout(() => ui.classList.remove('show'), 4000)
  }
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

  // Xóa thông báo lỗi cũ nếu có
  const old = wrap.querySelector('.player-error')
  if (old) old.remove()

  const el = document.createElement('div')
  el.className = 'player-error'
  el.innerHTML = `
    <div class="player-error-icon">📡</div>
    <div class="player-error-msg">${msg}</div>
    <button class="player-error-close" onclick="this.closest('.player-error').remove()">Đóng</button>
  `
  wrap.appendChild(el)
}

export function handlePlayerClick(e) {
  return null
}
