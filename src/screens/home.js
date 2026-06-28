import { HOME_MENU, $, $$, scrollTo } from '../utils.js'

export function renderHome() {
  const container = $('#screen-home')
  container.innerHTML = '<div class="home-menu">' +
    HOME_MENU.map((item, i) =>
      `<div class="menu-btn" data-idx="${i}">${item.label}</div>`
    ).join('') +
    '</div>'
}

export function handleHomeClick(e) {
  const btn = e.target.closest('.menu-btn')
  if (!btn) return
  const idx = parseInt(btn.dataset.idx)
  return { action: 'selectHome', idx }
}
