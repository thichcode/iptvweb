# Chuẩn Hóa UI/UX Đa Nền Tảng (PC, Mobile, Android TV APK) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng Adaptive Platform Engine và chuẩn hóa trải nghiệm UI/UX cho cả 3 môi trường (PC Desktop, Mobile Touch Web/APK, và Android TV Box Remote) trong một codebase duy nhất `src/`, loại bỏ sự phân mảnh của `public/tv.html`.

**Architecture:** Tạo module điều phối `src/platform.js` phát hiện môi trường động và gán class/data attributes; tái cấu trúc layout shell với Top-Nav mở rộng cho PC, Bottom Navigation 4 tab chuẩn app cho Mobile, và 10-foot UI cho Android TV; tối ưu Player theo đặc thù từng thiết bị và hợp nhất kịch bản build TV APK từ bundle chính.

**Tech Stack:** JavaScript (ES modules), CSS3 (CSS Variables, Flexbox, Grid, Media Queries, Safe Area Insets), Vite, Capacitor (@capacitor/core, @capacitor/app), Node.js test runner (`node --test`).

**Spec:** `docs/superpowers/specs/2026-10-12-cross-platform-ui-ux-design.md`

## Global Constraints

- Không làm phá vỡ 32 bài kiểm thử hiện có của dự án (`npm test`).
- Màu chủ đạo giữ nguyên: nền tối `#0b0b09`, màu nhấn vàng hổ phách `var(--accent, #ffd45a)`, text `#fff8e6`.
- Không sử dụng thư viện UI nặng nề; giữ nguyên triết lý Vanilla JS thuần và CSS hiệu năng cao.
- Mobile đảm bảo hỗ trợ đầy đủ `env(safe-area-inset-top)` và `env(safe-area-inset-bottom)`.
- Android TV đảm bảo D-pad Spatial Navigation không bị trễ khung hình, cuộn tức thì (`scroll-behavior: auto`).

## Review Focus

- Người dùng cắm bàn phím ngoài vào điện thoại hoặc cắm chuột vào TV: Platform Engine phải ưu tiên chế độ cảm ứng/remote phù hợp mà không bị lỗi giao diện.
- Người dùng xoay ngang màn hình điện thoại: Bottom Bar tự động thu gọn hoặc đệm hợp lý, không che nội dung video.
- Nhấn phím cứng Back liên tục trên Android: Ứng dụng phải xử lý ngăn nắp từng lớp (modal -> watch panel -> screen back -> double-press toast exit), không bao giờ văng app đột ngột.
- Video đang phát bị gián đoạn khi mở menu chọn tập trên TV: Watch-Mode Panel phải hiển thị đè lên trên và video nền vẫn phát liên tục.
- Không có kết nối mạng hoặc ảnh poster lỗi: Thẻ card trên cả 3 nền tảng phải có fallback text-only chỉn chu, không vỡ layout grid.

---

### Task 1: Module Adaptive Platform Engine (`src/platform.js`)

**Files:**
- Create: `src/platform.js`
- Test: `test/platform-engine.test.js`

**Interfaces:**
- Produces:
  - `detectPlatform(ua?: string, width?: number, isCoarse?: boolean, isTVFlag?: boolean): 'pc' | 'mobile' | 'tv'`
  - `initPlatform(): 'pc' | 'mobile' | 'tv'`
  - `getPlatform(): 'pc' | 'mobile' | 'tv'`
  - `isPC(): boolean`, `isMobile(): boolean`, `isTV(): boolean`

- [ ] **Step 1: Viết bài test thất bại cho Platform Engine**

Tạo `test/platform-engine.test.js` kiểm tra:
1. Detect TV từ User-Agent (Android TV, Leanback, BRAVIA, SmartTV).
2. Detect Mobile từ thiết bị touch / viewport hẹp ($< 768\text{px}$).
3. Detect PC từ desktop viewport lớn và pointer fine.
4. Cập nhật thuộc tính DOM `data-platform` và class `platform-*` tương ứng.

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `node --test test/platform-engine.test.js`
Expected: FAIL với lỗi module `src/platform.js` chưa tồn tại.

- [ ] **Step 3: Triển khai `src/platform.js`**

Hiện thực hàm phát hiện `detectPlatform`, phương thức khởi tạo `initPlatform` gắn lắng nghe resize / input và đồng bộ `document.documentElement.dataset.platform` cùng `document.body.classList`.

