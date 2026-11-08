# WebPhim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the TizenBrew movie browser `@kv8n2oryk/tizenfilm` to a standalone Vite web app deployable on Vercel, with mouse/touch support and responsive design.

**Architecture:** Single-page vanilla JS app with screen-based routing (home → list → detail → player). Uses `phimapi.com` API directly. localStorage for favorites and history.

**Tech Stack:** Vite, vanilla JS, hls.js, CSS Grid/Flexbox

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `vercel.json`
- Create: `index.html`
- Create: `src/style.css` (initial structure)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "webphim",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "hls.js": "^1.5.0"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  build: { outDir: 'dist' },
  server: { port: 3000 }
})
```

- [ ] **Step 3: Create `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 4: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>WebPhim</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎬</text></svg>">
  <link rel="stylesheet" href="/src/style.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create `src/style.css` initial shell**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0d0d0d; color: #fff; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
#app { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
```

- [ ] **Step 6: Verify scaffold works**

Run: `cd D:\pupeteer\webphim && npm install && npx vite build`
Expected: Build succeeds, `dist/` folder created with index.html + assets

---

### Task 2: Full Stylesheet

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Write complete CSS**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0d0d0d; color: #fff; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
#app { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }

/* Header */
.header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #111; border-bottom: 1px solid #2a2a2a; position: sticky; top: 0; z-index: 10; }
.header h1 { margin: 0; font-size: 22px; color: #ffd600; }
.header .hint { color: #888; font-size: 13px; }
@media (max-width: 600px) { .header { padding: 10px 12px; } .header h1 { font-size: 18px; } .header .hint { font-size: 11px; } }

/* Screens */
.screen { display: none; flex: 1; padding: 16px; }
.screen.active { display: block; }

/* Home menu */
.home-menu { display: flex; flex-direction: column; gap: 8px; max-width: 500px; margin: 20px auto; }
.menu-btn { padding: 14px 20px; font-size: 17px; background: #1a1a1a; border: 2px solid transparent; border-radius: 8px; color: #fff; cursor: pointer; text-align: center; outline: none; transition: background 0.15s, border-color 0.15s; }
.menu-btn:hover, .menu-btn.focused { border-color: #ffd600; background: #2a2a2a; }
.menu-btn:active { background: #333; }

/* Movie list */
.movie-list { display: flex; flex-direction: column; gap: 10px; padding-bottom: 20px; }
.movie-item { display: flex; gap: 12px; padding: 10px; background: #1a1a1a; border: 2px solid transparent; border-radius: 8px; cursor: pointer; align-items: center; outline: none; transition: background 0.15s, border-color 0.15s; }
.movie-item:hover, .movie-item.focused { border-color: #ffd600; background: #2a2a2a; }
.thumb { width: 80px; height: 112px; object-fit: cover; border-radius: 4px; flex-shrink: 0; background: #2a2a2a; }
.info { flex: 1; min-width: 0; }
.info .title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.info .meta { font-size: 13px; color: #888; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.page-btn { padding: 8px 16px; background: #1a1a1a; border: 2px solid transparent; border-radius: 6px; color: #fff; cursor: pointer; font-size: 14px; }
.page-btn:hover, .page-btn.focused { border-color: #ffd600; background: #2a2a2a; }
.page-info { color: #888; font-size: 14px; }

/* Sub list (categories, countries) */
.sub-list { display: flex; flex-direction: column; gap: 6px; max-width: 500px; margin: 0 auto; }
.sub-item { padding: 12px 16px; background: #1a1a1a; border: 2px solid transparent; border-radius: 6px; color: #fff; cursor: pointer; font-size: 15px; }
.sub-item:hover, .sub-item.focused { border-color: #ffd600; background: #2a2a2a; }

/* Search */
.search-wrap { display: flex; gap: 8px; max-width: 500px; margin: 20px auto; }
.search-input { flex: 1; padding: 12px 16px; background: #1a1a1a; border: 2px solid #333; border-radius: 6px; color: #fff; font-size: 16px; outline: none; }
.search-input:focus { border-color: #ffd600; }
.search-btn { padding: 12px 20px; background: #ffd600; color: #000; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600; }

/* Detail */
.detail-layout { display: flex; gap: 24px; padding-top: 16px; }
.detail-poster { width: 260px; flex-shrink: 0; }
.detail-poster img { width: 100%; border-radius: 8px; }
.detail-info { flex: 1; min-width: 0; }
.detail-info h2 { font-size: 26px; margin: 0 0 8px; color: #ffd600; }
.desc { color: #aaa; font-size: 15px; line-height: 1.6; margin-bottom: 12px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.tags span { background: #2a2a2a; padding: 3px 10px; border-radius: 4px; font-size: 13px; color: #ccc; }
.fav-btn { font-size: 32px; color: #ffd600; cursor: pointer; padding: 4px 12px; border: 2px solid transparent; border-radius: 4px; user-select: none; display: inline-block; }
.fav-btn:hover, .fav-btn.focused { border-color: #ffd600; }
.episode-section { margin-top: 24px; }
.server-name { font-size: 16px; color: #ffd600; margin: 12px 0 6px; font-weight: 600; }
.episode-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.episode-btn { padding: 8px 14px; background: #1a1a1a; border: 2px solid transparent; border-radius: 6px; color: #fff; cursor: pointer; font-size: 13px; }
.episode-btn:hover, .episode-btn.focused { border-color: #ffd600; background: #2a2a2a; }

@media (max-width: 700px) {
  .detail-layout { flex-direction: column; }
  .detail-poster { width: 200px; }
}

/* Player */
#player-wrap { display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; z-index: 100; }
#player-wrap.active { display: flex; align-items: center; justify-content: center; }
#player { width: 100%; height: 100%; object-fit: contain; }
#player-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
#player-overlay.show { opacity: 1; }
.p-title { font-size: 18px; margin-bottom: 6px; }
.p-hint { font-size: 13px; color: #888; }

/* Loading */
.loading { text-align: center; padding: 40px; color: #888; font-size: 16px; }
.empty { text-align: center; padding: 40px; color: #555; font-size: 15px; }
```

