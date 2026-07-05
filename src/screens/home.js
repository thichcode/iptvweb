import { HOME_MENU, $, $$, store, toggleLargeMode, checkUpdate, APP_VER } from '../utils.js'
import { getToday } from '../lunar.js'

const ICONS = {
  'tv-shows': '📺', 'hoat-hinh': '🎨', 'phim-le': '🎬', 'phim-bo': '📺',
  'phim-moi-cap-nhat': '🆕', 'categories': '🎯', 'countries': '🌍',
  'history': '📋', 'favorites': '❤️', 'search': '🔍'
}

const VISIBLE = 5
const ANGLE = 40
const RADIUS = 280
const STEP = 56
let sel = 0, touchY = 0, touchOff = 0, dragging = false, tapped = false

export function renderHome() {
  sel = store.menuIndex || 0
  const d = getToday()
  let html = '<div class="wheel-bg"></div>'
  html += `<div class="date-bar"><div class="date-solar"><span class="dow">${d.dow}</span><span class="day-num">${d.solar.day}</span><span class="sub">Tháng ${d.solar.month}, ${d.solar.year}</span></div><div class="date-lunar"><span class="label">am</span><span class="day-num">${d.lunar.day}</span><span class="sub">${d.dayCanChi} · Tháng ${d.lunar.month}${d.lunar.leap ? ' (nhuận)' : ''} · ${d.yearCanChi}</span></div></div>'
  html += '<div class="wheel-wrap"><div class="wheel-indicator top">▲</div><div class="wheel-viewport" id="wheel-vp">'
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < HOME_MENU.length; i++) {
      const item = HOME_MENU[i]
      const icon = ICONS[item.id] || '•'
      html += `<div class="wheel-item" data-idx="${i}"><span class="wi-icon">${icon}</span><span class="wi-label">${item.label}</span></div>`
    }
  }
  html += '</div><div class="wheel-indicator bottom">▼</div></div><div class="dl-apk"><a href="https://github.com/thichcode/iptvweb/releases/latest/download/WebPhim.apk" target="_blank">Tải APK cho Android TV</a> <span class="mode-btn" id="mode-btn">' + (store.largeMode ? '🔍 Thường' : '👁 Chữ to') + '</span> <span class="mode-btn" id="update-btn">🔄 Cập nhật</span></div><div id="update-msg" class="update-msg"></div>'
  $('#screen-home').innerHTML = html
  requestAnimationFrame(() => updateWheel(0))
  bindWheelEvents()
}

function updateWheel(dy) {
  const items = $$('.wheel-item')
  const vp = $('#wheel-vp')
  if (!vp) return
  const total = HOME_MENU.length
  const virtualCenter = total + sel
  const frac = (dy || 0) / STEP

  vp.classList.toggle('no-transition', dragging)

  items.forEach((el, i) => {
    const off = i - virtualCenter + frac
    const absOff = Math.abs(off)
    if (absOff > VISIBLE / 2 + 0.7) { el.style.display = 'none'; return }
    el.style.display = ''
    const rotX = off * ANGLE
    const y = off * STEP
    const z = RADIUS - absOff * 50
    const s = 1 - absOff * 0.12
    el.style.transform = `translateY(${y}px) rotateX(${rotX}deg) translateZ(${Math.max(20, z)}px) scale(${Math.max(0.45, s)})`
    el.style.opacity = Math.max(0.1, Math.min(1, 1 - absOff * 0.18))
    el.classList.toggle('focused', absOff < 0.3)
  })
}

export function scrollMenuTo(idx) {
  sel = idx
  updateWheel(0)
}

function snapTo(idx) {
  sel = ((idx % HOME_MENU.length) + HOME_MENU.length) % HOME_MENU.length
  store.menuIndex = sel
  touchOff = 0
  dragging = false
  updateWheel(0)
}

function doSelect(idx) {
  const current = ((sel % HOME_MENU.length) + HOME_MENU.length) % HOME_MENU.length
  if (idx !== current) { snapTo(idx); return }
  const evt = new CustomEvent('homeselect', { detail: { idx } })
  document.dispatchEvent(evt)
}

function onStart(y) {
  touchY = y; dragging = false; touchOff = 0
}

function onMove(y) {
  const dy = (touchY - y) * 0.8
  if (Math.abs(dy) < 3) return
  dragging = true
  touchOff += dy
  touchY = y
  const stepOff = Math.round(touchOff / STEP)
  if (stepOff !== 0) {
    sel += stepOff
    touchOff -= stepOff * STEP
  }
  updateWheel(touchOff)
}

function onEnd(e) {
  if (dragging) { dragging = false; snapTo(sel); return }
  if (!e.target.closest('.wheel-viewport')) return
  tapped = true
  doSelect(((sel % HOME_MENU.length) + HOME_MENU.length) % HOME_MENU.length)
}

function onWheel(e) {
  e.preventDefault()
  sel += e.deltaY > 0 ? 1 : -1
  snapTo(sel)
}

let _mouseMoveHandler = null, _mouseUpHandler = null, _rootEl = null

function bindWheelEvents() {
  const root = $('#screen-home')
  if (!root || _rootEl === root) return
  if (_mouseMoveHandler) document.removeEventListener('mousemove', _mouseMoveHandler)
  if (_mouseUpHandler) document.removeEventListener('mouseup', _mouseUpHandler)
  _rootEl = root
  root.addEventListener('touchstart', e => { if (e.target.closest('.wheel-viewport')) onStart(e.touches[0].clientY) }, { passive: true })
  root.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) onMove(t.clientY) }, { passive: true })
  root.addEventListener('touchend', e => { onEnd(e) }, { passive: true })
  root.addEventListener('mousedown', e => { if (e.target.closest('.wheel-viewport')) { e.preventDefault(); onStart(e.clientY) } })
  root.addEventListener('wheel', e => { if (e.target.closest('.wheel-wrap')) onWheel(e) }, { passive: false })
  root.addEventListener('click', e => {
    const btn = e.target.closest('#mode-btn')
    if (btn) { toggleLargeMode(); btn.textContent = store.largeMode ? '🔍 Thường' : '👁 Chữ to' }
    const upd = e.target.closest('#update-btn')
    if (upd) checkForUpdate()
  })
  _mouseMoveHandler = e => { if (dragging) onMove(e.clientY) }
  _mouseUpHandler = e => { if (dragging) { dragging = false; snapTo(sel) } }
  document.addEventListener('mousemove', _mouseMoveHandler)
  document.addEventListener('mouseup', _mouseUpHandler)
}

let _homeSelectHandler = null

document.addEventListener('homeselect', e => {
  if (_homeSelectHandler) _homeSelectHandler(e.detail.idx)
})

export function setHomeSelectHandler(fn) { _homeSelectHandler = fn }

export async function checkForUpdate() {
  const msg = $('#update-msg')
  if (!msg) return
  msg.textContent = '🔄 Đang kiểm tra...'
  msg.className = 'update-msg'
  const data = await checkUpdate()
  if (!data) { msg.textContent = '❌ Lỗi kết nối. Thử lại sau.'; msg.className = 'update-msg err'; return }
  const cur = APP_VER
  if (data.tag === 'build-' + cur) { msg.textContent = '✅ Đã là phiên bản mới nhất (' + cur + ')'; msg.className = 'update-msg ok'; return }
  msg.innerHTML = '📥 Phiên bản mới: <strong>' + data.tag + '</strong> <a href="' + data.url + '" target="_blank" class="dl-link">Tải ngay</a>'
  msg.className = 'update-msg'
}

export function handleHomeClick(e) {
  if (tapped) { tapped = false; return null }
  if (!e.target.closest('.wheel-viewport')) return null
  const idx = ((sel % HOME_MENU.length) + HOME_MENU.length) % HOME_MENU.length
  return { action: 'selectHome', idx }
}
