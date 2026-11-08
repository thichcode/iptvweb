# UX/UI Incremental Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add skeleton loading, portrait movie grid, screen transitions, and player UX enhancements to WebPhim

**Architecture:** Pure CSS/JS enhancements to existing files. No new dependencies. Mobile-first responsive design.

**Tech Stack:** Vanilla JS, CSS Grid, CSS Animations

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/style.css` | All CSS: skeleton, grid, transitions, player, scrollbar |
| `src/screens/list.js` | Skeleton rendering, grid class, scroll-to-top |
| `src/screens/detail.js` | Skeleton rendering |
| `src/screens/player.js` | Gesture hints, seek feedback |
| `src/main.js` | Transition trigger, scroll-to-top |

---

## Task 1: Skeleton CSS + Base Styles

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add skeleton animation CSS**

Add to `src/style.css` at the end:

```css
/* Skeleton Loading */
.skeleton {
  background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-poster {
  width: 100%;
  aspect-ratio: 2/3;
  border-radius: 6px;
}

.skeleton-line {
  height: 14px;
  margin-bottom: 8px;
}

.skeleton-line-short { width: 60%; }
.skeleton-line-medium { width: 80%; }
```

- [ ] **Step 2: Add screen transition CSS**

Add to `src/style.css`:

```css
/* Screen Transitions */
.screen {
  display: none;
  flex: 1;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.screen.active {
  display: block;
  opacity: 1;
}
```

- [ ] **Step 3: Add custom scrollbar CSS**

Add to `src/style.css`:

```css
/* Custom Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #111; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #555; }
```

- [ ] **Step 4: Commit**

```bash
git add src/style.css
git commit -m "feat: add skeleton loading and transition CSS"
```

---

## Task 2: Movie Grid CSS

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add movie grid CSS**

Replace the existing `.movie-list` styles in `src/style.css`:

```css
/* Movie Grid (Portrait) */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0;
}

@media (min-width: 600px) {
  .movie-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
}

@media (min-width: 900px) {
  .movie-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1200px) {
  .movie-grid { grid-template-columns: repeat(5, 1fr); }
}

.movie-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s, box-shadow 0.15s;
}

.movie-card:hover,
.movie-card.focused {
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(255, 214, 0, 0.15);
}

.movie-card .poster {
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  display: block;
  background: #1a1a1a;
}

.movie-card .card-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 10px 10px;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
}

.movie-card .card-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.movie-card .card-meta {
  font-size: 12px;
  color: #aaa;
  margin-top: 2px;
}

.movie-card .card-fav {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #ffd600;
  font-size: 16px;
}

@media (min-width: 600px) {
  .movie-card .card-title { font-size: 15px; }
  .movie-card .card-meta { font-size: 13px; }
}
```

- [ ] **Step 2: Keep old movie-list styles for local lists (favorites/history)**

Keep the existing `.movie-list` and `.movie-item` styles but rename them for local lists:

```css
/* Local List (Favorites, History) */
.local-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 20px;
}

.local-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: #1a1a1a;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  align-items: center;
  outline: none;
  transition: background 0.15s, border-color 0.15s;
}

.local-item:hover,
.local-item.focused {
  border-color: #ffd600;
  background: #2a2a2a;
}

.local-item .thumb {
  width: 60px;
  height: 84px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  background: #2a2a2a;
}