- [ ] **Step 2: Verify build still works**

Run: `npx vite build`
Expected: Build succeeds

---

### Task 3: API Client Module

**Files:**
- Create: `src/api.js`

- [ ] **Step 1: Write `src/api.js`**

```js
const BASE = 'https://phimapi.com'

export async function apiGet(url) {
  const res = await fetch(BASE + url)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

export function imgSrc(url) {
  if (!url) return ''
  return BASE + '/image.php?url=' + encodeURIComponent(url)
}

export function fetchMovies(type, page = 1, keyword = '', category = '', country = '') {
  let url = ''
  if (keyword) {
    url = `/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=20`
  } else if (category) {
    url = `/v1/api/the-loai/${encodeURIComponent(category)}?page=${page}&limit=20`
  } else if (country) {
    url = `/v1/api/quoc-gia/${encodeURIComponent(country)}?page=${page}&limit=20`
  } else if (type === 'phim-moi-cap-nhat') {
    url = `/danh-sach/phim-moi-cap-nhat?page=${page}`
  } else {
    url = `/v1/api/danh-sach/${type}?page=${page}&limit=20`
  }
  return apiGet(url)
}

export function fetchDetail(slug) {
  return apiGet('/phim/' + slug)
}

export function fetchCategories() {
  return apiGet('/the-loai')
}

export function fetchCountries() {
  return apiGet('/quoc-gia')
}
```

---

### Task 4: Store Module

**Files:**
- Create: `src/store.js`

- [ ] **Step 1: Write `src/store.js`**

