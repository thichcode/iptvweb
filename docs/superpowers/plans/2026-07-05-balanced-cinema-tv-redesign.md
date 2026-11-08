# Balanced Cinema TV Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign WebPhim into a balanced cinema UI that works intentionally on mobile, desktop, and Android TV.

**Architecture:** Keep the existing vanilla JS + CSS architecture. Use small markup hooks in screen renderers and centralize visual changes in `src/style.css`; do not change API, player, routing, or screen state logic.

**Tech Stack:** Vite, vanilla JavaScript modules, vanilla CSS, Node test runner, `hls.js`, Capacitor Android.

---

## File Structure

- `src/style.css`: primary visual system, responsive layout, focus states, player polish.
- `src/screens/home.js`: adjust home wheel secondary control markup and accessible labels.
- `src/screens/list.js`: add pure card/chip/empty HTML helpers, poster-card markup, better alt text, empty states.
- `src/screens/detail.js`: add detail page panel wrappers, poster alt text, episode panel markup.
- `src/main.js`: no layout logic changes; optional ARIA label only if needed.
- `index.html`: optional meta/fav polish only if needed.
- `test/mobile-limit.test.js`: extend with pure markup helper assertions so non-DOM UI output stays testable.

## Task 1: Visual System Tokens And Base App Surfaces

**Files:**
- Modify: `src/style.css:1-90`

- [ ] **Step 1: Inspect current base CSS**

Read: `src/style.css:1-90`

Confirm existing rules include `body`, `#app`, `.header`, grain overlay, `.screen`, `.screen.active`, and home wheel rules.

- [ ] **Step 2: Add CSS variables and keep current compatibility**

Replace the top block from `* { margin... }` through `#app { ... }` with:

```css
:root {
  --bg: #0b0b09;
  --bg-soft: #11100d;
  --surface: rgba(28, 26, 20, 0.88);
  --surface-strong: rgba(38, 35, 27, 0.94);
  --line: rgba(255, 214, 96, 0.16);
  --line-strong: rgba(255, 214, 96, 0.62);
  --text: #fff8e6;
  --muted: #b9ad91;
  --faint: #766f5d;
  --accent: #ffd45a;
  --accent-strong: #ffe27a;
  --danger: #ff6868;
  --ok: #72d987;
  --shadow-amber: 0 20px 60px rgba(255, 196, 66, 0.12);
  --shadow-dark: 0 24px 80px rgba(0, 0, 0, 0.5);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
html { scroll-behavior: smooth; }
body {
  background:
    radial-gradient(circle at 12% 0%, rgba(255, 212, 90, 0.08), transparent 34rem),
    radial-gradient(circle at 85% 12%, rgba(255, 212, 90, 0.05), transparent 38rem),
    var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow-x: hidden;
}
#app {
  width: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding-bottom: 52px;
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}
```

- [ ] **Step 3: Update base header/screen colors to variables**

Change existing `.header`, `.header h1`, `.header .hint`, `.header-back`, `#screen-list`, `#screen-detail`, `.screen.active`, `.update-msg`, `.update-msg.ok`, `.update-msg.err` rules to use these values:

```css
.header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(12, 12, 10, 0.9); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(16px); }
.header h1 { margin: 0; font-size: 22px; color: var(--accent); text-wrap: balance; letter-spacing: -0.02em; }
.header .hint { color: var(--muted); font-size: 13px; }
.header-back { font-size: 24px; color: var(--accent); cursor: pointer; padding: 0 12px 0 0; user-select: none; }
#screen-list { background: radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,212,90,0.04) 0%, transparent 70%); }
#screen-detail { background: radial-gradient(ellipse 50% 30% at 80% 10%, rgba(255,212,90,0.05) 0%, transparent 70%); }
.screen.active { display: block; animation: screen-fade-in 0.25s ease; }
.update-msg { text-align: center; padding: 4px 16px 12px; font-size: 14px; color: var(--muted); }
.update-msg.ok { color: var(--ok); }
.update-msg.err { color: var(--danger); }
```

