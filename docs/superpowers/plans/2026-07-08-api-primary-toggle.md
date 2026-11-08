# API Primary Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent API source toggle with health status and replace the home `Hoạt Hình` row with `Phim Chiếu Rạp`.

**Architecture:** Keep all API selection logic in `src/api.js`, with `main.js` only rendering/cycling the button. Use localStorage for persistence. Healthcheck uses the existing movie-list endpoint with a tiny limit.

**Tech Stack:** Vite, vanilla JS modules, localStorage, Node test runner.

---

### Task 1: API Source Selection

**Files:**
- Modify: `src/api.js`
- Modify: `test/mobile-limit.test.js`

- [ ] **Step 1: Add tests for API source order**

Add tests to `test/mobile-limit.test.js`:

```js
test('apiGet uses selected OPhim as primary', async () => {
  const oldFetch = globalThis.fetch
  const oldLocalStorage = globalThis.localStorage
  const urls = []
  globalThis.localStorage = { getItem: () => 'ophim' }
  globalThis.fetch = async url => {
    urls.push(url)
    return { ok: true, json: async () => ({ status: 'success' }) }
  }

  try {
    assert.deepEqual(await apiGet('/v1/api/danh-sach/phim-bo?page=1', 0), { status: 'success' })
    assert.equal(urls[0], 'https://ophim1.com/v1/api/danh-sach/phim-bo?page=1')
  } finally {
    globalThis.fetch = oldFetch
    globalThis.localStorage = oldLocalStorage
  }
})

test('apiGet uses selected PhimAPI as primary', async () => {
  const oldFetch = globalThis.fetch
  const oldLocalStorage = globalThis.localStorage
  const urls = []
  globalThis.localStorage = { getItem: () => 'phimapi' }
  globalThis.fetch = async url => {
    urls.push(url)
    return { ok: true, json: async () => ({ status: 'success' }) }
  }

  try {
    assert.deepEqual(await apiGet('/v1/api/danh-sach/phim-bo?page=1', 0), { status: 'success' })
    assert.equal(urls[0], 'https://phimapi.com/v1/api/danh-sach/phim-bo?page=1')
  } finally {
    globalThis.fetch = oldFetch
    globalThis.localStorage = oldLocalStorage
  }
})
```

- [ ] **Step 2: Run tests and verify new tests fail**

Run: `npm test`

Expected: new source-order tests fail because `apiGet()` still uses proxy first.

- [ ] **Step 3: Implement API source helpers**

In `src/api.js`, add:

```js
const API_SOURCE_KEY = 'wp_api_primary'
export const API_SOURCES = ['proxy', 'ophim', 'phimapi']

export function getApiSource() {
  try {
    const source = localStorage.getItem(API_SOURCE_KEY)
    return API_SOURCES.includes(source) ? source : 'proxy'
  } catch { return 'proxy' }
}

export function setApiSource(source) {
  if (!API_SOURCES.includes(source)) return
  try { localStorage.setItem(API_SOURCE_KEY, source) } catch {}
}

export function nextApiSource() {
  const current = getApiSource()
  return API_SOURCES[(API_SOURCES.indexOf(current) + 1) % API_SOURCES.length]
}
```

Refactor `apiGet()` to build request order from `getApiSource()`.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: all tests pass.

---

### Task 2: API Toggle Button and Health Dot

**Files:**
- Modify: `src/api.js`
- Modify: `src/main.js`
- Modify: `src/style.css`

- [ ] **Step 1: Add healthcheck helper**

In `src/api.js`, export:

```js
export async function checkApiHealth(source = getApiSource()) {
  const target = apiTargetsForSource(source)[0]
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const url = target.proxy
      ? target.base + '?path=' + encodeURIComponent('/danh-sach/phim-moi-cap-nhat?page=1&limit=1')
      : target.base + '/danh-sach/phim-moi-cap-nhat?page=1&limit=1'
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-cache' })
    clearTimeout(timer)
    return res.ok
  } catch { return false }
}
```

- [ ] **Step 2: Add button to header**

In `src/main.js`, import `getApiSource`, `setApiSource`, `nextApiSource`, and `checkApiHealth`. Add:

```html
<button class="api-toggle-btn" id="api-toggle-btn" aria-label="Chọn API"><span class="api-dot pending"></span><span id="api-toggle-label">API: Proxy</span></button>
```

near the other header buttons.

- [ ] **Step 3: Add label/status functions**

In `src/main.js`, add functions to update label and health dot. Labels map: `proxy` -> `Proxy`, `ophim` -> `OPhim`, `phimapi` -> `PhimAPI`.

- [ ] **Step 4: Add click handler**

In `handleClick()`, when `#api-toggle-btn` is clicked, set next API source, refresh label/status, and call `loadHomeData()`.

- [ ] **Step 5: Add styles**

In `src/style.css`, add styles for `.api-toggle-btn`, `.api-dot.ok`, `.api-dot.err`, `.api-dot.pending`.

- [ ] **Step 6: Verify**

Run: `npm test` and `npm run build`.

Expected: tests pass and build succeeds.

---

### Task 3: Replace Home Row

**Files:**
- Modify: `src/screens/home.js`
- Modify: tests if needed

- [ ] **Step 1: Replace row config**

In `src/screens/home.js`, change:

```js
{ type: 'hoat-hinh', label: 'Hoạt Hình' },
```

to:

```js
{ type: 'phim-chieu-rap', label: 'Phim Chiếu Rạp' },
```

- [ ] **Step 2: Verify**

Run: `npm test` and `npm run build`.

Expected: tests pass and build succeeds.

---

### Task 4: Final Commit

**Files:**
- Modified files from previous tasks

- [ ] **Step 1: Review diff**

Run: `git diff -- src/api.js src/main.js src/style.css src/screens/home.js test/mobile-limit.test.js`

- [ ] **Step 2: Commit and push**

Run:

```bash
git add src/api.js src/main.js src/style.css src/screens/home.js test/mobile-limit.test.js
git commit -m "feat: add API primary toggle with health status"
git push origin main
```

---

## Self-Review

- Spec coverage: API toggle, persistence, source order, health dot, home row replacement are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: source keys are `proxy`, `ophim`, `phimapi` throughout.