```js
const FAVS_KEY = 'wp_favs'
const HIST_KEY = 'wp_hist'

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export const store = {
  screen: 'home',
  menuIndex: 0,
  listItems: [],
  listPage: 1,
  listTotalPages: 1,
  listType: '',
  currentSlug: '',
  currentMovie: null,
  episodes: [],
  episodeFocusIdx: 0,
  currentKeyword: '',
  categorySlug: '',
  countrySlug: '',
  searchMode: false,
  prevScreen: '',
  serverIdx: 0,
  epIdx: 0
}

export function getFavs() { return read(FAVS_KEY) }
export function setFavs(o) { write(FAVS_KEY, o) }
export function isFav(slug) { return !!getFavs()[slug] }
export function toggleFav(slug, movie) {
  const f = getFavs()
  if (f[slug]) { delete f[slug] } else { f[slug] = { name: movie.name, thumb: movie.thumb_url || movie.poster_url || '', year: movie.year, origin: movie.origin_name } }
  setFavs(f)
}

export function getHist() { return read(HIST_KEY) }
export function setHist(o) { write(HIST_KEY, o) }
export function saveHist(slug, movie, epName, sIdx, eIdx) {
  const h = getHist()
  h[slug] = { name: movie.name, thumb: movie.thumb_url || movie.poster_url || '', year: movie.year, origin: movie.origin_name, episode: epName, serverIdx: sIdx, epIdx: eIdx, at: Date.now() }
  setHist(h)
}
```

---

### Task 5: Utils Module

**Files:**
- Create: `src/utils.js`

- [ ] **Step 1: Write `src/utils.js`**

```js
export function $(sel, ctx = document) { return ctx.querySelector(sel) }
export function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)] }

export function empty(el) { el.innerHTML = '' }

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
```

---

### Task 6: Home Screen

**Files:**
- Create: `src/screens/home.js`

- [ ] **Step 1: Write `src/screens/home.js`**

```js
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
```

---

### Task 7: List Screen

**Files:**
- Create: `src/screens/list.js`

- [ ] **Step 1: Write `src/screens/list.js`**

