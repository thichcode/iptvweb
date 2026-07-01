export { imgSrc } from './api.js'
export { store } from './store.js'

export function $(sel, ctx = document) { return ctx.querySelector(sel) }
export function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)] }

export function empty(el) { el.innerHTML = '' }

export function sanitize(str) {
  if (typeof str !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export function sanitizeAttr(str) {
  return sanitize(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function switchScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'))
  const el = $('#screen-' + id)
  if (el) el.classList.add('active')
  store.screen = id
}

export function scrollTo(el) {
  if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

export const HOME_MENU = [
  { id: 'phim-moi-cap-nhat', label: 'Phim Mới' },
  { id: 'phim-bo', label: 'Phim Bộ' },
  { id: 'phim-le', label: 'Phim Lẻ' },
  { id: 'tv-shows', label: 'TV Shows' },
  { id: 'hoat-hinh', label: 'Hoạt Hình' },
  { id: 'favorites', label: '♥ Yêu Thích' },
  { id: 'history', label: 'Đã Xem' },
  { id: 'categories', label: 'Thể Loại' },
  { id: 'countries', label: 'Quốc Gia' },
  { id: 'search', label: 'Tìm Kiếm' }
]

export const KEY_MAP = {
  13: 'Enter', 27: 'Escape', 37: 'ArrowLeft', 38: 'ArrowUp',
  39: 'ArrowRight', 40: 'ArrowDown', 32: 'Space',
  10009: 'Escape', 10190: 'PlayPause', 10252: 'PlayPause'
}
