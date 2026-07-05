import { $, $$, HOME_MENU, KEY_MAP, store, switchScreen } from './utils.js'
import { renderHome, handleHomeClick, scrollMenuTo, setHomeSelectHandler } from './screens/home.js'
import {
  renderMovieList, renderSubList, renderSearchInput, renderLocalList,
  loadMovieList, loadCategories, loadCountries, loadFavorites, loadHistory,
  handleListClick
} from './screens/list.js'
import { loadDetail, handleDetailClick } from './screens/detail.js'
import { isFav, toggleFav } from './store.js'
import { playEpisode, exitPlayer, togglePlay, seek, seekTo } from './screens/player.js'

let overlayTimer = null

function buildShell() {
  document.getElementById('app').innerHTML = `
    <div class="header">
      <span id="header-back" class="header-back" style="display:none">←</span>
      <h1 id="header-title">WebPhim</h1>
      <span class="hint" id="header-hint"></span>
    </div>
    <div id="screen-home" class="screen active"></div>
    <div id="screen-list" class="screen"></div>
    <div id="screen-detail" class="screen"></div>
    <div id="player-wrap">
      <video id="player" playsinline></video>
      <div id="player-center-btn">▶</div>
      <div id="player-exit-btn">✕</div>
      <div id="player-fs-btn">⛶</div>
      <div id="player-ui">
        <div id="player-overlay">
          <div class="p-title" id="p-title"></div>
          <div class="p-hint">← → Seek  |  Space Play/Pause  |  Esc thoát</div>
        </div>
        <div class="p-controls">
          <span class="p-time" id="p-current">0:00</span>
          <div class="p-seekbar" id="p-seekbar"><div class="p-progress" id="p-progress"></div></div>
          <span class="p-time" id="p-duration">0:00</span>
        </div>
      </div>
    </div>
    <div class="bottom-bar" id="bottom-bar">
      <div class="nav-btn" id="nav-back">← <span class="label">Back</span></div>
      <div class="nav-btn" id="nav-home">🏠 <span class="label">Home</span></div>
    </div>`
}

function setHeader(title, hint) {
  const ht = $('#header-title')
  const hh = $('#header-hint')
  if (ht) ht.textContent = title || 'WebPhim'
  if (hh) hh.textContent = hint || ''
}

function switchScreenLocal(id) {
  switchScreen(id)
  if (id === 'list') {
    requestAnimationFrame(() => {
      const items = $$('.local-item, .page-btn, .sub-item')
      if (items.length) items[0]?.classList.add('focused')
    })
  }
}