```js
import { $, $$, scrollTo, imgSrc, store } from '../utils.js'
import { fetchMovies, fetchCategories, fetchCountries } from '../api.js'
import { getFavs, getHist, isFav } from '../store.js'

export function renderMovieList(items, page, totalPages, type) {
  const container = $('#screen-list')
  const hist = getHist()
  let html = '<div class="movie-list">'
  for (const m of items) {
    const thumb = imgSrc(m.thumb_url || m.poster_url)
    const meta = [m.year, m.origin_name].filter(Boolean).join(' • ')
    const h = hist[m.slug]
    const epLabel = h && h.episode ? ' | ' + h.episode : ''
    const fav = isFav(m.slug) ? '<span style="color:#ffd600;margin-left:6px">♥</span>' : ''
    html += `<div class="movie-item" data-slug="${m.slug || ''}">`
    html += `<img class="thumb" src="${thumb}" alt="" loading="lazy" onerror="this.style.display='none'">`
    html += `<div class="info"><div class="title">${m.name || ''}${fav}</div>`
    html += `<div class="meta">${meta}${epLabel}</div></div></div>`
  }
  html += '</div>'
  if (totalPages > 1) {
    html += '<div class="pagination">'
    if (page > 1) html += `<div class="page-btn" data-page="${page - 1}">← Trang trước</div>`
    html += `<span class="page-info">Trang ${page} / ${totalPages}</span>`
    if (page < totalPages) html += `<div class="page-btn" data-page="${page + 1}">Trang sau →</div>`
    html += '</div>'
  }
  container.innerHTML = html
  store.listItems = items
  store.listPage = page
  store.listTotalPages = totalPages
  store.listType = type
}

export function renderSubList(items, type) {
  const container = $('#screen-list')
  container.innerHTML = '<div class="sub-list">' +
    items.map(i => `<div class="sub-item" data-slug="${i.slug || ''}">${i.name || ''}</div>`).join('') +
    '</div>'
  store.listType = type
  store.listItems = items
}

export function renderSearchInput(keyword = '') {
  const container = $('#screen-list')
  container.innerHTML = `<div class="search-wrap">
    <input class="search-input" type="text" placeholder="Nhập tên phim..." value="${keyword}" autofocus>
    <button class="search-btn">Tìm</button>
  </div>`
}

export function renderLocalList(items, title) {
  const container = $('#screen-list')
  let html = '<div class="movie-list">'
  if (!items.length) { html += '<div class="empty">Trống</div>' }
  for (const m of items) {
    const thumb = imgSrc(m.thumb)
    const meta = [m.year, m.origin, m.episode].filter(Boolean).join(' • ')
    html += `<div class="movie-item" data-slug="${m.slug || ''}">`
    html += `<img class="thumb" src="${thumb}" alt="" loading="lazy" onerror="this.style.display='none'">`
    html += `<div class="info"><div class="title">${m.name || ''}</div>`
    html += `<div class="meta">${meta}</div></div></div>`
  }
  html += '</div>'
  container.innerHTML = html
  store.listItems = items
  store.listType = title
}

export async function loadMovieList(type, page, keyword, category, country) {
  store.searchMode = false
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('list')
  store.listType = type
  try {
    const data = await fetchMovies(type, page, keyword, category, country)
    const items = data.items || (data.data && data.data.items) || []
    const pagination = data.pagination || (data.data && data.data.params && data.data.params.pagination) || {}
    renderMovieList(items, pagination.currentPage || page, pagination.totalPages || 1, type)
  } catch {
    container.innerHTML = '<div class="empty">Lỗi kết nối</div>'
  }
}

export async function loadCategories() {
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('list')
  try {
    const data = await fetchCategories()
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'category')
  } catch { container.innerHTML = '<div class="empty">Không thể tải</div>' }
}

export async function loadCountries() {
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('list')
  try {
    const data = await fetchCountries()
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'country')
  } catch { container.innerHTML = '<div class="empty">Không thể tải</div>' }
}

export function loadFavorites() {
  const f = getFavs()
  const items = Object.entries(f).map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin, episode: '' }))
  renderLocalList(items, '♥ Yêu Thích')
}

export function loadHistory() {
  const h = getHist()
  const items = Object.entries(h)
    .sort((a, b) => (b[1].at || 0) - (a[1].at || 0))
    .map(([slug, v]) => ({ slug, name: v.name, thumb: v.thumb, year: v.year, origin: v.origin, episode: v.episode || '' }))
  renderLocalList(items, 'Đã Xem')
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'))
  const el = $('#screen-' + id)
  if (el) el.classList.add('active')
  store.screen = id
}

export function handleListClick(e) {
  const item = e.target.closest('.movie-item, .page-btn, .sub-item')
  if (!item) return null
  if (item.classList.contains('movie-item')) {
    return { action: 'detail', slug: item.dataset.slug }
  }
  if (item.classList.contains('page-btn')) {
    const page = parseInt(item.dataset.page)
    if (!isNaN(page)) return { action: 'page', page, type: store.listType }
  }
  if (item.classList.contains('sub-item')) {
    return { action: 'subSelect', slug: item.dataset.slug, type: store.listType }
  }
  return null
}
```

---

### Task 8: Detail Screen

**Files:**
- Create: `src/screens/detail.js`

- [ ] **Step 1: Write `src/screens/detail.js`**