- [ ] **Step 4: Run build smoke check**

Run: `npm run build`

Expected: Vite build completes with `✓ built` and no CSS syntax errors.

- [ ] **Step 5: Commit**

```bash
git add src/style.css
git commit -m "design: add cinema visual tokens"
```

## Task 2: Home Wheel And Secondary Controls

**Files:**
- Modify: `src/screens/home.js:15-28`
- Modify: `src/style.css:59-92`

- [ ] **Step 1: Update home action markup**

In `renderHome()`, replace the final `html += '</div><div class="wheel-indicator bottom">...` line with:

```js
  html += '</div><div class="wheel-indicator bottom">▼</div></div><div class="home-actions"><a class="home-action" href="https://github.com/thichcode/iptvweb/releases/latest/download/WebPhim.apk" target="_blank" rel="noopener">Tải APK Android TV</a><span class="home-action" id="mode-btn">' + (store.largeMode ? 'Chữ thường' : 'Chữ to') + '</span><span class="home-action" id="update-btn">Cập nhật</span></div><div id="update-msg" class="update-msg"></div>'
```

- [ ] **Step 2: Update mode button text after toggle**

In `bindWheelEvents()`, replace:

```js
if (btn) { toggleLargeMode(); btn.textContent = store.largeMode ? '🔍 Thường' : '👁 Chữ to' }
```

with:

```js
if (btn) { toggleLargeMode(); btn.textContent = store.largeMode ? 'Chữ thường' : 'Chữ to' }
```

- [ ] **Step 3: Replace old APK/action CSS with quieter home actions**

Keep `.dl-apk` for backward safety, but add these rules after the existing APK block:

```css
.home-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; padding: 8px 16px 20px; }
.home-action { color: var(--muted); font-size: 13px; text-decoration: none; padding: 10px 16px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,0.03); display: inline-flex; align-items: center; cursor: pointer; min-height: 44px; user-select: none; transition: color 0.18s, border-color 0.18s, background 0.18s, transform 0.18s; }
.home-action:hover, .home-action:focus-visible { color: var(--accent); border-color: var(--line-strong); background: rgba(255,212,90,0.08); }
.home-action:active { transform: scale(0.96); }
```

- [ ] **Step 4: Strengthen wheel focus without changing JS math**

Change `.wheel-bg`, `.wheel-item`, `.wheel-item.focused`, and TV/large mode wheel rules to:

```css
.wheel-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 50% at 50% 48%, rgba(255,212,90,0.12) 0%, transparent 68%); pointer-events: none; }
.wheel-item { position: absolute; left: 10%; right: 10%; height: 52px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 0 20px; background: var(--surface); border: 2px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); color: var(--muted); cursor: pointer; font-size: 16px; white-space: nowrap; backface-visibility: hidden; transition: transform 0.35s ease-out, opacity 0.35s ease-out, border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s; will-change: transform, opacity; }
.wheel-item.focused { border-color: var(--accent); background: var(--surface-strong); color: var(--text); font-weight: 700; box-shadow: var(--shadow-amber), inset 0 0 0 1px rgba(255,255,255,0.08); }
@media (min-width: 1200px) { .wheel-item { font-size: 22px; height: 64px; left: 14%; right: 14%; } }
body.large-mode .wheel-item { height: 72px; font-size: 26px; border-width: 3px; left: 5%; right: 5%; }
```

- [ ] **Step 5: Run build smoke check**

Run: `npm run build`

Expected: build succeeds and no missing import/error in `home.js`.

- [ ] **Step 6: Commit**

```bash
git add src/screens/home.js src/style.css
git commit -m "design: refine home wheel and actions"
```

## Task 3: Poster-First Movie List Cards

**Files:**
- Modify: `src/screens/list.js:33-98`
- Modify: `src/style.css:94-168`
- Modify: `test/mobile-limit.test.js:1-30`

