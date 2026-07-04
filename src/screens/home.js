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
  html += '</div></div>'
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
  const virtualCenter = Math.floor(total * 1.5) + sel

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
  const btn = e.target.closest('.wheel-item')
  if (!btn) return
  const vp = $('#wheel-vp')
  if (!vp) return
  const rect = btn.getBoundingClientRect()
  const btnCenter = rect.top + rect.height / 2
  const vpRect = vp.getBoundingClientRect()
  const vpCenter = vpRect.top + vpRect.height / 2
  if (Math.abs(btnCenter - vpCenter) > STEP / 2) return
  tapped = true
  doSelect(parseInt(btn.dataset.idx))
}

function onWheel(e) {
  e.preventDefault()
  sel += e.deltaY > 0 ? 1 : -1
  snapTo(sel)
}

let eventsBound = false

function bindWheelEvents() {
  if (eventsBound) return
  eventsBound = true
  const root = $('#screen-home')
  if (!root) return
  root.addEventListener('touchstart', e => { if (e.target.closest('.wheel-viewport')) onStart(e.touches[0].clientY) }, { passive: true })
  root.addEventListener('touchmove', e => { if (onMove) { const t = e.touches[0]; if (t) onMove(t.clientY) } }, { passive: true })
  root.addEventListener('touchend', e => { onEnd(e) }, { passive: true })
  root.addEventListener('mousedown', e => { if (e.target.closest('.wheel-viewport')) { e.preventDefault(); onStart(e.clientY) } })
  document.addEventListener('mousemove', e => { if (dragging) onMove(e.clientY) })
  document.addEventListener('mouseup', e => { if (dragging) { dragging = false; snapTo(sel) } })
  root.addEventListener('wheel', e => { if (e.target.closest('.wheel-wrap')) onWheel(e) }, { passive: false })
}

document.addEventListener('homeselect', e => {
  const handler = window.__homeSelectHandler
  if (handler) handler(e.detail.idx)
})

export function setHomeSelectHandler(fn) {
  window.__homeSelectHandler = fn
}

export function handleHomeClick(e) {
  if (tapped) { tapped = false; return null }
  const btn = e.target.closest('.wheel-item')
  if (!btn) return
  const vp = $('#wheel-vp')
  if (!vp) return
  const rect = btn.getBoundingClientRect()
  const btnCenter = rect.top + rect.height / 2
  const vpRect = vp.getBoundingClientRect()
  const vpCenter = vpRect.top + vpRect.height / 2
  if (Math.abs(btnCenter - vpCenter) > STEP / 2) return
  doSelect(parseInt(btn.dataset.idx))
  return null
}