```js
import { $, $$, imgSrc, store } from '../utils.js'
import { fetchDetail } from '../api.js'
import { isFav, toggleFav } from '../store.js'

export async function loadDetail(slug) {
  store.prevScreen = store.screen
  const container = $('#screen-detail')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  showScreen('detail')
  store.currentSlug = slug
  try {
    const data = await fetchDetail(slug)
    if (!data || !data.movie) { container.innerHTML = '<div class="empty">Không tìm thấy phim</div>'; return }
    renderDetail(data.movie, data.episodes || [])
  } catch { container.innerHTML = '<div class="empty">Lỗi kết nối</div>' }
}

function renderDetail(movie, episodes) {
  const container = $('#screen-detail')
  store.currentMovie = movie
  store.episodes = episodes
  store.serverIdx = 0
  store.epIdx = 0

  const poster = imgSrc(movie.poster_url || movie.thumb_url)
  const favStar = isFav(movie.slug) ? '★' : '☆'
  const tags = [movie.year]
  if (movie.country) movie.country.forEach(c => tags.push(c.name))
  if (movie.quality) tags.push(movie.quality)
  if (movie.lang) tags.push(movie.lang)
  if (movie.time) tags.push(movie.time)

  let html = `<div class="detail-layout"><div class="detail-poster"><img src="${poster}" alt="" onerror="this.style.display='none'"></div>`
  html += `<div class="detail-info"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">`
  html += `<h2>${movie.name || ''}</h2>`
  html += `<span class="fav-btn" data-slug="${movie.slug || ''}">${favStar}</span></div>`
  if (tags.some(Boolean)) {
    html += '<div class="tags">' + tags.filter(Boolean).map(t => `<span>${t}</span>`).join('') + '</div>'
  }
  html += `<div class="desc">${movie.content || movie.description || 'Chưa có mô tả'}</div></div></div>`

  if (episodes.length) {
    html += '<div class="episode-section">'
    for (let s = 0; s < episodes.length; s++) {
      const ep = episodes[s]
      const data = ep.server_data || []
      html += `<div class="server-name">${ep.server_name || 'Server ' + (s + 1)}</div>`
      html += '<div class="episode-grid">'
      for (let e = 0; e < data.length; e++) {
        html += `<div class="episode-btn" data-server="${s}" data-ep="${e}">${data[e].name || 'Tập ' + (e + 1)}</div>`
      }
      html += '</div>'
    }
    html += '</div>'
  } else {
    html += '<div class="empty">Chưa có tập phim</div>'
  }
  container.innerHTML = html
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'))
  const el = $('#screen-' + id)
  if (el) el.classList.add('active')
  store.screen = id
}

export function handleDetailClick(e) {
  const fav = e.target.closest('.fav-btn')
  if (fav) {
    const slug = fav.dataset.slug
    if (slug) {
      toggleFav(slug, store.currentMovie)
      fav.textContent = isFav(slug) ? '★' : '☆'
    }
    return null
  }
  const ep = e.target.closest('.episode-btn')
  if (ep) {
    const serverIdx = parseInt(ep.dataset.server)
    const epIdx = parseInt(ep.dataset.ep)
    if (!isNaN(serverIdx) && !isNaN(epIdx)) {
      return { action: 'play', serverIdx, epIdx }
    }
  }
  return null
}
```

---

### Task 9: Player Screen

**Files:**
- Create: `src/screens/player.js`

- [ ] **Step 1: Write `src/screens/player.js`**

```js
import { $, $$, store } from '../utils.js'
import { saveHist } from '../store.js'
import Hls from 'hls.js'

let hlsInstance = null
let overlayTimer = null

export function playEpisode(serverIdx, epIdx) {
  if (!store.episodes || !store.episodes[serverIdx]) return
  const server = store.episodes[serverIdx]
  const data = server.server_data || []
  if (!data[epIdx]) return
  const src = data[epIdx].link_m3u8
  if (!src) return

  store.serverIdx = serverIdx
  store.epIdx = epIdx
  const player = $('#player')
  const wrap = $('#player-wrap')
  const pTitle = $('#p-title')
  wrap.classList.add('active')

  const movie = store.currentMovie
  pTitle.textContent = (movie ? movie.name : '') + ' - ' + (data[epIdx].name || 'Tập ' + (epIdx + 1))

  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  player.removeAttribute('src')

  if (Hls.isSupported()) {
    hlsInstance = new Hls()
    hlsInstance.loadSource(src)
    hlsInstance.attachMedia(player)
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => player.play())
  } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
    player.src = src
    player.addEventListener('loadedmetadata', () => player.play(), { once: true })
  }

  showOverlay()
  player.onended = () => autoNext()
  if (movie) saveHist(movie.slug, movie, data[epIdx].name || 'Tập ' + (epIdx + 1), serverIdx, epIdx)
}

function autoNext() {
  let s = store.serverIdx
  let e = store.epIdx + 1
  if (store.episodes[s] && store.episodes[s].server_data && store.episodes[s].server_data[e]) {
    playEpisode(s, e); return
  }
  s++
  if (store.episodes[s] && store.episodes[s].server_data && store.episodes[s].server_data.length > 0) {
    playEpisode(s, 0); return
  }
  showOverlay()
}