- [ ] **Step 1: Add exported pure helpers for testable markup**

In `src/screens/list.js`, add these helpers above `renderMovieList`:

```js
export function renderEmptyState(title = 'Chưa có phim', hint = 'Thử chọn mục khác hoặc quay lại sau.') {
  return `<div class="empty-state"><div class="empty-title">${sanitize(title)}</div><div class="empty-hint">${sanitize(hint)}</div></div>`
}

export function renderMovieCard(m) {
  const title = m.name || ''
  const thumb = imgSrc(m.thumb_url || m.poster_url || m.thumb || m.poster)
  const meta = [m.year, m.origin_name || m.origin].filter(Boolean).join(' • ')
  return `<div class="local-item movie-card" data-slug="${sanitizeAttr(m.slug || '')}"><img class="thumb" src="${thumb}" alt="${sanitizeAttr(title)}" loading="lazy" onerror="this.style.display='none'"><div class="info"><div class="title">${sanitize(title)}</div><div class="meta">${sanitize(meta)}</div></div></div>`
}
```

- [ ] **Step 2: Use helpers in movie and local list renderers**

In `renderMovieList`, replace empty and loop card generation with:

```js
  if (!items.length) { container.innerHTML = renderEmptyState(); return }
  let html = '<div class="local-list movie-grid">'
  for (const m of items) html += renderMovieCard(m)
```

In `renderLocalList`, replace empty and loop card generation with:

```js
  let html = '<div class="local-list movie-grid">'
  if (!items.length) { container.innerHTML = renderEmptyState('Danh sách trống', 'Phim đã xem hoặc yêu thích sẽ hiện ở đây.'); return }
  for (const m of items) html += renderMovieCard(m)
```

- [ ] **Step 3: Update tests for pure helper output**

Change the import line in `test/mobile-limit.test.js` to:

```js
import { limitRenderedItems, renderMovieCard, renderEmptyState } from '../src/screens/list.js'
```

Append these tests:

```js
test('movie card markup uses poster-card class and meaningful alt text', () => {
  const html = renderMovieCard({ slug: 'dao-doc-dac', name: 'Đảo độc đắc', year: 2023, origin_name: 'Việt Nam', thumb_url: 'poster.jpg' })
  assert.match(html, /class="local-item movie-card"/)
  assert.match(html, /alt="Đảo độc đắc"/)
  assert.match(html, /2023 • Việt Nam/)
})

test('empty state has composed title and hint', () => {
  const html = renderEmptyState('Danh sách trống', 'Phim đã xem hoặc yêu thích sẽ hiện ở đây.')
  assert.match(html, /empty-state/)
  assert.match(html, /Danh sách trống/)
  assert.match(html, /Phim đã xem hoặc yêu thích sẽ hiện ở đây\./)
})
```

- [ ] **Step 4: Run tests to verify helper behavior**

Run: `npm test`

Expected: all tests pass, including the two new markup helper tests.

- [ ] **Step 5: Add responsive poster-card CSS**

Replace `.local-list`, desktop local-list media rules, `.local-item`, `.local-item .thumb`, `.local-item .info`, `.local-item .info .title`, `.local-item .info .meta`, `.empty` with:

```css
.local-list { display: grid; grid-template-columns: 1fr; gap: 10px; padding-bottom: 16px; }
.movie-grid { align-items: stretch; }
@media (min-width: 760px) { .movie-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; } }
@media (min-width: 1200px) { .movie-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; } }
@media (min-width: 1200px) and (pointer: coarse) { .movie-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; } }
.local-item { display: flex; gap: 12px; padding: 10px 12px; background: var(--surface); border: 1px solid rgba(255,255,255,0.07); border-radius: var(--radius-md); cursor: pointer; align-items: center; outline: none; min-height: 58px; transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.2s; }
.movie-card { overflow: hidden; }
@media (min-width: 760px) { .movie-card { display: block; padding: 0; min-height: 0; } }
.local-item:hover, .local-item.focused { border-color: var(--accent); background: var(--surface-strong); transform: translateY(-2px) scale(1.01); box-shadow: var(--shadow-amber); }
.local-item:active { transform: scale(0.98); }
.local-item .thumb { width: 64px; height: 92px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; background: #2a2a2a; }
@media (min-width: 760px) { .movie-card .thumb { width: 100%; height: auto; aspect-ratio: 2 / 3; border-radius: var(--radius-md) var(--radius-md) 0 0; display: block; } .movie-card .info { padding: 12px 12px 14px; } }
.local-item .info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.local-item .info .title { font-size: 16px; font-weight: 650; margin-bottom: 4px; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.local-item .info .meta { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty-state, .empty { text-align: center; padding: 56px 20px; color: var(--muted); font-size: 15px; }
.empty-title { color: var(--text); font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.empty-hint { color: var(--muted); font-size: 14px; }
```

- [ ] **Step 6: Keep large mode readable**

Change the existing large-mode list rules to:

```css
body.large-mode .local-list { grid-template-columns: 1fr; gap: 12px; }
body.large-mode .local-item { padding: 14px 18px; min-height: 72px; gap: 16px; border-width: 2px; }
body.large-mode .movie-card { display: flex; }
body.large-mode .movie-card .thumb, body.large-mode .local-item .thumb { width: 90px; height: 128px; aspect-ratio: auto; border-radius: var(--radius-sm); }
body.large-mode .movie-card .info { padding: 0; }
```

- [ ] **Step 7: Run build and tests**

Run: `npm test; if ($?) { npm run build }`

Expected: tests pass, then build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/screens/list.js src/style.css test/mobile-limit.test.js
git commit -m "design: add responsive poster movie cards"
```

## Task 4: Detail Page Panels And Episode Layout

**Files:**
- Modify: `src/screens/detail.js:40-83`
- Modify: `src/style.css:196-244`

- [ ] **Step 1: Update detail markup wrappers and alt text**

In `renderDetail`, replace the first detail HTML lines through the description line with:

```js
  let html = `<div class="detail-hero"><div class="detail-layout"><div class="detail-poster"><img src="${poster}" alt="${sanitizeAttr(movie.name || '')}" width="260" height="390" loading="lazy" onerror="this.style.display='none'"></div>`
  html += `<div class="detail-info"><div class="detail-title-row">`
  html += `<h2>${sanitize(movie.name || '')}</h2>`
  html += `<span class="fav-btn" data-slug="${sanitizeAttr(movie.slug || '')}" aria-label="Yêu thích">${favStar}</span></div>`
  html += `<span class="fav-fab" data-slug="${sanitizeAttr(movie.slug || '')}" aria-label="Yêu thích">${favStar}</span>`
  if (tags.some(Boolean)) html += '<div class="tags">' + tags.filter(Boolean).map(t => `<span>${sanitize(t)}</span>`).join('') + '</div>'
  html += `<div class="desc">${sanitize(movie.content || movie.description || 'Chưa có mô tả')}</div></div></div></div>`
```

- [ ] **Step 2: Wrap episodes in a panel**

Replace:

```js
    html += '<div class="episode-section">'
```

with:

```js
    html += '<div class="episode-section"><div class="episode-panel">'
```

Replace the matching close after episode loops:

```js
    html += '</div>'
```

with:

```js
    html += '</div></div>'
```

Use the close directly under the `for (let s = 0; s < episodes.length; s++)` loop, before the `else` branch.

- [ ] **Step 3: Replace detail CSS with panel layout**

Replace `.detail-layout` through `.episode-btn:active` with:

```css
.detail-hero { padding-top: 16px; }
.detail-layout { display: flex; gap: 28px; align-items: flex-start; background: linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 18px; box-shadow: var(--shadow-dark); }
.detail-poster { width: clamp(150px, 24vw, 320px); flex-shrink: 0; }
.detail-poster img { width: 100%; border-radius: var(--radius-md); box-shadow: 0 24px 70px rgba(0,0,0,0.45); }
.detail-info { flex: 1; min-width: 0; }
.detail-title-row { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.detail-info h2 { font-size: clamp(24px, 4vw, 42px); line-height: 1.08; letter-spacing: -0.035em; margin: 0 0 12px; color: var(--accent); text-wrap: balance; }
.desc { color: var(--muted); font-size: 15px; line-height: 1.75; margin-bottom: 12px; max-width: 65ch; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.tags span { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.06); padding: 5px 10px; border-radius: 999px; font-size: 13px; color: var(--muted); }
.episode-section { margin-top: 18px; max-width: none; }
.episode-panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 16px; }
.server-name { font-size: 16px; color: var(--accent); margin: 4px 0 10px; font-weight: 700; }
.episode-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.episode-btn { padding: 11px 15px; min-height: 46px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); color: var(--text); cursor: pointer; font-size: 14px; display: flex; align-items: center; transition: background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.2s; }
.episode-btn:hover, .episode-btn.focused { border-color: var(--accent); background: rgba(255,212,90,0.08); transform: scale(1.04); box-shadow: var(--shadow-amber); }
.episode-btn:active { transform: scale(0.97); }
```

- [ ] **Step 4: Update responsive detail CSS**

Replace existing detail media rules with:

```css
@media (max-width: 900px) { .detail-layout { flex-direction: column; align-items: flex-start; padding: 14px; } .detail-poster { width: clamp(120px, 42vw, 190px); } .detail-info h2 { font-size: clamp(22px, 7vw, 30px); } }
@media (max-width: 900px) and (orientation: landscape) { .detail-layout { flex-direction: row; align-items: flex-start; } .detail-poster { width: clamp(110px, 18vw, 150px); } .local-list { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1200px) { .detail-poster { width: clamp(240px, 21vw, 380px); } .detail-info h2 { font-size: clamp(32px, 3vw, 48px); } .desc { font-size: 17px; } .episode-panel { max-width: 920px; } .episode-btn { font-size: 17px; min-height: 56px; padding: 14px 20px; } }
```

- [ ] **Step 5: Run build smoke check**

Run: `npm run build`

Expected: build succeeds and no template literal syntax error in `detail.js`.

- [ ] **Step 6: Commit**

```bash
git add src/screens/detail.js src/style.css
git commit -m "design: upgrade movie detail layout"
```

## Task 5: Player Overlay And Error/Empty State Polish

**Files:**
- Modify: `src/style.css:255-586`
- Modify: `src/screens/player.js` only if selectors require no logic change.

- [ ] **Step 1: Strengthen player overlay CSS**

Change player overlay/control rules to:

```css
#player-wrap { display: none; position: fixed; inset: 0; width: 100vw; height: 100dvh; background: #000; z-index: 100; }
#player-wrap.active { display: flex; align-items: center; justify-content: center; }
#player { width: 100%; height: 100%; object-fit: contain; }
#player-ui { position: absolute; bottom: 0; left: 0; right: 0; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
#player-ui.show { opacity: 1; pointer-events: auto; }
#player-overlay { padding: 12px 22px 58px; background: linear-gradient(transparent, rgba(0,0,0,0.92)); }
.p-title { font-size: clamp(18px, 2.3vw, 30px); font-weight: 700; margin-bottom: 6px; text-shadow: 0 2px 18px rgba(0,0,0,0.75); }
.p-controls { display: flex; align-items: center; gap: 12px; padding: 0 22px 14px; }
.p-time { font-size: 13px; color: rgba(255,255,255,0.82); min-width: 42px; font-variant-numeric: tabular-nums; }
.p-seekbar { flex: 1; height: 7px; background: rgba(255,255,255,0.25); border-radius: 999px; cursor: pointer; position: relative; }
.p-seekbar:hover { height: 9px; }
.p-progress { height: 100%; background: var(--accent); border-radius: 999px; width: 0; pointer-events: none; }
.p-hint { font-size: 13px; color: rgba(255,255,255,0.62); pointer-events: none; }
@media (min-width: 1200px) { .p-time { font-size: 18px; min-width: 56px; } .p-hint { font-size: 16px; } .p-seekbar { height: 10px; } }
```

- [ ] **Step 2: Polish error states**

Replace `.error-state`, `.error-title`, `.error-hint`, `.retry-btn`, `.player-error` button rules with variable-based styles:

```css
.error-state { text-align: center; padding: 72px 20px; max-width: 520px; margin: 0 auto; color: var(--muted); }
.error-icon { font-size: 48px; margin-bottom: 16px; }
.error-title { font-size: 22px; font-weight: 750; color: var(--text); margin-bottom: 8px; }
.error-hint { font-size: 15px; color: var(--muted); margin-bottom: 22px; line-height: 1.5; }
.retry-btn { padding: 12px 24px; background: var(--accent); color: #141006; border: none; border-radius: var(--radius-sm); font-size: 15px; font-weight: 750; cursor: pointer; outline: none; transition: background 0.15s, transform 0.15s; }
.retry-btn:hover { background: var(--accent-strong); }
.retry-btn:active { transform: scale(0.97); }
.retry-btn:focus { border: 2px solid var(--accent); }
.player-error { position: absolute; bottom: 88px; left: 50%; transform: translateX(-50%); background: rgba(10, 10, 10, 0.92); border: 1px solid rgba(255,104,104,0.65); border-radius: var(--radius-md); padding: 16px 24px; text-align: center; z-index: 200; min-width: 260px; box-shadow: var(--shadow-dark); }
.player-error-close { padding: 8px 18px; background: var(--accent); color: #141006; border: none; border-radius: var(--radius-sm); font-size: 13px; font-weight: 750; cursor: pointer; }
.player-error-close:hover { background: var(--accent-strong); }
```

- [ ] **Step 3: Run build smoke check**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/style.css
git commit -m "design: polish player and state surfaces"
```

## Task 6: Final Verification And Cleanup

**Files:**
- Modify only files already touched if verification finds a bug.

- [ ] **Step 1: Run full automated checks**

Run: `npm test; if ($?) { npm run build }`

Expected: all Node tests pass, then Vite build succeeds.

- [ ] **Step 2: Inspect git diff**

Run: `git diff --stat HEAD~5..HEAD`

Expected: only planned files changed: `src/style.css`, `src/screens/home.js`, `src/screens/list.js`, `src/screens/detail.js`, `test/mobile-limit.test.js`, and optionally `index.html` or `src/main.js` if used.

- [ ] **Step 3: Manual responsive checklist**

Open the app locally with `npm run dev` and check:

```text
Mobile 390px: home wheel usable, list one column, detail stacked, bottom nav visible.
Desktop 1440px: list poster grid, detail split layout, search centered.
TV 1920px: bottom bar hidden, focus states visible, list not overcrowded, episodes readable.
Large mode: list becomes very readable, episode buttons large, wheel text large.
Player: controls readable, seekbar visible, exit/fullscreen buttons usable.
```

- [ ] **Step 4: Commit any verification fixes**

If Step 3 required changes, commit them:

```bash
git add src/style.css src/screens/home.js src/screens/list.js src/screens/detail.js test/mobile-limit.test.js index.html src/main.js
git commit -m "fix: responsive redesign verification tweaks"
```

If no changes were needed, do not create an empty commit.

## Self-Review Notes

- Spec coverage: Home, list, search, detail, player, focus, states, accessibility, and verification are covered by Tasks 1-6.
- Placeholder scan: no unfinished implementation markers or unspecified steps remain.
- Type/name consistency: helper names are `renderEmptyState` and `renderMovieCard`; imports and test names match.
