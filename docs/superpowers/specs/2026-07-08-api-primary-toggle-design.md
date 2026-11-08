# API Primary Toggle Design

## Goal
Add a small header button that lets the user switch the preferred API source at runtime.

## Behavior
- Home replaces the `Hoạt Hình` row with `Phim Chiếu Rạp`.
- Header shows `API: Proxy`, `API: OPhim`, or `API: PhimAPI` with a health dot.
- Dot is green when the selected API healthcheck succeeds, red when it fails.
- Clicking the button cycles: `Proxy` -> `OPhim` -> `PhimAPI` -> `Proxy`.
- Selection persists in `localStorage` under `wp_api_primary`.
- After switching, the app reloads home data so the user sees the new source immediately.

## API Order
- `proxy`: Vercel proxy first, then direct `ophim1.com`, then `phimapi.com`.
- `ophim`: `ophim1.com` first, then `phimapi.com`, then proxy.
- `phimapi`: `phimapi.com` first, then `ophim1.com`, then proxy.

## Files
- `src/api.js`: add source preference helpers and use source-specific request order in `apiGet()`.
- `src/api.js`: add lightweight healthcheck for the selected API.
- `src/main.js`: add header button, click handler, status dot refresh, and home reload.
- `src/screens/home.js`: replace `Hoạt Hình` row with `Phim Chiếu Rạp`.
- `src/style.css`: add green/red API status dot styles.
- Tests: update/add API ordering regression tests.

## Non-Goals
- No dropdown menu.
- No new settings screen.
- No database or server changes.