- [ ] **Step 4: Chạy lại test để xác nhận test đã PASS**

Run: `node --test test/platform-engine.test.js`
Expected: PASS toàn bộ các test cases của platform engine.

- [ ] **Step 5: Commit code**

```bash
git add src/platform.js test/platform-engine.test.js
git commit -m "feat: add adaptive platform engine with multi-environment detection"
```

---

### Task 2: Tái cấu trúc Layout Shell & Thanh điều hướng (PC Top-Nav & Mobile Bottom-Nav 4 Tab)

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`
- Test: `test/ui-regressions.test.js`

**Interfaces:**
- Consumes: `initPlatform()`, `isMobile()`, `isPC()`, `isTV()` từ `src/platform.js`
- Produces:
  - Mobile Bottom Bar 4 tab: `#nav-home`, `#nav-explore`, `#nav-search`, `#nav-profile`
  - PC Top Nav: Menu danh mục, ô tìm kiếm phím tắt `/`, nút API nguồn và Thumb mode
  - Mobile Minimal Header: Logo và API status badge, ẩn bớt nút phụ trên màn hình nhỏ

- [ ] **Step 1: Viết test kiểm tra cấu trúc DOM Shell mới**

Bổ sung test trong `test/ui-regressions.test.js` xác minh:
- Bottom bar trên mobile chứa đủ 4 tab với `data-nav` tương ứng (`home`, `explore`, `search`, `profile`).
- Header trên mobile có class/cấu trúc tinh giản và hỗ trợ safe area.

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `node --test test/ui-regressions.test.js`
Expected: FAIL do Bottom bar hiện tại vẫn là 4 nút cũ (`nav-back`, `nav-search-btn`, `nav-home`, `nav-fav`).

- [ ] **Step 3: Cập nhật `buildShell()` trong `src/main.js` và CSS trong `src/style.css`**

- Cập nhật HTML shell với Bottom Bar 4 tab hiện đại, tích hợp icon SVG/ký hiệu sắc nét và nhãn nhã nhặn.
- Trong `src/main.js`: gắn sự kiện chuyển tab mượt mà cho 4 tab (`home`, `explore`, `search`, `profile`).
- Trong `src/style.css`:
  - Thêm CSS `env(safe-area-inset-bottom)` cho `.bottom-bar` và `env(safe-area-inset-top)` cho `.header`.
  - Thiết lập hiển thị phân tách: khi ở `platform-mobile`, hiển thị Bottom Bar, ẩn Top Nav; khi ở `platform-pc` hoặc `platform-tv`, ẩn Bottom Bar.

- [ ] **Step 4: Chạy test để xác nhận toàn bộ test PASS**

Run: `npm test`
Expected: PASS tất cả các bài test (bao gồm 32 bài cũ và các bài mới).

- [ ] **Step 5: Commit code**

```bash
git add src/main.js src/style.css test/ui-regressions.test.js
git commit -m "feat: modern 4-tab mobile bottom nav and responsive header shell"
```

---

### Task 3: Bố cục Lưới Phim, Hero Banner PC & Màn hình Khám phá (Explore)

**Files:**
- Modify: `src/screens/list.js`
- Modify: `src/screens/home.js`
- Modify: `src/style.css`
- Test: `test/ui-regressions.test.js`

**Interfaces:**
- Produces:
  - `renderExploreScreen()` trong `src/screens/list.js` hiển thị bộ lọc Thể loại + Quốc gia dạng chip
  - Hero banner PC hỗ trợ nút Previous/Next slide
  - Lưới phim PC 5-6 cột với hover card zoom $1.03\times$, mobile 2 cột cân đối

- [ ] **Step 1: Viết bài test cho màn hình Explore và Grid PC/Mobile**

Bổ sung test trong `test/ui-regressions.test.js` kiểm tra gọi `renderExploreScreen` render danh mục thể loại và quốc gia đầy đủ.

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `node --test test/ui-regressions.test.js`
Expected: FAIL do chưa có hàm `renderExploreScreen`.

- [ ] **Step 3: Triển khai code trong `src/screens/list.js`, `home.js` và `src/style.css`**

- Thêm hàm `renderExploreScreen()` hỗ trợ chọn nhanh thể loại/quốc gia bằng các pill/chip vuốt ngang trên mobile, hiển thị dạng panel trên PC.
- Cập nhật Hero Banner trong `src/screens/home.js`: thêm nút điều hướng chuyển phim nhanh cho PC.
- Cập nhật CSS cho `.movie-grid` và `.poster-card`: PC 5–6 cột, hover effect; Mobile 2 cột tối ưu ngón tay chạm.

- [ ] **Step 4: Chạy test để xác nhận test PASS**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit code**

```bash
git add src/screens/list.js src/screens/home.js src/style.css test/ui-regressions.test.js
git commit -m "feat: add explore screen chips and desktop hero slider with responsive grid"
```

---

### Task 4: Nâng cấp Trình phát Player theo Nền tảng (PC Hotkeys, Mobile Touch Tua $\pm 10\text{s}$, TV Watch-Mode)

**Files:**
- Modify: `src/screens/player.js`
- Modify: `src/style.css`
- Test: `test/ui-regressions.test.js`

**Interfaces:**
- Produces:
  - Mobile: Cử chỉ double-tap nửa trái lùi $10\text{s}$, nửa phải tới $10\text{s}$ kèm ripple indicator
  - PC: Phím tắt bàn phím (`Space`/`K`, `F`, `M`, `←`/`→`, `↑`/`↓`) và hover time tooltip trên seekbar
  - TV: Giữ vững tính năng Watch-Mode Panel khi nhấn Back

- [ ] **Step 1: Viết test kiểm tra cử chỉ tua và phím tắt Player**

Kiểm tra sự kiện phím tắt PC và hàm hỗ trợ double-tap tua của player.

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `node --test test/ui-regressions.test.js`
Expected: FAIL với các assertion mới của player controls.

- [ ] **Step 3: Triển khai code trong `src/screens/player.js` và `src/style.css`**

- Bổ sung bộ nhận diện chạm đúp `handlePlayerDoubleTap(e)` kích hoạt tua $\pm 10\text{s}$ và hiện badge hiệu ứng nổi.
- Bổ sung phím tắt bàn phím toàn diện khi đang ở màn hình player trên PC.
- Thêm cơ chế tự động khóa màn hình ngang (`screen.orientation.lock('landscape')`) khi bấm nút phóng to trên thiết bị di động.

- [ ] **Step 4: Chạy test để xác nhận test PASS**

Run: `npm test`
Expected: PASS toàn bộ.

- [ ] **Step 5: Commit code**

```bash
git add src/screens/player.js src/style.css test/ui-regressions.test.js
git commit -m "feat: enhance player with mobile double-tap seek and desktop keyboard shortcuts"
```

---

### Task 5: Xử lý Phím cứng Back trên Capacitor & Hợp nhất Build TV APK

**Files:**
- Modify: `src/main.js`
- Modify: `scripts/build-tv.ps1`
- Test: `test/ui-regressions.test.js`

**Interfaces:**
- Produces:
  - Tích hợp `@capacitor/app` `backButton` listener đa tầng (modal -> watch panel -> screen back -> double press toast)
  - `scripts/build-tv.ps1` chuyển sang đóng gói trực tiếp từ `dist/` chính với cờ `platform=tv`, hoàn tất loại bỏ phân mảnh `public/tv.html`

- [ ] **Step 1: Viết test kiểm tra kịch bản back button và build TV config**

Kiểm tra logic thoát 2 lần (double-press exit) và cấu hình TV mode trong test suite.

- [ ] **Step 2: Chạy test để xác nhận thất bại hoặc cần cập nhật**

Run: `node --test test/ui-regressions.test.js`
Expected: Kiểm tra các luồng back button.

- [ ] **Step 3: Triển khai hoàn thiện trong `src/main.js` và `scripts/build-tv.ps1`**

- Hoàn thiện xử lý backButton trong `src/main.js`: kiểm tra modal, player watch panel, history lùi màn hình và toast thoát ứng dụng.
- Cập nhật `scripts/build-tv.ps1`: build qua Vite bundle chính (`npm run build`), đồng bộ vào `android-tv` và kiểm tra TV leanback manifest.

- [ ] **Step 4: Chạy toàn bộ test suites của dự án**

Run: `npm test`
Expected: 100% tests PASS, 0 failure.

- [ ] **Step 5: Commit code**

```bash
git add src/main.js scripts/build-tv.ps1 test/ui-regressions.test.js
git commit -m "feat: unify TV APK build with main bundle and finalize capacitor back button handler"
```
