# Android TV QA Checklist — WebPhim

## Test Environments

| Environment | Device | Priority |
|-------------|--------|----------|
| Android TV Real | Fire TV Stick 4K, Chromecast GTV, Nvidia Shield | P0 |
| Android Emulator | Memu, Android Studio Emulator (API 28-34) | P0 |
| Desktop Browser | Chrome 120+, Edge 120+, Firefox 120+ | P1 |
| Mobile Browser | Chrome Android, Safari iOS | P2 |

---

## 1. Navigation Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| NAV-01 | Home screen loads | Launch app | Home screen displays with movie rows | ⬜ |
| NAV-02 | D-pad down from toolbar | Press ArrowDown from header | Focus moves to first poster card | ⬜ |
| NAV-03 | D-pad up from first row | Press ArrowUp from first poster | Focus moves to header toolbar | ⬜ |
| NAV-04 | D-pad right in carousel | Press ArrowRight on poster | Focus moves to next card; carousel scrolls | ⬜ |
| NAV-05 | D-pad left in carousel | Press ArrowLeft on poster | Focus moves to previous card | ⬜ |
| NAV-06 | Enter on poster opens detail | Press Enter on focused poster | Detail screen loads for selected movie | ⬜ |
| NAV-07 | Back from detail returns home | Press Back/Escape on detail | Returns to home screen | ⬜ |
| NAV-08 | Navigate to list screen | Click nav button (Phim Mới, etc.) | List screen loads with movies | ⬜ |
| NAV-09 | List D-pad navigation | Arrow keys in list | Focus moves grid-aware (by row) | ⬜ |
| NAV-10 | Back from list returns home | Press Back on list | Returns to home screen | ⬜ |
| NAV-11 | Detail → Player → Back | Play episode then press Back | Returns to detail screen | ⬜ |
| NAV-12 | List → Detail → Player → Back | Full navigation chain | Returns to correct previous screen | ⬜ |
| NAV-13 | Exit dialog on home | Press Back on home screen | Exit confirmation dialog appears | ⬜ |
| NAV-14 | Exit dialog dismiss | Press Escape or select "Không" | Dialog closes; app stays open | ⬜ |
| NAV-15 | Exit dialog confirm | Select "Thoát" and press Enter | App exits | ⬜ |
| NAV-16 | Focus visible on all elements | Navigate through all screens | Amber focus outline visible on all interactive elements | ⬜ |
| NAV-17 | Scroll into view | Navigate to off-screen element | Element scrolls into viewport | ⬜ |
| NAV-18 | Server switch in detail | Navigate to server select, change server | Episode list updates | ⬜ |
| NAV-19 | Favorite button accessible | Navigate to detail, focus favorite | Button is focusable via D-pad | ⬜ |
| NAV-20 | Categories navigation | Navigate to categories, select one | Filtered movie list loads | ⬜ |

---

## 2. Playback Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PLAY-01 | Play episode from detail | Select episode, press Enter | Video starts playing | ⬜ |
| PLAY-02 | Play/pause toggle | Press Enter or Space during playback | Video pauses/resumes | ⬜ |
| PLAY-03 | Seek forward | Press ArrowRight in player | Seeks +10 seconds | ⬜ |
| PLAY-04 | Seek backward | Press ArrowLeft in player | Seeks -10 seconds | ⬜ |
| PLAY-05 | Seek feedback visible | Press ArrowLeft/Right | +/-10s feedback overlay appears | ⬜ |
| PLAY-06 | Player overlay shows | Press ArrowDown in player | Controls overlay appears | ⬜ |
| PLAY-07 | Player overlay auto-hide | Wait 4 seconds | Overlay fades out | ⬜ |
| PLAY-08 | Exit player | Press Escape in player | Returns to previous screen | ⬜ |
| PLAY-09 | Auto-next episode | Let episode finish | Next episode starts automatically | ⬜ |
| PLAY-10 | End of playlist | Let last episode finish | "Hết danh sách" message; auto-exit | ⬜ |
| PLAY-11 | Progress bar updates | During playback | Progress bar and time update | ⬜ |
| PLAY-12 | Fullscreen toggle | Press F key | Toggles fullscreen mode | ⬜ |
| PLAY-13 | Gesture hints appear | Start new playback | Hints shown for 3 seconds | ⬜ |
| PLAY-14 | Multi-server playback | Switch server, play episode | Correct server stream plays | ⬜ |
| PLAY-15 | Broken stream handling | Play episode with invalid URL | Error message displayed | ⬜ |

