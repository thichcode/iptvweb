import { $, $$, HOME_MENU, KEY_MAP, store, switchScreen, toggleLargeMode } from './utils.js'
import { renderHome, handleHomeClick, loadHomeData, resetHomeFocus, navigateHome, selectHomeFocused, handleActionRow, focusedRow } from './screens/home.js'
import {
  renderMovieList, renderSubList, renderSearchInput, renderLocalList,
  loadMovieList, loadCategories, loadCountries, loadFavorites, loadHistory,
  handleListClick, limitRenderedItems
} from './screens/list.js'
import { loadDetail, handleDetailClick } from './screens/detail.js'
import { isFav, toggleFav } from './store.js'
import { playEpisode, exitPlayer, togglePlay, seek, seekTo, showOverlay } from './screens/player.js'
import { checkUpdate, showUpdateModal, initUpdateChecker } from './update.js'
import { loadMovies, searchLocal } from './data.js'
import { checkApiHealth, getApiSource, nextApiSource, setApiSource } from './api.js'

let overlayTimer = null
let homeToolbarIdx = -1

function getHomeToolbarItems() {
  const items = []
  $$('.top-nav-btn').forEach(el => items.push(el))
  ;['header-search-input', 'header-search-btn', 'check-update-btn', 'api-toggle-btn', 'mode-btn'].forEach(id => {
    const el = $(`#${id}`)
    if (el) items.push(el)
  })
  return items
}

