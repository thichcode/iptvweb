import { HOME_MENU, $, $$, store } from '../utils.js'

const REPEAT = 3
let menuScroll = 0

export function renderHome() {
  const container = $('#screen-home')
  const items = HOME_MENU
  let html = '<div class="welcome">WebPhim</div><div class="home-menu" id="home-menu">'
  for (let r = 0; r < REPEAT; r++) {
    for (let i = 0; i < items.length; i++) {
      html += `<div class="menu-btn" data-idx="${i}">${items[i].label}</div>`
    }
  }
  html += '</div>'
  container.innerHTML = html
  menuScroll = 0
  const el = $('#home-menu')
  if (el) {
    el.scrollLeft = items.length * 120 * REPEAT / 2
    el.addEventListener('scroll', onMenuScroll, { passive: true })
  }
  const btns = $$('.menu-btn')
  btns.forEach(b => b.classList.remove('focused'))
  const mid = Math.floor(items.length * REPEAT / 2) + (store.menuIndex || 0)
  if (btns[mid]) btns[mid].classList.add('focused')
}

function onMenuScroll() {
  const el = $('#home-menu')
  if (!el) return
  const totalW = el.scrollWidth / REPEAT
  if (el.scrollLeft < totalW * 0.2) {
    el.scrollLeft += totalW
  } else if (el.scrollLeft > totalW * (REPEAT - 0.2)) {
    el.scrollLeft -= totalW
  }
}

export function scrollMenuTo(idx) {
  const el = $('#home-menu')
  if (!el) return
  const btn = $$('.menu-btn')
  const total = HOME_MENU.length
  const midOffset = Math.floor(total * REPEAT / 2) * 130
  el.scrollLeft = midOffset + idx * 130 - el.clientWidth / 2 + 60
}

export function handleHomeClick(e) {
  const btn = e.target.closest('.menu-btn')
  if (!btn) return
  const idx = parseInt(btn.dataset.idx)
  return { action: 'selectHome', idx }
}