---

## 3. Search Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| SEARCH-01 | Header search focus | Navigate to toolbar, focus search input | Input is focusable | ⬜ |
| SEARCH-02 | Type and search | Type query, press Enter | Search results display | ⬜ |
| SEARCH-03 | Local search results | Search for known local movie | Results from local index | ⬜ |
| SEARCH-04 | API search fallback | Search for unknown movie | API search triggers | ⬜ |
| SEARCH-05 | Empty search handling | Press Enter on empty input | No crash; keyboard reopens (TV) | ⬜ |
| SEARCH-06 | `/` shortcut | Press `/` key | Focus moves to search input | ⬜ |
| SEARCH-07 | Search results navigation | Navigate results with D-pad | Focus moves through results | ⬜ |
| SEARCH-08 | Select search result | Press Enter on result | Detail screen loads | ⬜ |
| SEARCH-09 | Escape search | Press Escape in search mode | Returns to home | ⬜ |
| SEARCH-10 | No results message | Search for non-existent movie | "Không tìm thấy" message | ⬜ |

---

## 4. IPTV Stream Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| IPTV-01 | Load IPTV stream | Open IPTV-compatible stream | Stream loads and plays | ⬜ |
| IPTV-02 | IPTV channel switch | Switch between channels | New channel loads | ⬜ |
| IPTV-03 | IPTV EPG display | Open EPG/guide | Program guide displays | ⬜ |
| IPTV-04 | IPTV stream error | Load broken stream | Error message with retry option | ⬜ |
| IPTV-05 | IPTV buffering | During stream loading | Buffering indicator shown | ⬜ |

---

## 5. HLS Stream Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| HLS-01 | HLS stream playback | Play HLS (.m3u8) stream | Stream plays correctly | ⬜ |
| HLS-02 | HLS quality adaptation | During playback | Quality adapts to bandwidth | ⬜ |
| HLS-03 | HLS seek | Seek in HLS stream | Seeks correctly | ⬜ |
| HLS-04 | HLS error recovery | Disconnect/reconnect | Stream recovers or shows error | ⬜ |
| HLS-05 | HLS with subtitles | Play HLS with subtitle track | Subtitles display correctly | ⬜ |
| HLS-06 | HLS audio track switch | Switch audio track | Audio changes | ⬜ |

---

## 6. DASH Stream Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| DASH-01 | DASH stream playback | Play DASH (.mpd) stream | Stream plays correctly | ⬜ |
| DASH-02 | DASH quality levels | Check quality options | Multiple quality levels available | ⬜ |
| DASH-03 | DASH seek | Seek in DASH stream | Seeks correctly | ⬜ |
| DASH-04-04 | DASH error handling | Play broken DASH stream | Error message displayed | ⬜ |

---

## 7. Subtitle Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| SUB-01 | SRT subtitle load | Play video with SRT subtitle | Subtitles display | ⬜ |
| SUB-02 | VTT subtitle load | Play video with VTT subtitle | Subtitles display | ⬜ |
| SUB-03 | Subtitle toggle | Toggle subtitle on/off | Subtitles show/hide | ⬜ |
| SUB-04 | Subtitle language switch | Switch subtitle language | New language loads | ⬜ |
| SUB-05 | Subtitle sync | During playback | Subtitles synced with video | ⬜ |
| SUB-06 | Subtitle styling | Check subtitle appearance | Readable font, size, position | ⬜ |

