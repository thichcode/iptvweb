# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- **CRITICAL**: Fixed XSS vulnerability in `poster-card` year field — now uses `sanitize()` before HTML insertion
- **CRITICAL**: Fixed XSS in `tv.html` error messages — switched from `innerHTML` concatenation to `textContent` assignment
- **CRITICAL**: Fixed XSS in update modal version display — uses `textContent` instead of template literal
- Sanitized all API-sourced strings before DOM insertion

### Fixed
- **CRITICAL**: Player back navigation now restores the correct previous screen (not always detail) — tracks `prePlayerScreen` and `prePlayerScrollY`
- **CRITICAL**: Memory leak in `updateProgress()` — added guard to skip execution when player is not active
- **CRITICAL**: D-pad navigation in detail screen now includes favorite button, FAB, and server select dropdown
- **MEDIUM**: Toast singleton pattern — prevents duplicate elements, auto-removes after hide transition
- **MEDIUM**: Keyboard.show() guard — prevents repeated IME flicker on repeated focus events
- **MEDIUM**: Exit dialog index reset — `exitDialogIdx` resets to 1 ("Không") on every `removeExitConfirm()`
- **MEDIUM**: `autoNow()` null stream guard — skips episodes with empty `link_m3u8`, shows "end of playlist" message
- **MEDIUM**: API request deduplication — concurrent calls to same URL share a single in-flight promise
- **MEDIUM**: IntersectionObserver initialization wrapped in try/catch with render-all fallback
- **LOW**: Removed unused `progressTimer` variable from player.js
- **LOW**: Removed dead `phim-chieu-rap` label mapping

### Added
- Separate Android TV APK build (`WebPhimTV.apk`) with dedicated `appId: com.webphim.tv`
- `capacitor.config.tv.json` — TV-specific Capacitor configuration
- `scripts/build-tv.ps1` — local TV APK build script
- GitHub Actions workflow now builds both APKs in parallel
- Exit confirmation dialog (yes/no) replaces double-press-to-exit behavior

### Changed
- `goBack()` on home screen shows exit confirmation dialog instead of toast + double-press
- Update modal uses safe DOM construction (textContent/href assignment instead of innerHTML)
- Search input focus handler includes keyboard visibility guard

## [1.0.0] - 2025-01-01

### Added
- Initial release
- HLS video playback via hls.js
- Multi-server episode selection
- Favorites and watch history (localStorage)
- Categories and countries browsing
- Android TV mode detection and UI optimization
- API source cycling (Proxy, OPhim, PhimAPI)
- Service Worker for offline caching