function goBack() {
  const screen = store.screen
  if ($('#player-wrap').classList.contains('active')) {
    exitPlayer()
  } else if (screen === 'detail') {
    switchScreenLocal(store.prevScreen || 'home')
    setHeader('WebPhim', '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else if (screen === 'list') {
    renderHome()
    switchScreenLocal('home')
    setHeader('WebPhim', '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function selectHomeItem(idx) {
  const item = HOME_MENU[idx]
  if (!item) return
  store.menuIndex = idx
  store.currentKeyword = ''
  store.categorySlug = ''
  store.countrySlug = ''

  switch (item.id) {
    case 'categories': loadCategories(); setHeader('Thể Loại', ''); break
    case 'countries': loadCountries(); setHeader('Quốc Gia', ''); break
    case 'search': store.searchMode = true; renderSearchInput(store.currentKeyword); switchScreenLocal('list'); setHeader('Tìm Kiếm', 'Enter để tìm'); break
    case 'favorites': loadFavorites(); switchScreenLocal('list'); setHeader('♥ Yêu Thích', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); break
    case 'history': loadHistory(); switchScreenLocal('list'); setHeader('Đã Xem', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); break
    default:
      loadMovieList(item.id, 1, '', '', '')
      setHeader(item.label, '↑↓ Chọn | Enter xem')
  }
}

function selectListItem(items, idx) {
  if (idx < 0 || idx >= items.length) return
  const item = items[idx]
  if (item.classList.contains('local-item')) {
    const slug = item.dataset.slug
    if (slug) { loadDetail(slug); setHeader('', '') }
  } else if (item.classList.contains('page-btn')) {
    const page = parseInt(item.dataset.page)
    if (!isNaN(page)) loadMovieList(store.listType, page, store.currentKeyword, store.categorySlug, store.countrySlug)
  } else if (item.classList.contains('sub-item')) {
    const slug = item.dataset.slug
    if (store.listType === 'category') { store.categorySlug = slug; loadMovieList('category', 1, '', slug, ''); setHeader(item.textContent, '↑↓ Chọn | Enter xem') }
    else if (store.listType === 'country') { store.countrySlug = slug; loadMovieList('country', 1, '', '', slug); setHeader(item.textContent, '↑↓ Chọn | Enter xem') }
  }
}

function handleKey(e) {
  const keyCode = e.keyCode || e.which
  const key = KEY_MAP[keyCode] || e.key

  if (store.searchMode) {
    if (key === 'Enter') {
      const inp = $('.search-input')
      if (inp && inp.value.trim()) { e.preventDefault(); store.searchMode = false; loadMovieList('search', 1, inp.value.trim(), '', ''); setHeader('Tìm: ' + inp.value.trim(), '') }
    }
    if (key === 'Escape') {
      e.preventDefault(); store.searchMode = false; renderHome(); switchScreenLocal('home'); setHeader('WebPhim', '')
    }
    return
  }

  if ($('#player-wrap').classList.contains('active')) {
    e.preventDefault()
    if (key === 'ArrowLeft') seek(-10)
    else if (key === 'ArrowRight') seek(10)
    else if (key === 'PlayPause' || key === 'Space') togglePlay()
    else if (key === 'Escape') exitPlayer()
    return
  }

  const screen = store.screen
  if (screen === 'home') {
    e.preventDefault()
    let idx = store.menuIndex
    if (key === 'ArrowUp') { idx--; if (idx < 0) idx = HOME_MENU.length - 1 }
    else if (key === 'ArrowDown') { idx++; if (idx >= HOME_MENU.length) idx = 0 }
    else if (key === 'Enter') { selectHomeItem(idx); return }
    else return
    store.menuIndex = idx
    scrollMenuTo(idx)
  } else if (screen === 'list') {
    e.preventDefault()
    const items = $$('.local-item, .page-btn, .sub-item')
    if (!items.length) return
    let idx = items.findIndex(i => i.classList.contains('focused'))
    if (idx < 0) idx = 0
    if (key === 'ArrowUp') { idx--; if (idx < 0) idx = items.length - 1 }
    else if (key === 'ArrowDown') { idx++; if (idx >= items.length) idx = 0 }
    else if (key === 'Enter') { selectListItem(items, idx); return }
    else if (key === 'Escape') { renderHome(); switchScreenLocal('home'); setHeader('WebPhim', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    else return
    items.forEach(i => i.classList.remove('focused'))
    items[idx].classList.add('focused')
    items[idx].scrollIntoView({ block: 'nearest' })
  } else if (screen === 'detail') {
    e.preventDefault()
    const items = $$('.fav-btn, .episode-btn')
    if (!items.length) return
    let idx = items.findIndex(i => i.classList.contains('focused'))
    if (idx < 0) idx = 0
    if (key === 'ArrowUp') { idx--; if (idx < 0) idx = items.length - 1 }
    else if (key === 'ArrowDown') { idx++; if (idx >= items.length) idx = 0 }
    else if (key === 'Enter') {
      const el = items[idx]
      if (el.classList.contains('fav-btn')) {
        const slug = el.dataset.slug
        if (slug) {
          toggleFav(slug, store.currentMovie)
          el.textContent = isFav(slug) ? '★' : '☆'
        }
      } else {
        const serverIdx = parseInt(el.dataset.server)
        const epIdx = parseInt(el.dataset.ep)
        if (!isNaN(serverIdx) && !isNaN(epIdx)) { store.episodeFocusIdx = idx; playEpisode(serverIdx, epIdx) }
      }
      return
    }
    else if (key === 'Escape') { switchScreenLocal(store.prevScreen || 'home'); setHeader('WebPhim', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    else return
    items.forEach(i => i.classList.remove('focused'))
    items[idx].classList.add('focused')
    items[idx].scrollIntoView({ block: 'nearest' })
  }
}

function handleClick(e) {
  if ($('#player-wrap').classList.contains('active')) {
    if (e.target.closest('#player-exit-btn')) { exitPlayer(); return }
    if (e.target.closest('#player-fs-btn')) { document.documentElement.requestFullscreen?.().catch(() => {}); return }
    if (e.target.closest('#player-center-btn')) { togglePlay(); return }
    if (e.target.closest('#p-seekbar')) { seekTo(e); return }
    if (e.target === $('#player')) togglePlay()
    showOverlay()
    return
  }

  const screen = store.screen
  if (e.target.closest('.search-btn')) {
    const inp = $('.search-input')
    if (inp && inp.value.trim()) { store.searchMode = false; loadMovieList('search', 1, inp.value.trim(), '', ''); setHeader('Tìm: ' + inp.value.trim(), '') }
    return
  }

  if (screen === 'home') {
    const result = handleHomeClick(e)
    if (result && result.action === 'selectHome') selectHomeItem(result.idx)
  } else if (screen === 'list') {
    const result = handleListClick(e)
    if (result) {
      if (result.action === 'detail') { loadDetail(result.slug); setHeader('', '') }
      else if (result.action === 'page') loadMovieList(store.listType, result.page, store.currentKeyword, store.categorySlug, store.countrySlug)
      else if (result.action === 'subSelect') {
        const label = e.target.textContent
        if (result.type === 'category') { store.categorySlug = result.slug; loadMovieList('category', 1, '', result.slug, ''); setHeader(label, '↑↓ Chọn | Enter xem') }
        else if (result.type === 'country') { store.countrySlug = result.slug; loadMovieList('country', 1, '', '', result.slug); setHeader(label, '↑↓ Chọn | Enter xem') }
      }
    }
  } else if (screen === 'detail') {
    const result = handleDetailClick(e)
    if (result && result.action === 'play') playEpisode(result.serverIdx, result.epIdx)
  }
}

let lastTap = 0
let lastTapX = 0
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0

function handleTouchStart(e) {
  const touch = e.changedTouches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchStartTime = Date.now()
}

function handleTouch(e) {
  const touch = e.changedTouches[0]
  const now = Date.now()

  if (store.currentMovie && e.target.closest('#player-wrap') && !e.target.closest('#p-seekbar, #player-overlay, .p-controls')) {
    const dt = now - lastTap
    const dx = Math.abs(touch.clientX - lastTapX)
    lastTap = now
    lastTapX = touch.clientX
    if (dt < 300 && dx < 40) {
      e.preventDefault()
      if (touch.clientX < window.innerWidth / 2) {
        seek(-10)
      } else {
        seek(10)
      }
    }
    return
  }

  if (e.target.closest('#player-wrap')) return
  const dt = now - touchStartTime
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  if (dt < 300 && dx > 50 && Math.abs(dx) > Math.abs(dy) * 2) {
    e.preventDefault()
    goBack()
  }
}

function autoFullscreen() {
  const el = document.documentElement
  const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen
  if (fn) {
    fn.call(el).catch(() => {})
  }
}

function init() {
  buildShell()
  renderHome()
  setHeader('WebPhim', '↑↓ Chọn | Enter vào')
  setHomeSelectHandler(idx => selectHomeItem(idx))
  document.addEventListener('keydown', handleKey)
  document.addEventListener('click', handleClick)
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchend', handleTouch)
  $('#header-back').addEventListener('click', goBack)
  $('#nav-back').addEventListener('click', goBack)
  $('#nav-home').addEventListener('click', () => { if (store.screen !== 'home') goHome() })
  setTimeout(autoFullscreen, 10000)
}

function goHome() {
  if ($('#player-wrap').classList.contains('active')) {
    exitPlayer()
  }
  renderHome()
  switchScreenLocal('home')
  setHeader('WebPhim', '')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

init()