---

## 8. Network Disconnect Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| NET-01 | Disconnect during browse | Navigate while offline | Cached content shown; error for new | ⬜ |
| NET-02 | Disconnect during playback | Disconnect mid-playback | Error message; retry option | ⬜ |
| NET-03 | Reconnect recovery | Reconnect network | App recovers; content reloads | ⬜ |
| NET-04 | Offline mode | Start app offline | Cached content accessible | ⬜ |
| NET-05 | Slow network | Throttle to 3G | Graceful degradation | ⬜ |
| NET-06 | API fallback | Primary API fails | Falls back to secondary API | ⬜ |
| NET-07 | Image fail fallback | Block image CDN | Text mode activates after 3 fails | ⬜ |

---

## 9. Resume Playback Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| RES-01 | Resume from history | Reopen previously watched movie | "Đang xem" marker on episode | ⬜ |
| RES-02 | Resume position | Reopen partially watched episode | Resumes from last position | ⬜ |
| RES-03 | History persistence | Close and reopen app | History preserved | ⬜ |
| RES-04 | Continue watching row | Return home after watching | Movie appears in continue row | ⬜ |
| RES-05 | Cross-device resume | Watch on one device, open another | History synced (if account) | ⬜ |

---

## 10. Login Persistence Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| LOGIN-01 | Login state persists | Login, close app, reopen | Still logged in | ⬜ |
| LOGIN-02 | Token refresh | After token expiry | Auto-refreshes token | ⬜ |
| LOGIN-03 | Session expiry | After session expires | Prompts re-login | ⬜ |
| LOGIN-04 | Logout | Press logout | Session cleared | ⬜ |
| LOGIN-05 | Offline with login | Go offline while logged in | Cached data accessible | ⬜ |

---

## 11. Memory Consumption Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| MEM-01 | Cold start memory | Launch app | < 150MB RAM usage | ⬜ |
| MEM-02 | Navigation memory | Navigate 20 pages | No continuous memory growth | ⬜ |
| MEM-03 | Playback memory | Play 5 episodes sequentially | Memory stable; no leaks | ⬜ |
| MEM-04 | Image cache | Browse many images | Images cached; memory bounded | ⬜ |
| MEM-05 | Back stack memory | Navigate deep stack | Memory doesn't grow unbounded | ⬜ |
| MEM-06 | Long session | 30-minute continuous use | No ANR; memory stable | ⬜ |
| MEM-07 | Player cleanup | Exit player | Video element cleaned up | ⬜ |

---

## 12. Remote Control Behavior Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| REMOTE-01 | D-pad navigation | Use arrow keys on remote | Focus moves correctly | ⬜ |
| REMOTE-02 | Enter/Select | Press Enter/Select | Activates focused element | ⬜ |
| REMOTE-03 | Back button | Press Back | Goes back or shows exit dialog | ⬜ |
| REMOTE-04 | Play/Pause media key | Press media play/pause | Toggles playback | ⬜ |
| REMOTE-05 | Fast forward media key | Press FF (if mapped) | Seeks forward | ⬜ |
| REMOTE-06 | Rewind media key | Press RW (if mapped) | Seeks backward | ⬜ |
| REMOTE-07 | Voice search | Press microphone button | Voice input activates | ⬜ |
| REMOTE-08 | Home button | Press Home | Goes to home or background | ⬜ |
| REMOTE-09 | Long press | Long press on element | Context menu (if any) | ⬜ |
| REMOTE-10 | Key repeat | Hold arrow key | Focus moves continuously | ⬜ |

---

