import { $, $$, HOME_MENU, KEY_MAP, store, switchScreen } from './utils.js'
import { renderHome, handleHomeClick, loadHomeData, resetHomeFocus, navigateHome, selectHomeFocused, handleActionRow, focusedRow } from './screens/home.js'
import {
  renderMovieList, renderSubList, renderSearchInput, renderLocalList,
  loadMovieList, loadCategories, loadCountries, loadFavorites, loadHistory,
  handleListClick, limitRenderedItems
} from './screens/list.js'
import { loadDetail, handleDetailClick } from './screens/detail.js'
import { playEpisode, exitPlayer, togglePlay, seek, seekTo, showOverlay, openWatchPanel, isWatchPanelOpen, watchPanelMove, watchPanelSelect } from './screens/player.js'
import { checkUpdate, showUpdateModal, initUpdateChecker } from './update.js'
import { searchLocal } from './data.js'
import { checkApiHealth, getApiSource, nextApiSource, setApiSource } from './api.js'
import { showKeyboard, hideKeyboard } from './keyboard.js'

let overlayTimer = null
let homeToolbarIdx = -1
let imgFailCount = 0

function announce(msg) {
  const el = $('#sr-announcer')
  if (el) { el.textContent = ''; requestAnimationFrame(() => { el.textContent = msg }) }
}

function showToast(msg) {
  let t = $('#toast-msg')
  if (!t) {
    t = document.createElement('div')
    t.id = 'toast-msg'
    document.body.appendChild(t)
  }
  clearTimeout(t._hide)
  t.textContent = msg
  t.classList.remove('show')
  requestAnimationFrame(() => t.classList.add('show'))
  t._hide = setTimeout(() => {
    t.classList.remove('show')
    setTimeout(() => { if (t.parentNode && !t.classList.contains('show')) t.remove() }, 300)
  }, 2500)
}

function getHomeToolbarItems() {
  const items = []
  $$('.top-nav-btn').forEach(el => { if (el.offsetParent !== null) items.push(el) })
  ;['header-search-input', 'header-search-btn', 'api-toggle-btn', 'thumb-btn'].forEach(id => {
    const el = $(`#${id}`)
    if (el) items.push(el)
  })
  return items
}

function focusHomeToolbar(items) {
  items.forEach((el, i) => el.classList.toggle('toolbar-focused', i === homeToolbarIdx))
  const active = items[homeToolbarIdx]
  if (active) {
    active.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }
}

function clearHomeToolbar(items) {
  items.forEach(el => el.classList.remove('toolbar-focused'))
  const inp = $('#header-search-input')
  if (inp && document.activeElement === inp) inp.blur()
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
        <button class="top-nav-btn" data-nav="countries">Quốc Gia</button>
        <button class="top-nav-btn" data-nav="favorites">Yêu Thích</button>
        <button class="top-nav-btn" data-nav="history">Lịch Sử</button>
        <a class="top-nav-btn apk-nav-link" href="https://github.com/thichcode/iptvweb/releases/latest/download/WebPhim.apk" target="_blank" rel="noopener">Tải APK</a>
      </nav>
      <div class="header-search">
        <input id="header-search-input" type="search" placeholder="Tìm phim..." aria-label="Tìm phim">
        <button id="header-search-btn" aria-label="Tìm kiếm">⌕</button>
      </div>
      
      <button class="api-toggle-btn" id="api-toggle-btn" aria-label="Chọn API"><span class="api-dot pending"></span><span id="api-toggle-label">API: Proxy</span></button>
      <button class="settings-btn" id="thumb-btn" aria-label="Bật/tắt ảnh">🖼</button>
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
          <div class="p-hint">← → Tua  |  ↓ Menu  |  Enter Play/Pause  |  Back thoát</div>
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
      <div class="nav-btn" id="nav-search-btn" role="button" aria-label="Tìm kiếm">⌕ <span class="label">Tìm</span></div>
      <div class="nav-btn" id="nav-home" role="button" aria-label="Trang chủ">⌂ <span class="label">Trang chủ</span></div>
      <div class="nav-btn" id="nav-fav" role="button" aria-label="Yêu thích">♥ <span class="label">Yêu thích</span></div>
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
      if (items.length) {
        items.forEach(i => i.classList.remove('focused'))
        items[0]?.classList.add('focused')
        items[0]?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
      }
    })
  }
}

let backPressTs = 0
function goBack() {
  if ($('#exit-confirm') || $('#update-modal')) {
    removeExitConfirm()
    const um = $('#update-modal')
    if (um) um.remove()
    return
  }
  const screen = store.screen
  if ($('#player-wrap').classList.contains('active')) {
    exitPlayer()
  } else if (screen === 'detail') {
    switchScreenLocal(store.prevScreen || 'home')
    setHeader('WebPhim', '')
    if (store.prevScreen === 'list' && store._listScrollY != null) {
      window.scrollTo({ top: store._listScrollY, behavior: 'auto' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } else if (screen === 'list') {
    switchScreenLocal('home')
    resetHomeFocus()
    setHeader('WebPhim', '')
    window.scrollTo({ top: 0, behavior: 'auto' })
  } else if (screen === 'home') {
    showExitConfirm()
  }
}

let exitDialogIdx = 1 // default "Không"
function removeExitConfirm() {
  exitDialogIdx = 1
  const el = $('#exit-confirm')
  if (el) el.remove()
}
function showExitConfirm() {
  removeExitConfirm()
  exitDialogIdx = 1
  const el = document.createElement('div')
  el.id = 'exit-confirm'
  el.innerHTML = `<div class="exit-backdrop"></div><div class="exit-box"><div class="exit-icon">🚪</div><div class="exit-msg">Thoát ứng dụng?</div><div class="exit-actions"><button class="exit-btn" data-action="exit">Thoát</button><button class="exit-btn exit-active" data-action="cancel">Không</button></div></div>`
  document.body.appendChild(el)
}
function executeExit() {
  try {
    const cap = window.Capacitor
    if (cap?.Plugins?.App) {
      cap.Plugins.App.exitApp()
      return
    }
  } catch {}
  window.close()
}


function selectListItem(items, idx) {
  if (idx < 0 || idx >= items.length) return
  const item = items[idx]
  if (item.classList.contains('local-item')) {
    const slug = item.dataset.slug
    if (slug) { store._listScrollY = window.scrollY; loadDetail(slug); setHeader('', '') }
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
  let handled = false

  if (e.target?.id === 'header-search-input') {
    if (key === 'ArrowDown') { e.preventDefault(); e.target.blur(); homeToolbarIdx = -1; clearHomeToolbar(getHomeToolbarItems()); return }
    if (key === 'Enter') {
      e.preventDefault()
      if (e.target.value.trim()) runHeaderSearch()
      else showKeyboard() // PITFALL Android TV: ô rỗng + Enter phải mở bàn phím, không search rỗng
      return
    }
    if (key === 'Escape') { e.preventDefault(); e.target.blur(); homeToolbarIdx = -1; clearHomeToolbar(getHomeToolbarItems()); return }
    return
  }

  if ($('#exit-confirm')) {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault()
      const btns = $$('#exit-confirm .exit-btn')
      exitDialogIdx = (exitDialogIdx + (key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length
      btns.forEach((b, i) => b.classList.toggle('exit-active', i === exitDialogIdx))
      return handled
    }
    if (key === 'Enter') { e.preventDefault(); const btns = $$('#exit-confirm .exit-btn'); btns[exitDialogIdx]?.click(); return handled }
    if (key === 'Escape') { e.preventDefault(); removeExitConfirm(); return handled }
    return handled
  }
  if ($('#update-modal')) {
    if (key === 'Escape') { e.preventDefault(); const m = $('#update-modal'); if (m) m.remove(); return handled }
    if (key === 'Enter') { e.preventDefault(); const dl = $('.update-dl'); if (dl) dl.click(); else { const m = $('#update-modal'); if (m) m.remove() } return handled }
    return handled
  }

  if (store.searchMode) {
    const inp = $('.search-input')
    // PITFALL Android TV: nếu input chưa được focus (autofocus fail trong WebView),
    // mọi phím chữ sẽ bị nuốt. Focus input khi user bấm ký tự nhập được.
    if (inp && document.activeElement !== inp && key && key.length === 1 && /^[\p{L}\p{N}]$/u.test(key)) {
      e.preventDefault()
      inp.focus()
      inp.value += key
      inp.setSelectionRange(inp.value.length, inp.value.length)
      return
    }
    if (key === 'ArrowDown' || key === 'Enter') {
      if (inp && inp.value.trim()) { e.preventDefault(); doSearch(inp.value.trim()) }
    }
    if (key === 'Escape') {
      e.preventDefault(); store.searchMode = false; hideKeyboard(); renderHome(); switchScreenLocal('home'); setHeader('WebPhim', '')
    }
    return
  }

  if ($('#player-wrap').classList.contains('active')) {
    e.preventDefault()
    // ponytail: watch-mode panel owns D-pad while open; Back closes player only on 2nd press
    if (isWatchPanelOpen()) {
      if (key === 'ArrowDown' || key === 'ArrowRight') watchPanelMove(1)
      else if (key === 'ArrowUp' || key === 'ArrowLeft') watchPanelMove(-1)
      else if (key === 'PlayPause' || key === 'Space' || key === 'Enter') watchPanelSelect()
      else if (key === 'Escape') exitPlayer()
      return
    }
    if (key === 'ArrowLeft') seek(-10)
    else if (key === 'ArrowRight') seek(10)
    else if (key === 'ArrowDown' || key === 'ArrowUp') showOverlay()
    else if (key === 'PlayPause' || key === 'Space' || key === 'Enter') togglePlay()
    else if (key === 'f' || key === 'F') { document.documentElement.requestFullscreen?.().catch(() => {}) }
    else if (key === 'Escape') openWatchPanel()
    return
  }

  if (key === '/' && !store.searchMode) {
    e.preventDefault()
    if (store.screen !== 'home') {
      renderHome(); switchScreenLocal('home'); setHeader('WebPhim', '')
    }
    const inp = $('#header-search-input')
    if (inp) { inp.focus() }
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
      else if (key === 'Enter') {
        const el = tbItems[homeToolbarIdx]
        if (el.id === 'header-search-input') { el.focus() }
        else { el.click() }
        return
      }
      else if (key === 'Escape') { homeToolbarIdx = -1; clearHomeToolbar(tbItems); return }
      return
    }
    if (key === 'ArrowUp' && focusedRow === 0) { const si = tbItems.findIndex(el => el.id === 'header-search-input'); homeToolbarIdx = si >= 0 ? si : 0; focusHomeToolbar(tbItems); return }
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

    const grid = $('.movie-grid')
    const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 1

    if (key === 'ArrowUp') {
      if (idx === 0) { renderHome(); switchScreenLocal('home'); setHeader('WebPhim', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
      else if (grid && idx < grid.children.length && idx >= cols) {
        const gi = idx - cols
        idx = items.findIndex(i => i === grid.children[gi])
      } else { idx-- }
    } else if (key === 'ArrowDown') {
      if (grid && idx < grid.children.length && idx + cols < grid.children.length) {
        const gi = idx + cols
        idx = items.findIndex(i => i === grid.children[gi])
      } else { idx++; if (idx >= items.length) idx = 0 }
    } else if (key === 'ArrowLeft') {
      if (grid && idx < grid.children.length && idx > 0) { idx-- }
      else if (idx <= 0) { renderHome(); switchScreenLocal('home'); setHeader('WebPhim', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
      else { idx-- }
    } else if (key === 'ArrowRight') {
      if (grid && idx < grid.children.length && idx < grid.children.length - 1) { idx++ }
      else { idx++; if (idx >= items.length) idx = 0 }
    } else if (key === 'Enter') { selectListItem(items, idx); return }
    else if (key === 'Escape') { renderHome(); switchScreenLocal('home'); setHeader('WebPhim', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    else return
    items.forEach(i => i.classList.remove('focused'))
    items[idx].classList.add('focused')
    items[idx].scrollIntoView({ block: 'nearest' })
  } else if (screen === 'detail') {
    e.preventDefault()
    const items = $$('.episode-btn, .fav-btn, .fav-fab, #server-select')
    if (!items.length) return
    let idx = items.findIndex(i => i.classList.contains('focused'))
    if (idx < 0) idx = 0

    const serverRanges = {}
    items.forEach((btn, i) => {
      const s = parseInt(btn.dataset.server)
      if (!serverRanges[s]) serverRanges[s] = { start: i, end: i }
      else serverRanges[s].end = i
    })

    if (key === 'ArrowUp' && idx <= 0) { switchScreenLocal(store.prevScreen || 'home'); setHeader('WebPhim', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    else if (key === 'ArrowUp') { idx-- }
    else if (key === 'ArrowDown') { idx++; if (idx >= items.length) idx = 0 }
    else if (key === 'ArrowLeft') {
      const s = parseInt(items[idx].dataset.server)
      if (isNaN(s)) { if (idx > 0) idx--; else idx = items.length - 1 }
      else {
        const range = serverRanges[s]
        if (idx > range.start) idx--
        else {
          const prev = s - 1
          if (serverRanges[prev]) idx = serverRanges[prev].end
          else idx = items.length - 1
        }
      }
    }
    else if (key === 'ArrowRight') {
      const s = parseInt(items[idx].dataset.server)
      if (isNaN(s)) { if (idx < items.length - 1) idx++; else idx = 0 }
      else {
        const range = serverRanges[s]
        if (idx < range.end) idx++
        else {
          const next = s + 1
          if (serverRanges[next]) idx = serverRanges[next].start
          else idx = 0
        }
      }
    }
    else if (key === 'Enter') {
      const el = items[idx]
      if (el.id === 'server-select') { el.focus(); return }
      const serverIdx = parseInt(el.dataset.server)
      const epIdx = parseInt(el.dataset.ep)
      if (!isNaN(serverIdx) && !isNaN(epIdx)) { store.episodeFocusIdx = idx; playEpisode(serverIdx, epIdx) }
      return
    }
    else if (key === 'Escape') { switchScreenLocal(store.prevScreen || 'home'); setHeader('WebPhim', ''); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    else return
    items.forEach(i => i.classList.remove('focused'))
    items[idx].classList.add('focused')
    items[idx].scrollIntoView({ block: 'nearest' })

    const focusedServer = parseInt(items[idx].dataset.server)
    if (!isNaN(focusedServer)) {
      $$('.server-name').forEach(el => {
        el.classList.toggle('server-focused', parseInt(el.dataset.server) === focusedServer)
      })
    }
  }
}

function handleClick(e) {
  if ($('#player-wrap').classList.contains('active')) {
    const wpItem = e.target.closest('#watch-panel .wp-item')
    if (wpItem) { watchPanelSelect(wpItem); return }
    if (e.target.closest('#player-exit-btn')) { exitPlayer(); return }
    if (e.target.closest('.player-error-close')) { exitPlayer(); return }
    if (e.target.closest('#player-fs-btn')) { document.documentElement.requestFullscreen?.().catch(() => {}); return }
    if (e.target.closest('#player-center-btn')) { togglePlay(); return }
    if (e.target.closest('#p-seekbar')) { seekTo(e); return }
    if (e.target === $('#player')) togglePlay()
    showOverlay()
    return
  }

  if (e.target.closest('#exit-confirm .exit-backdrop')) { removeExitConfirm(); return }
  if (e.target.closest('#exit-confirm .exit-btn')) {
    const action = e.target.closest('.exit-btn').dataset.action
    if (action === 'exit') executeExit()
    else removeExitConfirm()
    return
  }
  if (e.target.closest('#update-modal .update-backdrop, #update-modal .update-close')) {
    const m = $('#update-modal')
    if (m) m.remove()
    return
  }

  const screen = store.screen

  const nav = e.target.closest('.top-nav-btn[data-nav]')
  if (nav) {
    handleTopNav(nav.dataset.nav)
    if ($('#header-search-input').value) $('#header-search-input').value = ''
    return
  }

  if (e.target.closest('#header-search-btn')) {
    runHeaderSearch()
    return
  }

  if (e.target.closest('#api-toggle-btn')) {
    const lbl = $('#api-toggle-label'); if (lbl) lbl.textContent = 'API: Kiểm tra...'
    setApiSource(nextApiSource())
    updateApiToggle()
    loadHomeData()
    return
  }

  if (e.target.closest('#thumb-btn')) {
    const thumbsOn = !store.noThumb
    store.noThumb = thumbsOn
    document.body.classList.toggle('text-mode', thumbsOn)
    try { localStorage.setItem('wp_thumbs_on', thumbsOn ? '' : '1') } catch {}
    showToast(thumbsOn ? 'Đã tắt ảnh' : 'Đã bật ảnh')
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
      if (result.action === 'detail') { store._listScrollY = window.scrollY; loadDetail(result.slug); setHeader('', '') }
      else if (result.action === 'menu') {
        if (result.id === 'search') { store.searchMode = true; renderSearchInput(store.currentKeyword); switchScreenLocal('list'); setHeader('Tìm Kiếm', 'Enter để tìm'); return }
        handleActionRow(result.id)
      }
    }
  } else if (screen === 'list') {
    const result = handleListClick(e)
    if (result) {
      if (result.action === 'detail') { store._listScrollY = window.scrollY; loadDetail(result.slug); setHeader('', '') }
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
  hideKeyboard()
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
  $$('.top-nav-btn').forEach(btn => { const a = btn.dataset.nav === id; btn.classList.toggle('active', a); btn.toggleAttribute('aria-current', a) })
  store.searchMode = false
  store.currentKeyword = ''
  store.categorySlug = ''
  store.countrySlug = ''
  if (id === 'home') { goHome(); return }
  if (id === 'categories') { loadCategories(); setHeader('Thể Loại', ''); return }
  if (id === 'countries') { loadCountries(); setHeader('Quốc Gia', ''); return }
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

function detectTV() {
  const ua = navigator.userAgent
  const isTV = /Android TV|Google TV|SmartTV|Tizen|Web0S|CrKey|AFT|Roku|AppleTV|PlayStation|Xbox|(?:^|\s)TV(?:\s|$)/i.test(ua)
  if (isTV) document.body.classList.add('tv-mode')
}

function init() {
  detectTV()
  // ponytail: images off by default for everyone; a user who toggles them on is saved
  let thumbsOn = false
  try { thumbsOn = localStorage.getItem('wp_thumbs_on') === '1' } catch {}
  store.noThumb = !thumbsOn
  document.body.classList.toggle('text-mode', !thumbsOn)
  history.pushState(null, null, location.href)
  window.addEventListener('popstate', e => { e.preventDefault(); goBack() })
  document.addEventListener('error', e => { const t = e.target; if (t.tagName === 'IMG' && !t.src?.startsWith('data:')) { e.stopPropagation(); imgFailCount++; if (imgFailCount >= 3) { document.body.classList.add('text-mode'); return } const w = t.width || 200; const h = t.height || 300; t.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><rect width="' + w + '" height="' + h + '" fill="#11100D"/><rect x="' + (w * 0.1) + '" y="' + (h * 0.1) + '" width="' + (w * 0.8) + '" height="' + (h * 0.8) + '" fill="none" stroke="#766F5D" stroke-width="2" rx="4"/><path d="M' + (w * 0.42) + ' ' + (h * 0.4) + ' l0 ' + (h * 0.25) + ' l' + (w * 0.2) + ' -' + (h * 0.125) + 'z" fill="#766F5D"/></svg>') } }, true)
  buildShell()
  const headerSearchInput = $('#header-search-input')
  headerSearchInput.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = KEY_MAP[e.keyCode] || e.key
    if (key === 'Enter') {
      e.preventDefault()
      if (e.target.value.trim()) runHeaderSearch()
      else showKeyboard() // PITFALL Android TV: ô rỗng + Enter phải mở bàn phím
    }
  })
  // PITFALL Android TV: D-pad focus không mở IME — phải gọi Keyboard.show() khi input được focus
  let keyboardVisible = false
  headerSearchInput.addEventListener('focus', () => { if (!keyboardVisible) { keyboardVisible = true; showKeyboard() } })
  headerSearchInput.addEventListener('blur', () => { keyboardVisible = false; hideKeyboard() })
  loadHomeData()
  setHeader('WebPhim', '↑↓ Chọn hàng | ←→ Chọn phim | Enter xem')
  document.addEventListener('keydown', handleKey)
  document.addEventListener('click', handleClick)
  document.addEventListener('touchstart', handleTouchStart, { passive: true })
  document.addEventListener('touchend', handleTouch)
  $('#header-back').addEventListener('click', goBack)
  $('#nav-back').addEventListener('click', goBack)
  $('#nav-home').addEventListener('click', () => { if (store.screen !== 'home') goHome() })
  $('#nav-search-btn').addEventListener('click', () => {
    if (store.screen === 'home' && !store.searchMode || store.screen === 'detail') {
      store.searchMode = true
      renderSearchInput(store.currentKeyword)
      switchScreenLocal('list')
      setHeader('Tìm Kiếm', 'Enter để tìm')
    } else {
      const inp = $('.search-input')
      if (inp) inp.focus()
      else {
        store.searchMode = true
        renderSearchInput(store.currentKeyword)
        switchScreenLocal('list')
        setHeader('Tìm Kiếm', 'Enter để tìm')
      }
    }
  })
  $('#nav-fav').addEventListener('click', () => {
    loadFavorites()
    switchScreenLocal('list')
    setHeader('Yêu Thích', '')
  })
  // ponytail: Capacitor backButton — overlays goBack handles, double-press already in goBack
  try { window.Capacitor?.Plugins?.App?.addListener?.('backButton', () => goBack()) } catch {}
  setTimeout(updateApiToggle, 100)
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
