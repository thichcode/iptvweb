import { $, $$, HOME_MENU, KEY_MAP, store } from './utils.js'
import { renderHome, handleHomeClick } from './screens/home.js'
import {
  renderMovieList, renderSubList, renderSearchInput, renderLocalList,
  loadMovieList, loadCategories, loadCountries, loadFavorites, loadHistory,
  handleListClick
} from './screens/list.js'
import { loadDetail, handleDetailClick } from './screens/detail.js'
import { isFav, toggleFav } from './store.js'
import { playEpisode, exitPlayer, togglePlay, seek } from './screens/player.js'

let overlayTimer = null

function buildShell() {
  document.getElementById('app').innerHTML = `
    <div class="header">
      <h1 id="header-title">WebPhim</h1>
      <span class="hint" id="header-hint"></span>
    </div>
    <div id="screen-home" class="screen active"></div>
    <div id="screen-list" class="screen"></div>
    <div id="screen-detail" class="screen"></div>
    <div id="player-wrap">
      <video id="player" playsinline></video>
      <div id="player-overlay">
        <div class="p-title" id="p-title"></div>
        <div class="p-hint">← → Tua  |  Space Play/Pause  |  Esc thoát</div>
      </div>
    </div>`
}

function setHeader(title, hint) {
  const ht = $('#header-title')
  const hh = $('#header-hint')
  if (ht) ht.textContent = title || 'WebPhim'
  if (hh) hh.textContent = hint || ''
}

function switchScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'))
  const el = $('#screen-' + id)
  if (el) el.classList.add('active')
  store.screen = id
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
    case 'search': store.searchMode = true; renderSearchInput(store.currentKeyword); switchScreen('list'); setHeader('Tìm Kiếm', 'Enter để tìm'); break
    case 'favorites': loadFavorites(); switchScreen('list'); setHeader('♥ Yêu Thích', ''); break
    case 'history': loadHistory(); switchScreen('list'); setHeader('Đã Xem', ''); break
    default:
      loadMovieList(item.id, 1, '', '', '')
      setHeader(item.label, '↑↓ Chọn | Enter xem')
  }
}

function selectListItem(items, idx) {
  if (idx < 0 || idx >= items.length) return
  const item = items[idx]
  if (item.classList.contains('movie-item')) {
    const slug = item.dataset.slug
    if (slug) { loadDetail(slug); setHeader('', '') }
  } else if (item.classList.contains('page-btn')) {
    const page = parseInt(item.dataset.page)
    if (!isNaN(page)) loadMovieList(store.listType, page, store.currentKeyword, store.categorySlug, store.countrySlug)
  } else if (item.classList.contains('sub-item')) {
    const slug = item.dataset.slug
    if (store.listType === 'category') { store.categorySlug = slug; loadMovieList('category', 1, '', slug, '') }
    else if (store.listType === 'country') { store.countrySlug = slug; loadMovieList('country', 1, '', '', slug) }
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
      e.preventDefault(); store.searchMode = false; renderHome(); switchScreen('home'); setHeader('WebPhim', '')
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
    const btns = $$('.menu-btn')
    btns.forEach(b => b.classList.remove('focused'))
    if (btns[idx]) btns[idx].classList.add('focused')
  } else if (screen === 'list') {
    e.preventDefault()
    const items = $$('.movie-item, .page-btn, .sub-item')
    if (!items.length) return
    let idx = items.findIndex(i => i.classList.contains('focused'))
    if (idx < 0) idx = 0
    if (key === 'ArrowUp') { idx--; if (idx < 0) idx = items.length - 1 }
    else if (key === 'ArrowDown') { idx++; if (idx >= items.length) idx = 0 }
    else if (key === 'Enter') { selectListItem(items, idx); return }
    else if (key === 'Escape') { renderHome(); switchScreen('home'); setHeader('WebPhim', ''); return }
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
    else if (key === 'Escape') { switchScreen(store.prevScreen || 'home'); setHeader('WebPhim', ''); return }
    else return
    items.forEach(i => i.classList.remove('focused'))
    items[idx].classList.add('focused')
    items[idx].scrollIntoView({ block: 'nearest' })
  }
}

function handleClick(e) {
  if ($('#player-wrap').classList.contains('active')) {
    const overlay = $('#player-overlay')
    if (overlay) {
      overlay.classList.add('show')
      if (overlayTimer) clearTimeout(overlayTimer)
      overlayTimer = setTimeout(() => overlay.classList.remove('show'), 4000)
    }
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
        if (result.type === 'category') { store.categorySlug = result.slug; loadMovieList('category', 1, '', result.slug, '') }
        else if (result.type === 'country') { store.countrySlug = result.slug; loadMovieList('country', 1, '', '', result.slug) }
      }
    }
  } else if (screen === 'detail') {
    const result = handleDetailClick(e)
    if (result && result.action === 'play') playEpisode(result.serverIdx, result.epIdx)
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
  document.addEventListener('keydown', handleKey)
  document.addEventListener('click', handleClick)
  setTimeout(autoFullscreen, 10000)
}

init()