## 13. TV-Specific Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| TV-01 | TV mode detection | Open on Android TV | `tv-mode` class applied | ⬜ |
| TV-02 | Overscan safe area | Navigate to screen edges | Content not cut off | ⬜ |
| TV-03 | Bottom bar hidden | Check TV mode | Bottom nav hidden | ⬜ |
| TV-04 | Top nav hidden | Check TV mode | Top nav hidden | ⬜ |
| TV-05 | Toolbar accessible | ArrowUp from first row | Toolbar items focusable | ⬜ |
| TV-06 | Reduced motion | Enable in system settings | Animations disabled | ⬜ |
| TV-07 | Leanback launcher | Install TV APK | App appears in TV launcher | ⬜ |
| TV-08 | Banner display | Check TV launcher | TV banner displays correctly | ⬜ |
| TV-09 | No touch required | Use only remote | All features accessible | ⬜ |
| TV-10 | Font readability | View from 3 meters | Text readable at distance | ⬜ |

---

## 14. Error Handling Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| ERR-01 | API timeout | Simulate slow API | Timeout error; retry option | ⬜ |
| ERR-02 | API 500 error | Server returns 500 | Error message; fallback API | ⬜ |
| ERR-03 | Invalid movie slug | Navigate to non-existent movie | "Không tìm thấy" message | ⬜ |
| ERR-04 | Corrupt HLS stream | Play corrupt .m3u8 | Error message; recovery attempt | ⬜ |
| ERR-05 | Storage full | Fill localStorage | Graceful degradation | ⬜ |
| ERR-06 | Network offline | Go offline | Offline indicator; cached content | ⬜ |

---

## 15. Performance Tests

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| PERF-01 | Cold start time | Launch app | < 3 seconds to interactive | ⬜ |
| PERF-02 | Home load time | Load home screen | < 2 seconds | ⬜ |
| PERF-03 | Search response | Execute search | < 1 second for local results | ⬜ |
| PERF-04 | Episode switch | Switch episodes | < 2 seconds to start playback | ⬜ |
| PERF-05 | Image load | Browse posters | Images load progressively | ⬜ |
| PERF-06 | Scroll smoothness | Scroll through lists | 60fps scrolling | ⬜ |

---

## Static Analysis Checklist

| ID | Check | Tool | Expected | Status |
|----|-------|------|----------|--------|
| STATIC-01 | No console errors | Browser DevTools | 0 errors | ⬜ |
| STATIC-02 | No 404 resources | Network tab | 0 missing resources | ⬜ |
| STATIC-03 | No memory leaks | Chrome DevTools Memory | Stable heap | ⬜ |
| STATIC-04 | No CORS errors | Console | 0 CORS errors | ⬜ |
| STATIC-05 | Valid HTML | W3C Validator | No critical errors | ⬜ |
| STATIC-06 | No inline scripts | CSP check | No unsafe-inline | ⬜ |
| STATIC-07 | HTTPS only | Network tab | All requests HTTPS | ⬜ |
| STATIC-08 | No sensitive data in localStorage | DevTools | No passwords/tokens | ⬜ |

---

## Test Execution Summary

| Category | Total | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| Navigation | 20 | 0 | 0 | 0 |
| Playback | 15 | 0 | 0 | 0 |
| Search | 10 | 0 | 0 | 0 |
| IPTV Streams | 5 | 0 | 0 | 0 |
| HLS Streams | 6 | 0 | 0 | 0 |
| DASH Streams | 4 | 0 | 0 | 0 |
| Subtitles | 6 | 0 | 0 | 0 |
| Network Disconnect | 7 | 0 | 0 | 0 |
| Resume Playback | 5 | 0 | 0 | 0 |
| Login Persistence | 5 | 0 | 0 | 0 |
| Memory Consumption | 7 | 0 | 0 | 0 |
| Remote Control | 10 | 0 | 0 | 0 |
| TV-Specific | 10 | 0 | 0 | 0 |
| Error Handling | 6 | 0 | 0 | 0 |
| Performance | 6 | 0 | 0 | 0 |
| **TOTAL** | **122** | **0** | **0** | **0** |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |
