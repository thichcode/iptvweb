# Test Plan — WebPhim Android TV

## Test Environments

| Environment | Target | Priority |
|-------------|--------|----------|
| Android TV (real) | Fire TV Stick, Chromecast GTV, Samsung Tizen | P0 |
| Android Emulator | Memu, Android Studio Emulator | P0 |
| Desktop Browser | Chrome, Edge, Firefox | P1 |
| Mobile Browser | Chrome Android, Safari iOS | P1 |

---

## 1. Security Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| SEC-01 | XSS in year field | Inject `<img src=x onerror=alert(1)>` as year value via API mock | Script does not execute; text shown as literal string | ⬜ |
| SEC-02 | XSS in search error | Trigger network error in search | Error message displayed safely without script execution | ⬜ |
| SEC-03 | XSS in update modal | Mock GitHub API returning `<script>alert(1)</script>` as tag_name | Script does not execute | ⬜ |
| SEC-04 | API key exposure | Inspect source code and network requests | No hardcoded API keys or secrets | ⬜ |

---

## 2. Core Playback Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| PLAY-01 | Play episode from detail | Navigate to movie, select episode, press Enter | Video starts playing within 5s | ⬜ |
| PLAY-02 | HLS stream error recovery | Disconnect network mid-playback | Error message shown; retry option available | ⬜ |
| PLAY-03 | Auto-next episode | Let episode finish | Next episode starts automatically | ⬜ |
| PLAY-04 | End of playlist | Let last episode finish | "Hết danh sách phát" message; auto-exit after 2s | ⬜ |
| PLAY-05 | Seek forward/backward | Press ArrowRight/ArrowLeft in player | Seeks ±10s with visual feedback | ⬜ |
| PLAY-06 | Play/pause toggle | Press Enter or Space in player | Toggles play/pause state | ⬜ |
| PLAY-07 | Exit player | Press Escape in player | Returns to correct previous screen | ⬜ |
| PLAY-08 | Player overlay auto-hide | Wait 4 seconds in player | Controls fade out | ⬜ |

---

## 3. Navigation Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| NAV-01 | Home → Detail → Back | Navigate to movie, press Back | Returns to home screen | ⬜ |
| NAV-02 | Home → List → Detail → Back | Navigate list → movie → Back | Returns to list (not home) | ⬜ |
| NAV-03 | Detail → Player → Back | Play episode → Back | Returns to detail screen | ⬜ |
| NAV-04 | List → Player → Back | Play from list → Back | Returns to list screen | ⬜ |
| NAV-05 | D-pad favorite button | Navigate to detail, focus favorite button | Button is focusable and clickable via remote | ⬜ |
| NAV-06 | D-pad server select | Navigate to detail, focus server select | Dropdown is focusable and opens on Enter | ⬜ |
| NAV-07 | Exit dialog flow | Press Back on home | Dialog appears; "Không" is default; Escape dismisses | ⬜ |
| NAV-08 | Exit confirmation | Press Back → select "Thoát" → Enter | App exits | ⬜ |

---

## 4. Search Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| SEARCH-01 | Local search | Type in header search, press Enter | Results display from local index | ⬜ |
| SEARCH-02 | API search fallback | Type query not in local index | API search triggers, results display | ⬜ |
| SEARCH-03 | Empty search | Press Enter on empty input | No crash; keyboard reopens (TV) | ⬜ |
| SEARCH-04 | `/` shortcut | Press `/` key | Focus moves to search input | ⬜ |
| SEARCH-05 | Voice search (TV) | Use microphone on remote | Voice input populates search field | ⬜ |

---

## 5. TV Mode Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| TV-01 | TV detection | Open app on Android TV device | `body.tv-mode` class applied | ⬜ |
| TV-02 | Desktop not detected as TV | Open on 1080p desktop | No `tv-mode` class; nav visible | ⬜ |
| TV-03 | Overscan padding | Navigate to screen edges on TV | Content not cut off | ⬜ |
| TV-04 | Focus glow visible | D-pad to any element | Amber outline + glow visible | ⬜ |
| TV-05 | Bottom bar hidden | Check TV mode | Bottom navigation bar is hidden | ⬜ |
| TV-06 | Top nav hidden | Check TV mode | Top navigation bar is hidden | ⬜ |
| TV-07 | Toolbar search accessible | Press ArrowUp from first row | Focus moves to search input | ⬜ |

---

## 6. Performance Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| PERF-01 | Cold start time | Launch app on Fire TV Stick | Interactive within 3 seconds | ⬜ |
| PERF-02 | Memory stability | Navigate 20 pages, check for leaks | No increasing memory usage | ⬜ |
| PERF-03 | Image fail fallback | Block image CDN | After 3 failures, text-mode activates | ⬜ |
| PERF-04 | API deduplication | Rapidly navigate between screens | No duplicate API calls for same URL | ⬜ |
| PERF-05 | Lazy loading | Scroll through home rows | Rows load as they enter viewport | ⬜ |

---

## 7. Library Feature Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| LIB-01 | Add favorite | Press Enter on favorite button | Star fills; item appears in favorites row | ⬜ |
| LIB-02 | Remove favorite | Press Enter on filled favorite button | Star empties; item removed from favorites | ⬜ |
| LIB-03 | Continue watching | Watch partial episode, return home | Movie appears in "Tiếp Tục Xem" row | ⬜ |
| LIB-04 | Browse categories | Navigate to categories | Category list loads; selecting filters movies | ⬜ |
| LIB-05 | Browse countries | Navigate to countries | Country list loads; selecting filters movies | ⬜ |
| LIB-06 | Pagination | Navigate to page 2 | New page of movies loads | ⬜ |

---

## 8. Build & Deployment Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| BUILD-01 | Main APK build | Run `npm run build` + `cap sync` | APK builds successfully | ⬜ |
| BUILD-02 | TV APK build | Run `.\scripts\build-tv.ps1` | `WebPhimTV.apk` created | ⬜ |
| BUILD-03 | Both APKs installable | Install both on same device | Both apps launch independently | ⬜ |
| BUILD-04 | TV APK in launcher | Install TV APK on Android TV | App appears in Leanback launcher | ⬜ |
| BUILD-05 | GitHub Actions release | Push to main | Both APKs attached to GitHub Release | ⬜ |

---

## 9. Regression Tests

| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| REG-01 | Back from player (home source) | Home → detail → play → Back | Returns to detail | ⬜ |
| REG-02 | Back from player (list source) | Home → list → detail → play → Back | Returns to detail | ⬜ |
| REG-03 | Exit dialog dismiss | Back → Escape or select "Không" | Dialog closes; app stays open | ⬜ |
| REG-04 | Toast no duplicates | Trigger multiple rapid toasts | Single toast element; no accumulation | ⬜ |
| REG-05 | Keyboard guard | Focus search input multiple times | IME shown once; no flicker | ⬜ |

---

## Test Execution Checklist

- [ ] All P0 tests pass on Android TV real device
- [ ] All P0 tests pass on Android Emulator (Memu)
- [ ] All P1 tests pass on Desktop Browser
- [ ] All P1 tests pass on Mobile Browser
- [ ] No console errors in any environment
- [ ] No memory leaks after 30-minute session
- [ ] Both APKs build and install successfully