.local-item .info { flex: 1; min-width: 0; }
.local-item .info .title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.local-item .info .meta { font-size: 12px; color: #888; }
```

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: add portrait movie grid layout"
```

---

## Task 3: Player UX CSS

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add gesture hint and seek feedback CSS**

Add to `src/style.css`:

```css
/* Player UX */
.gesture-hints {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
  font-size: 14px;
  opacity: 0;
  animation: hint-fade 3s ease-in-out forwards;
  pointer-events: none;
}

@keyframes hint-fade {
  0% { opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; }
}

.gesture-hints .hint-row {
  margin: 8px 0;
  color: #ccc;
}

.gesture-hints .hint-key {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 4px;
  font-family: monospace;
}

.seek-feedback {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28px;
  font-weight: bold;
  color: #ffd600;
  opacity: 0;
  pointer-events: none;
  z-index: 110;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.seek-feedback.left { left: 20%; }
.seek-feedback.right { right: 20%; }

.seek-feedback.show {
  animation: seek-anim 0.5s ease-out forwards;
}

@keyframes seek-anim {
  0% { opacity: 1; transform: translateY(-50%) scale(1); }
  100% { opacity: 0; transform: translateY(-50%) scale(1.5); }
}
```

- [ ] **Step 2: Add error state CSS**

Add to `src/style.css`:

```css
/* Error States */
.error-state {
  text-align: center;
  padding: 60px 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-title {
  font-size: 18px;
  color: #fff;
  margin-bottom: 8px;
}

.error-hint {
  font-size: 14px;
  color: #888;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 24px;
  background: #ffd600;
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.retry-btn:hover { background: #ffea00; }
```

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: add player UX and error state CSS"
```

---

## Task 4: Update list.js - Skeleton + Grid

**Files:**
- Modify: `src/screens/list.js`

- [ ] **Step 1: Add skeleton rendering functions**

Add at the top of `src/screens/list.js` (after imports):

```js
function renderSkeletonGrid(count = 6) {
  let html = '<div class="movie-grid">'
  for (let i = 0; i < count; i++) {
    html += `<div class="movie-card skeleton-card">
      <div class="skeleton skeleton-poster"></div>
      <div class="card-info">
        <div class="skeleton skeleton-line skeleton-line-medium"></div>
        <div class="skeleton skeleton-line skeleton-line-short"></div>
      </div>
    </div>`
  }
  html += '</div>'
  return html
}

function renderSkeletonDetail() {
  return `<div class="detail-layout">
    <div class="detail-poster"><div class="skeleton skeleton-poster" style="width:260px;height:390px"></div></div>
    <div class="detail-info">
      <div class="skeleton skeleton-line skeleton-line-medium" style="height:28px;width:200px;margin-bottom:12px"></div>
      <div class="skeleton skeleton-line skeleton-line-short" style="height:16px;width:120px;margin-bottom:16px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:100%;margin-bottom:8px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:90%;margin-bottom:8px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:70%"></div>
    </div>
  </div>`
}
```

- [ ] **Step 2: Update renderMovieList to use grid**

Replace the `renderMovieList` function:

```js
export function renderMovieList(items, page, totalPages, type) {
  const container = $('#screen-list')
  const hist = getHist()
  let html = '<div class="movie-grid">'
  for (const m of items) {
    const thumb = imgSrc(m.thumb_url || m.poster_url)
    const meta = [m.year, m.origin_name].filter(Boolean).join(' • ')
    const h = hist[m.slug]
    const fav = isFav(m.slug) ? '<span class="card-fav">♥</span>' : ''
    html += `<div class="movie-card" data-slug="${sanitizeAttr(m.slug || '')}">`
    html += `<img class="poster" src="${thumb}" alt="" loading="lazy" onerror="this.style.display='none'">`
    html += `<div class="card-info">`
    html += `${fav}`
    html += `<div class="card-title">${sanitize(m.name || '')}</div>`
    html += `<div class="card-meta">${sanitize(meta)}</div>`
    html += `</div></div>`
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
```

- [ ] **Step 3: Update renderLocalList to use local-list class**

Replace the `renderLocalList` function:

```js
export function renderLocalList(items, title) {
  const container = $('#screen-list')
  let html = '<div class="local-list">'
  if (!items.length) { html += '<div class="empty">Trống</div>' }
  for (const m of items) {
    const thumb = imgSrc(m.thumb)
    const meta = [m.year, m.origin, m.episode].filter(Boolean).join(' • ')
    html += `<div class="local-item" data-slug="${sanitizeAttr(m.slug || '')}">`
    html += `<img class="thumb" src="${thumb}" alt="" loading="lazy" onerror="this.style.display='none'">`
    html += `<div class="info"><div class="title">${sanitize(m.name || '')}</div>`
    html += `<div class="meta">${sanitize(meta)}</div></div></div>`
  }
  html += '</div>'
  container.innerHTML = html
  store.listItems = items
  store.listType = title
}
```

- [ ] **Step 4: Update load functions to use skeleton**

Replace `loadMovieList`:

```js
export async function loadMovieList(type, page, keyword, category, country) {
  store.searchMode = false
  const container = $('#screen-list')
  container.innerHTML = renderSkeletonGrid()
  switchScreen('list')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  store.listType = type
  try {
    const data = await fetchMovies(type, page, keyword, category, country)
    const items = data.items || (data.data && data.data.items) || []
    const pagination = data.pagination || (data.data && data.data.params && data.data.params.pagination) || {}
    renderMovieList(items, pagination.currentPage || page, pagination.totalPages || 1, type)
  } catch {
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Không kết nối được</div>
      <div class="error-hint">Kiểm tra mạng và thử lại</div>
    </div>`
  }
}
```

Replace `loadCategories`:

```js
export async function loadCategories() {
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  switchScreen('list')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  try {
    const data = await fetchCategories()
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'category')
  } catch {
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Không thể tải</div>
    </div>`
  }
}
```

Replace `loadCountries`:

```js
export async function loadCountries() {
  const container = $('#screen-list')
  container.innerHTML = '<div class="loading">Đang tải...</div>'
  switchScreen('list')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  try {
    const data = await fetchCountries()
    const items = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : [])
    renderSubList(items, 'country')
  } catch {
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Không thể tải</div>
    </div>`
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/list.js
git commit -m "feat: add skeleton loading and movie grid to list screen"
```

---

## Task 5: Update detail.js - Skeleton

**Files:**
- Modify: `src/screens/detail.js`

- [ ] **Step 1: Update loadDetail to use skeleton**

Replace `loadDetail`:

```js
export async function loadDetail(slug) {
  store.prevScreen = store.screen
  const container = $('#screen-detail')
  container.innerHTML = renderSkeletonDetail()
  switchScreen('detail')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  store.currentSlug = slug
  try {
    const data = await fetchDetail(slug)
    if (!data || !data.movie) { container.innerHTML = '<div class="empty">Không tìm thấy phim</div>'; return }
    renderDetail(data.movie, data.episodes || [])
  } catch {
    container.innerHTML = `<div class="error-state">
      <div class="error-icon">📡</div>
      <div class="error-title">Lỗi kết nối</div>
      <div class="error-hint">Kiểm tra mạng và thử lại</div>
    </div>`
  }
}
```

- [ ] **Step 2: Add renderSkeletonDetail function**

Add before `loadDetail`:

```js
function renderSkeletonDetail() {
  return `<div class="detail-layout">
    <div class="detail-poster"><div class="skeleton skeleton-poster" style="width:100%;max-width:260px"></div></div>
    <div class="detail-info">
      <div class="skeleton skeleton-line" style="height:28px;width:200px;margin-bottom:12px"></div>
      <div class="skeleton skeleton-line" style="height:16px;width:120px;margin-bottom:16px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:100%;margin-bottom:8px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:90%;margin-bottom:8px"></div>
      <div class="skeleton skeleton-line" style="height:14px;width:70%"></div>
    </div>
  </div>`
}
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/detail.js
git commit -m "feat: add skeleton loading to detail screen"
```

---

## Task 6: Update player.js - Gesture Hints + Seek Feedback

**Files:**
- Modify: `src/screens/player.js`

- [ ] **Step 1: Add gesture hints overlay**

Replace `playEpisode` to add gesture hints:

```js
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

  // Add gesture hints
  removeGestureHints()
  const hints = document.createElement('div')
  hints.className = 'gesture-hints'
  hints.id = 'gesture-hints'
  hints.innerHTML = `
    <div class="hint-row"><span class="hint-key">← →</span> Seek 10s</div>
    <div class="hint-row"><span class="hint-key">Space</span> Play / Pause</div>
    <div class="hint-row"><span class="hint-key">Esc</span> Thoát</div>
    <div class="hint-row" style="color:#888;font-size:12px;margin-top:12px">Double-tap trái/phải để seek</div>
  `
  wrap.appendChild(hints)
  setTimeout(removeGestureHints, 3000)

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
  player.ontimeupdate = updateProgress
  if (movie) saveHist(movie.slug, movie, data[epIdx].name || 'Tập ' + (epIdx + 1), serverIdx, epIdx)
}
```

- [ ] **Step 2: Add removeGestureHints and showSeekFeedback functions**

Add after `showOverlay`:

```js
function removeGestureHints() {
  const hints = $('#gesture-hints')
  if (hints) hints.remove()
}

function showSeekFeedback(delta) {
  const existing = document.querySelector('.seek-feedback')
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.className = 'seek-feedback ' + (delta > 0 ? 'right' : 'left')
  el.textContent = (delta > 0 ? '+' : '') + delta + 's'
  document.body.appendChild(el)

  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => el.remove(), 500)
}
```

- [ ] **Step 3: Update seek function to show feedback**

Replace `seek`:

```js
export function seek(delta) {
  const player = $('#player')
  if (!player) return
  player.currentTime = Math.max(0, player.currentTime + delta)
  showSeekFeedback(delta)
  showOverlay()
}
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/player.js
git commit -m "feat: add gesture hints and seek feedback to player"
```

---

## Task 7: Build and Verify

- [ ] **Step 1: Run build**

```bash
npx vite build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Test in browser**

Open `http://localhost:3000` and verify:
- [ ] Skeleton loading appears when loading movie list
- [ ] Movie grid shows 2 columns on mobile, 3 on tablet, 4+ on desktop
- [ ] Portrait posters with gradient overlay
- [ ] Screen transitions are smooth (fade-in)
- [ ] Player shows gesture hints on first play
- [ ] Seek shows +10s/-10s feedback
- [ ] Error states show properly when network fails

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete UX/UI incremental polish"
```
