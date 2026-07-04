import { HOME_MENU, $, $$, store } from '../utils.js'

const ITEM_H = 48
const STEP = 56
let sel = 0, touchY = 0, touchOff = 0, dragging = false

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

function onStart(y) {
  touchY = y
  dragging = true
}

function onMove(y) {
  if (!dragging) return
  const dy = (touchY - y) * 0.8
  touchOff += dy
  touchY = y
  const stepOff = Math.round(touchOff / STEP)
  if (stepOff !== 0) {
    sel += stepOff
    touchOff -= stepOff * STEP
  }
  updateWheel(touchOff)
}

function onEnd() {
  dragging = false
  snapTo(sel)
}

function bindWheelEvents() {
  const vp = $('#wheel-vp')
  if (!vp) return
  vp.addEventListener('touchstart', e => onStart(e.touches[0].clientY), { passive: true })
  vp.addEventListener('touchmove', e => onMove(e.touches[0].clientY), { passive: false })
  vp.addEventListener('touchend', onEnd, { passive: true })
  vp.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientY) })
  vp.addEventListener('mousemove', e => { if (dragging) onMove(e.clientY) })
  vp.addEventListener('mouseup', onEnd)
  vp.addEventListener('mouseleave', onEnd)
  vp.addEventListener('wheel', e => { e.preventDefault(); sel += e.deltaY > 0 ? 1 : -1; snapTo(sel) }, { passive: false })
}

export function handleHomeClick(e) {
  const btn = e.target.closest('.wheel-item')
  if (!btn) return
  const idx = parseInt(btn.dataset.idx)
  const vp = $('#wheel-vp')
  if (!vp) return
  const vh = vp.clientHeight || 360
  const rect = btn.getBoundingClientRect()
  const btnCenter = rect.top + rect.height / 2
  const vpRect = vp.getBoundingClientRect()
  const vpCenter = vpRect.top + vpRect.height / 2
  const dist = Math.abs(btnCenter - vpCenter)
  if (dist > STEP / 2) return
  if (idx !== ((sel % HOME_MENU.length) + HOME_MENU.length) % HOME_MENU.length) { snapTo(idx); return }
  return { action: 'selectHome', idx }
}
