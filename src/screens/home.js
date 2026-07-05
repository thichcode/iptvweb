import { HOME_MENU, $, $$, store } from '../utils.js'

const ITEM_H = 48
const STEP = 56
let sel = 0, touchY = 0, touchOff = 0, dragging = false, tapped = false

export function renderHome() {
  sel = store.menuIndex || 0
  let html = '<div class="wheel-wrap"><div class="wheel-viewport" id="wheel-vp">'
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < HOME_MENU.length; i++) {
      html += `<div class="wheel-item" data-idx="${i}">${HOME_MENU[i].label}</div>`
    }
  }
  html += '</div></div><div class="dl-apk"><a href="/apk/WebPhim.apk" target="_blank" download>Tải APK cho Android TV</a></div>'
  $('#screen-home').innerHTML = html
  requestAnimationFrame(() => updateWheel(0))
  bindWheelEvents()
}

function updateWheel(dy) {
  const items = $$('.wheel-item')
  const vp = $('#wheel-vp')
  if (!vp) return
  const vh = vp.clientHeight || 360
  const center = vh / 2
  const total = HOME_MENU.length
  const virtualCenter = total + sel

  items.forEach((el, i) => {
    const off = i - virtualCenter
    const y = off * STEP + dy
    const dist = Math.abs(off) / 2.5

    if (dist > 1.2) { el.style.display = 'none'; return }
    el.style.display = ''

    const scale = 1 - dist * 0.25
    const opacity = 1 - dist * 0.6
    const z = (1 - dist) * 40

    el.style.transform = `translateY(${center + y}px) translateZ(${z}px) scale(${Math.max(0.5, scale)})`
    el.style.opacity = Math.max(0, opacity)
    el.style.zIndex = Math.round(100 - Math.abs(off))
    el.classList.toggle('focused', Math.abs(off) < 0.3)
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
  updateWheel(0)
}

function doSelect(idx) {
  const current = ((sel % HOME_MENU.length) + HOME_MENU.length) % HOME_MENU.length
  if (idx !== current) { snapTo(idx); return }
  const evt = new CustomEvent('homeselect', { detail: { idx } })
  document.dispatchEvent(evt)
}

function onStart(y) {
  touchY = y
  dragging = false
  touchOff = 0
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

// Lưu các handler để có thể removeEventListener khi cần
let _mouseMoveHandler = null
let _mouseUpHandler = null
let _rootEl = null

function bindWheelEvents() {
  const root = $('#screen-home')
  if (!root) return

  // Nếu đã bind vào đúng root element này rồi thì bỏ qua
  if (_rootEl === root) return

  // Gỡ listener cũ trên document nếu có (tránh duplicate)
  if (_mouseMoveHandler) document.removeEventListener('mousemove', _mouseMoveHandler)
  if (_mouseUpHandler) document.removeEventListener('mouseup', _mouseUpHandler)

  _rootEl = root

  root.addEventListener('touchstart', e => { if (e.target.closest('.wheel-viewport')) onStart(e.touches[0].clientY) }, { passive: true })
  root.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) onMove(t.clientY) }, { passive: true })
  root.addEventListener('touchend', e => { onEnd(e) }, { passive: true })
  root.addEventListener('mousedown', e => { if (e.target.closest('.wheel-viewport')) { e.preventDefault(); onStart(e.clientY) } })
  root.addEventListener('wheel', e => { if (e.target.closest('.wheel-wrap')) onWheel(e) }, { passive: false })

  _mouseMoveHandler = e => { if (dragging) onMove(e.clientY) }
  _mouseUpHandler = e => { if (dragging) { dragging = false; snapTo(sel) } }
  document.addEventListener('mousemove', _mouseMoveHandler)
  document.addEventListener('mouseup', _mouseUpHandler)
}

let _homeSelectHandler = null

document.addEventListener('homeselect', e => {
  if (_homeSelectHandler) _homeSelectHandler(e.detail.idx)
})

export function setHomeSelectHandler(fn) {
  _homeSelectHandler = fn
}

export function handleHomeClick(e) {
  if (tapped) { tapped = false; return null }
  if (!e.target.closest('.wheel-viewport')) return null
  doSelect(((sel % HOME_MENU.length) + HOME_MENU.length) % HOME_MENU.length)
  return null
}
