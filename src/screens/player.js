import { $, $$, store } from '../utils.js'
import { saveHist } from '../store.js'
import Hls from 'hls.js'

let hlsInstance = null
let overlayTimer = null

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

  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  player.removeAttribute('src')

  if (Hls.isSupported()) {
    hlsInstance = new Hls()
    hlsInstance.loadSource(src)
    hlsInstance.attachMedia(player)
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => player.play())
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = src
    player.addEventListener('loadedmetadata', () => player.play(), { once: true })
  }

  showOverlay()
  player.onended = () => autoNext()
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

export function exitPlayer() {
  const player = $('#player')
  const wrap = $('#player-wrap')
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  if (player) { player.pause(); player.onended = null; player.removeAttribute('src'); player.load() }
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
  if (player.paused) player.play() else player.pause()
  showOverlay()
}

export function seek(delta) {
  const player = $('#player')
  if (!player) return
  player.currentTime = Math.max(0, player.currentTime + delta)
  showOverlay()
}

function showOverlay() {
  const overlay = $('#player-overlay')
  if (!overlay) return
  overlay.classList.add('show')
  if (overlayTimer) clearTimeout(overlayTimer)
  const player = $('#player')
  if (player && !player.paused) {
    overlayTimer = setTimeout(() => overlay.classList.remove('show'), 4000)
  }
}

export function handlePlayerClick(e) {
  return null
}