function focusHomeToolbar(items) {
  items.forEach((el, i) => el.classList.toggle('toolbar-focused', i === homeToolbarIdx))
  const active = items[homeToolbarIdx]
  if (active) {
    if (active.id === 'header-search-input') active.focus()
    else active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

function clearHomeToolbar(items) {
  items.forEach(el => el.classList.remove('toolbar-focused'))
}

function buildShell() {
  document.getElementById('app').innerHTML = `
    <div class="header">
      <span id="header-back" class="header-back" style="display:none">←</span>
      <h1 id="header-title"><span>Web</span>Phim</h1>
      <nav class="top-nav" aria-label="Điều hướng chính">
        <button class="top-nav-btn active" data-nav="home">⌂ Trang chủ</button>
        <button class="top-nav-btn" data-nav="phim-moi-cap-nhat">Phim Mới</button>
        <button class="top-nav-btn" data-nav="phim-le">Phim Lẻ</button>
        <button class="top-nav-btn" data-nav="phim-bo">Phim Bộ</button>
        <button class="top-nav-btn" data-nav="categories">Thể Loại</button>
        <button class="top-nav-btn" data-nav="favorites">Yêu Thích</button>
        <button class="top-nav-btn" data-nav="history">Lịch Sử</button>
        <a class="top-nav-btn apk-nav-link" href="https://github.com/thichcode/iptvweb/releases/latest/download/WebPhim.apk" target="_blank" rel="noopener">Tải APK</a>
      </nav>
      <div class="header-search">
        <input id="header-search-input" type="search" placeholder="Tìm phim..." aria-label="Tìm phim">
        <button id="header-search-btn" aria-label="Tìm kiếm">⌕</button>
      </div>
      <button class="settings-btn" id="check-update-btn" aria-label="Kiểm tra cập nhật" title="Kiểm tra cập nhật">⬆</button>
      <button class="api-toggle-btn" id="api-toggle-btn" aria-label="Chọn API"><span class="api-dot pending"></span><span id="api-toggle-label">API: Proxy</span></button>
      <button class="settings-btn" id="mode-btn" aria-label="Chế độ chữ">⚙</button>
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
      <div class="nav-btn" id="nav-back" role="button" aria-label="Quay lại">← <span class="label">Quay lại</span></div>
      <div class="nav-btn" id="nav-home" role="button" aria-label="Trang chủ"><span class="label">Trang chủ</span></div>
    </div>`
}

function setHeader(title, hint) {
  const ht = $('#header-title')
  const hh = $('#header-hint')
  if (ht) ht.innerHTML = '<span>Web</span>Phim'
  if (hh) hh.textContent = hint || ''
  document.title = (title && title !== 'WebPhim' ? title + ' — ' : '') + 'WebPhim'
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
    switchScreenLocal('home')
    resetHomeFocus()
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

  if (e.target?.id === 'header-search-input') {
    if (key === 'Enter') {
      e.preventDefault()
      runHeaderSearch()
    }
    return
  }

  if (store.searchMode) {
    if (key === 'Enter') {
      const inp = $('.search-input')
      if (inp && inp.value.trim()) { e.preventDefault(); doSearch(inp.value.trim()) }
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
    const tbItems = getHomeToolbarItems()
    if (homeToolbarIdx >= 0) {
      if (key === 'ArrowRight') { homeToolbarIdx = (homeToolbarIdx + 1) % tbItems.length; focusHomeToolbar(tbItems); return }
      else if (key === 'ArrowLeft') { homeToolbarIdx = (homeToolbarIdx - 1 + tbItems.length) % tbItems.length; focusHomeToolbar(tbItems); return }
      else if (key === 'ArrowDown') { homeToolbarIdx = -1; clearHomeToolbar(tbItems); navigateHome('reset'); return }
      else if (key === 'Enter') { const el = tbItems[homeToolbarIdx]; if (el.id === 'header-search-input') el.focus(); else el.click(); return }
      else if (key === 'Escape') { homeToolbarIdx = -1; clearHomeToolbar(tbItems); return }
      return
    }
    if (key === 'ArrowUp' && focusedRow === 0) { homeToolbarIdx = 0; focusHomeToolbar(tbItems); return }
    if (key === 'ArrowUp') { navigateHome('up'); return }
    else if (key === 'ArrowDown') { navigateHome('down'); return }
    else if (key === 'ArrowLeft') { navigateHome('left'); return }
    else if (key === 'ArrowRight') { navigateHome('right'); return }
    else if (key === 'Enter') { selectHomeFocused(); return }
    else return
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
    if (e.target.closest('.player-error-close')) { exitPlayer(); return }
    if (e.target.closest('#player-fs-btn')) { document.documentElement.requestFullscreen?.().catch(() => {}); return }
    if (e.target.closest('#player-center-btn')) { togglePlay(); return }
    if (e.target.closest('#p-seekbar')) { seekTo(e); return }
    if (e.target === $('#player')) togglePlay()
    showOverlay()
    return
  }

  const screen = store.screen

  const nav = e.target.closest('.top-nav-btn[data-nav]')
  if (nav) {
    handleTopNav(nav.dataset.nav)
    return
  }

  if (e.target.closest('#header-search-btn')) {
    runHeaderSearch()
    return
  }

  if (e.target.closest('#check-update-btn')) {
    checkUpdate().then(info => { if (info) showUpdateModal(info); else alert('Bạn đang dùng phiên bản mới nhất!') })
    return
  }

  if (e.target.closest('#api-toggle-btn')) {
    setApiSource(nextApiSource())
    updateApiToggle()
    loadHomeData()
    return
  }

  if (e.target.closest('#mode-btn')) {
    toggleLargeMode()
    return
  }

  if (e.target.closest('.search-btn')) {
    const inp = $('.search-input')
    if (inp && inp.value.trim()) doSearch(inp.value.trim())
    return
  }

  if (screen === 'home') {
    const result = handleHomeClick(e)
    if (result) {
      if (result.action === 'detail') { loadDetail(result.slug); setHeader('', '') }
      else if (result.action === 'menu') {
        if (result.id === 'search') { store.searchMode = true; renderSearchInput(store.currentKeyword); switchScreenLocal('list'); setHeader('Tìm Kiếm', 'Enter để tìm'); return }
        handleActionRow(result.id)
      }
    }
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

function doSearch(keyword) {
  if (!keyword) return
  store.searchMode = false
  setHeader('Tìm: ' + keyword, '')
  const local = searchLocal(keyword, 1, 20)
  if (local.items.length) {
    switchScreenLocal('list')
    renderMovieList(limitRenderedItems(local.items), 1, local.totalPages, 'search')
  } else {
    loadMovieList('search', 1, keyword, '', '')
  }
}

function runHeaderSearch() {
  const inp = $('#header-search-input')
  doSearch(inp?.value.trim())
}

function updateApiToggle() {
  const labelMap = { proxy: 'Proxy', ophim: 'OPhim', phimapi: 'PhimAPI' }
  const source = getApiSource()
  const label = $('#api-toggle-label')
  const dot = $('.api-dot')
  if (label) label.textContent = 'API: ' + labelMap[source]
  if (dot) dot.className = 'api-dot pending'
  checkApiHealth(source).then(ok => {
    if (getApiSource() !== source) return
    const currentDot = $('.api-dot')
    if (currentDot) currentDot.className = 'api-dot ' + (ok ? 'ok' : 'err')
  })
}

function handleTopNav(id) {
  $$('.top-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.nav === id))
  store.searchMode = false
  store.currentKeyword = ''
  store.categorySlug = ''
  store.countrySlug = ''
  if (id === 'home') { goHome(); return }
  if (id === 'categories') { loadCategories(); setHeader('Thể Loại', ''); return }
  if (id === 'favorites') { loadFavorites(); switchScreenLocal('list'); setHeader('Yêu Thích', ''); return }
  if (id === 'history') { loadHistory(); switchScreenLocal('list'); setHeader('Lịch Sử', ''); return }
  loadMovieList(id, 1, '', '', '')
  const labelMap = { 'phim-moi-cap-nhat':'Phim Mới', 'phim-bo':'Phim Bộ', 'phim-le':'Phim Lẻ' }
  setHeader(labelMap[id] || 'WebPhim', '')
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
  loadMovies()
  loadHomeData()
  setHeader('WebPhim', '↑↓ Chọn hàng | ←→ Chọn phim | Enter xem')
  document.addEventListener('keydown', handleKey)
  document.addEventListener('click', handleClick)
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchend', handleTouch)
  $('#header-back').addEventListener('click', goBack)
  $('#nav-back').addEventListener('click', goBack)
  $('#nav-home').addEventListener('click', () => { if (store.screen !== 'home') goHome() })
  setTimeout(autoFullscreen, 10000)
  updateApiToggle()
  initUpdateChecker()
}

function goHome() {
  if ($('#player-wrap').classList.contains('active')) {
    exitPlayer()
  }
  // No need to renderHome here if data is already loaded
  switchScreenLocal('home')
  $$('.top-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.nav === 'home'))
  resetHomeFocus()
  setHeader('WebPhim', '')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

init()