export function exitPlayer() {
  const player = $('#player')
  const wrap = $('#player-wrap')
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  if (player) { player.pause(); player.onended = null; player.removeAttribute('src'); player.load() }
  wrap.classList.remove('active')
  if (overlayTimer) { clearTimeout(overlayTimer); overlayTimer = null }
  $$('.screen').forEach(s => s.classList.remove('active'))
  const detail = $('#screen-detail')
  if (detail) detail.classList.add('active')
  store.screen = 'detail'
}

export function togglePlay() {
  const player = $('#player')
  if (!player) return
  if (player.paused) player.play() else player.pause()
  showOverlay()
}

export function seek(delta) {
  const player = $('#player')
  if (!player) return
  player.currentTime = Math.max(0, player.currentTime + delta)
  showOverlay()
}

function showOverlay() {
  const overlay = $('#player-overlay')
  if (!overlay) return
  overlay.classList.add('show')
  if (overlayTimer) clearTimeout(overlayTimer)
  const player = $('#player')
  if (player && !player.paused) {
    overlayTimer = setTimeout(() => overlay.classList.remove('show'), 4000)
  }
}

export function handlePlayerClick(e) {
  return null // no special click handling needed in player
}
```

---

### Task 10: Main Entry Point

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Write `src/main.js`**

```js
import { $, $$, HOME_MENU, KEY_MAP, store } from './utils.js'
import { imgSrc } from './api.js'
import { renderHome, handleHomeClick } from './screens/home.js'
import {
  renderMovieList, renderSubList, renderSearchInput, renderLocalList,
  loadMovieList, loadCategories, loadCountries, loadFavorites, loadHistory,
  handleListClick
} from './screens/list.js'
import { loadDetail, handleDetailClick } from './screens/detail.js'
import { isFav, toggleFav } from './store.js'
import { playEpisode, exitPlayer, togglePlay, seek, handlePlayerClick } from './screens/player.js'

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

function focusFirst(sel) {
  const items = $$(sel)
  items.forEach(i => i.classList.remove('focused'))
  if (items.length) items[0].classList.add('focused')
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
    case 'favorites': loadFavorites(); setHeader('♥ Yêu Thích', ''); break
    case 'history': loadHistory(); setHeader('Đã Xem', ''); break
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

// Keyboard navigation
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

  // Player keys take priority when player is active
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

// Mouse/touch event delegation
function handleClick(e) {
  const screen = store.screen

  // Search button
  if (e.target.closest('.search-btn')) {
    const inp = $('.search-input')
    if (inp && inp.value.trim()) { store.searchMode = false; loadMovieList('search', 1, inp.value.trim(), '', ''); setHeader('Tìm: ' + inp.value.trim(), '') }
    return
  }
  // Search input Enter key
  if (e.target.closest('.search-input')) {
    // already handled by keydown
    return
  }

  // Player click = show overlay
  if ($('#player-wrap').classList.contains('active')) {
    const overlay = $('#player-overlay')
    if (overlay) {
      overlay.classList.add('show')
      if (overlayTimer) clearTimeout(overlayTimer)
      overlayTimer = setTimeout(() => overlay.classList.remove('show'), 4000)
    }
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

function init() {
  buildShell()
  renderHome()
  setHeader('WebPhim', '↑↓ Chọn | Enter vào')

  document.addEventListener('keydown', handleKey)
  document.addEventListener('click', handleClick)
}

init()
```

---

### Task 11: Build & Verify

**Files:**
- No new files, just verify

- [ ] **Step 1: Build production bundle**

Run: `npm run build`
Expected: Build succeeds, output in `dist/`

- [ ] **Step 2: Dev server check**

Run: `npx vite --port 3000`
Expected: Server starts on port 3000, page loads without console errors

- [ ] **Step 3: Git init and first commit**

```bash
cd D:\pupeteer\webphim
git init
git add -A
git commit -m "feat: initial webphim movie browser from tizenfilm"
```

- [ ] **Step 4: Add GitHub remote and push**

```bash
git remote add origin https://github.com/thichcode/iptvweb.git
git branch -M main
git push -u origin main --force
```
