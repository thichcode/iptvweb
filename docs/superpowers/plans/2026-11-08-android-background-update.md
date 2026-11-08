# Android Background Check & Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai tính năng tự động kiểm tra phiên bản mới từ GitHub Releases, tải ngầm file APK trong nền qua Android OS `DownloadManager`, và kích hoạt trình cài đặt gói Android khi hoàn tất cho cả Mobile (`WebPhim.apk`) và Android TV (`WebPhimTV.apk`).

**Architecture:** Sử dụng Capacitor Native Plugin (`UpdatePlugin.java`) kết hợp với `DownloadManager` của hệ điều hành Android và `FileProvider` để tải và cài đặt APK ngoài Store (sideload). Tự động hóa quá trình đóng gói qua `scripts/build-apk.ps1`, `scripts/build-tv.ps1` và GitHub Actions CI. Frontend `src/update.js` tự động nhận biết môi trường thiết bị, điều phối tải ngầm và hiển thị hộp thoại cài đặt tối ưu cho cả cảm ứng và remote TV D-pad.

**Tech Stack:** JavaScript (ES Modules, Vite), Java (Android API 24+, Capacitor Plugin SDK), XML (Android Manifest, FileProvider paths), PowerShell, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-08-android-background-update-design.md`

## Global Constraints
- Target packages: `com.webphim.app` (Mobile), `com.webphim.tv` (Android TV).
- APK names: `WebPhim.apk` (Mobile), `WebPhimTV.apk` (TV).
- Android OS requirement: Support Android 7.0+ (API 24+) through Android 14+ (API 34+).
- TV remote navigation: Hộp thoại cài đặt phải hỗ trợ focus D-pad (Left/Right/Enter/Escape).
- Không phá vỡ 40 bài kiểm thử hiện có của dự án (`npm test`).

## Review Focus
1. **Trạng thái file APK đã tải xong trước đó:** Nếu người dùng mở lại app mà file APK phiên bản mới đã có sẵn trong máy từ lần tải trước, app phải hiển thị hộp thoại cài đặt ngay lập tức mà không tải lại.
2. **Chọn sai APK theo thiết bị:** Thiết bị TV chạy TV mode phải chọn tải `WebPhimTV.apk`, không được tải nhầm `WebPhim.apk`.
3. **Môi trường Web thường (Chrome/Desktop):** Khi chạy trên trình duyệt thường, không gọi Capacitor Native Plugin mà fallback hiển thị popup tải link như cũ.
4. **Quyền REQUEST_INSTALL_PACKAGES trên Android 8+:** Khi `canRequestPackageInstalls()` trả về false, plugin phải điều hướng sang `Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES`.
5. **Tải file lỗi hoặc không hoàn chỉnh:** Kiểm tra kích thước file (> 1MB) trước khi coi là đã tải xong để tránh mở file APK 0 bytes.

---

### Task 1: Tạo Android Native Template (`file_paths.xml` và `UpdatePlugin.java`)

**Files:**
- Create: `android-template/res/xml/file_paths.xml`
- Create: `android-template/UpdatePlugin.java`
- Test: `test/native-template.test.js`

**Interfaces:**
- Produces:
  - `UpdatePlugin.java`: Lớp Java kế thừa `com.getcapacitor.Plugin` với các methods `@PluginMethod`:
    - `getAppVersion(PluginCall call)` -> `{ versionCode: int, versionName: string }`
    - `isApkDownloaded(PluginCall call)` -> `{ downloaded: boolean, path: string }`
    - `startDownload(PluginCall call)` -> `{ downloadId: long, started: boolean }`
    - `installApk(PluginCall call)` -> `{ success: boolean }`
    - Event: `apkDownloadComplete` phát qua `notifyListeners("apkDownloadComplete", JSObject)`

- [ ] **Step 1: Viết bài test kiểm tra tính toàn vẹn của template native (`test/native-template.test.js`)**

```javascript
import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'

test('native-template files exist and contain required methods', () => {
  const xml = fs.readFileSync('android-template/res/xml/file_paths.xml', 'utf8')
  assert.ok(xml.includes('external-files-path'), 'file_paths.xml must declare external-files-path')
  assert.ok(xml.includes('path="Download"'), 'file_paths.xml must map Download path')

  const java = fs.readFileSync('android-template/UpdatePlugin.java', 'utf8')
  assert.ok(java.includes('@CapacitorPlugin(name = "AppUpdate")'), 'must declare AppUpdate plugin')
  assert.ok(java.includes('isApkDownloaded'), 'must implement isApkDownloaded')
  assert.ok(java.includes('startDownload'), 'must implement startDownload')
  assert.ok(java.includes('installApk'), 'must implement installApk')
  assert.ok(java.includes('ACTION_DOWNLOAD_COMPLETE'), 'must handle download complete broadcast')
})
```

- [ ] **Step 2: Chạy test để đảm bảo test thất bại khi chưa có file**

Run: `node --test test/native-template.test.js`
Expected: FAIL (file not found)

- [ ] **Step 3: Tạo `android-template/res/xml/file_paths.xml`**

Khai báo `<paths>` với `<external-files-path name="my_downloads" path="Download" />`.

- [ ] **Step 4: Tạo `android-template/UpdatePlugin.java`**

Implement `UpdatePlugin.java` với:
- Annotation `@CapacitorPlugin(name = "AppUpdate")`.
- `PACKAGE_PLACEHOLDER` để build script thay thế thành `com.webphim.app` hoặc `com.webphim.tv`.
- Xử lý `DownloadManager`, `BroadcastReceiver` cho `ACTION_DOWNLOAD_COMPLETE`.
- Xử lý `FileProvider` và `ACTION_VIEW` intent cài đặt APK.

- [ ] **Step 5: Chạy test để đảm bảo test PASS**

Run: `node --test test/native-template.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add android-template/ test/native-template.test.js
git commit -m "feat(android): add UpdatePlugin and file_paths template for native background update"
```

---

### Task 2: Cập nhật Build Scripts (`scripts/build-apk.ps1`, `scripts/build-tv.ps1`) và GitHub CI

**Files:**
- Modify: `scripts/build-apk.ps1`
- Modify: `scripts/build-tv.ps1`
- Modify: `.github/workflows/release-apk.yml`
- Test: `test/build-scripts.test.js`

**Interfaces:**
- Consumes: `android-template/UpdatePlugin.java`, `android-template/res/xml/file_paths.xml`
- Produces: Các script tự động copy template, patch `MainActivity.java` đăng ký `UpdatePlugin`, và patch `AndroidManifest.xml` thêm `REQUEST_INSTALL_PACKAGES` và `<provider>`.

- [ ] **Step 1: Viết test kiểm tra logic patch trong các build scripts (`test/build-scripts.test.js`)**

```javascript
import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'

test('build-apk.ps1 and build-tv.ps1 include update plugin patching', () => {
  const apkScript = fs.readFileSync('scripts/build-apk.ps1', 'utf8')
  assert.ok(apkScript.includes('UpdatePlugin'), 'build-apk.ps1 must copy UpdatePlugin')
  assert.ok(apkScript.includes('REQUEST_INSTALL_PACKAGES'), 'build-apk.ps1 must add REQUEST_INSTALL_PACKAGES')
  assert.ok(apkScript.includes('file_paths.xml'), 'build-apk.ps1 must copy file_paths.xml')

  const tvScript = fs.readFileSync('scripts/build-tv.ps1', 'utf8')
  assert.ok(tvScript.includes('UpdatePlugin'), 'build-tv.ps1 must copy UpdatePlugin')
  assert.ok(tvScript.includes('REQUEST_INSTALL_PACKAGES'), 'build-tv.ps1 must add REQUEST_INSTALL_PACKAGES')
})
```

- [ ] **Step 2: Chạy test để đảm bảo test thất bại**

Run: `node --test test/build-scripts.test.js`
Expected: FAIL

- [ ] **Step 3: Cập nhật `scripts/build-apk.ps1`**

Bổ sung các bước sau khi `npx cap sync android`:
- Tạo thư mục `android/app/src/main/res/xml` nếu chưa có và copy `file_paths.xml`.
- Copy `android-template/UpdatePlugin.java` thành `android/app/src/main/java/com/webphim/app/UpdatePlugin.java` (thay placeholder thành `package com.webphim.app;`).
- Patch `MainActivity.java` đăng ký `registerPlugin(UpdatePlugin.class)`.
- Patch `AndroidManifest.xml` thêm quyền `REQUEST_INSTALL_PACKAGES` và thẻ `<provider>`.

- [ ] **Step 4: Cập nhật `scripts/build-tv.ps1`**

Tương tự cho `android-tv`, package `com.webphim.tv`.

- [ ] **Step 5: Cập nhật `.github/workflows/release-apk.yml`**

Cập nhật cả job `build` và `build-tv` trên CI để đồng bộ các bước patch này.

- [ ] **Step 6: Chạy test để đảm bảo test PASS**

Run: `node --test test/build-scripts.test.js`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add scripts/build-apk.ps1 scripts/build-tv.ps1 .github/workflows/release-apk.yml test/build-scripts.test.js
git commit -m "feat(build): inject UpdatePlugin and install permissions into APK build pipeline"
```

---

### Task 3: Nâng cấp Frontend Update Logic (`src/update.js`)

**Files:**
- Modify: `src/update.js`
- Modify: `src/style.css`
- Test: `test/update-engine.test.js`

**Interfaces:**
- Consumes: `isTV()` từ `./platform.js`, `$` từ `./utils.js`, Capacitor Plugin `window.Capacitor?.Plugins?.AppUpdate`
- Produces:
  - `checkUpdate()`: trả về thông tin release và target file (`WebPhimTV.apk` nếu TV, `WebPhim.apk` nếu mobile).
  - `showReadyToInstallModal(info)`: hiển thị hộp thoại sẵn sàng cài đặt hỗ trợ phím điều hướng TV.
  - `initUpdateChecker()`: điều phối kiểm tra ngầm, tải qua native plugin nếu trên Android, hoặc fallback popup web nếu trên PC.

- [ ] **Step 1: Viết test cho logic update frontend (`test/update-engine.test.js`)**

```javascript
import { test } from 'node:test'
import assert from 'node:assert'
import { parseBuildNum, selectTargetApk } from '../src/update.js'

test('parseBuildNum handles tags correctly', () => {
  assert.strictEqual(parseBuildNum('build-15'), 15)
  assert.strictEqual(parseBuildNum('v1.2.3'), 10203)
  assert.strictEqual(parseBuildNum('invalid'), 0)
})

test('selectTargetApk selects WebPhimTV.apk on TV and WebPhim.apk on Mobile', () => {
  assert.strictEqual(selectTargetApk(true), 'WebPhimTV.apk')
  assert.strictEqual(selectTargetApk(false), 'WebPhim.apk')
})
```

- [ ] **Step 2: Chạy test để xác nhận test chạy**

Run: `node --test test/update-engine.test.js`
Expected: FAIL (selectTargetApk not exported/defined)

- [ ] **Step 3: Cập nhật `src/update.js`**

- Xuất hàm `parseBuildNum`, `selectTargetApk`.
- Trong `checkUpdate()`: Dùng `selectTargetApk(isTV())` để tìm đúng asset APK.
- Tích hợp gọi `window.Capacitor?.Plugins?.AppUpdate`:
  - `isApkDownloaded`: nếu true -> hiển thị ngay `showReadyToInstallModal(info)`.
  - Nếu false -> hiển thị toast "Đang tải bản cập nhật ngầm...", gọi `startDownload`, lắng nghe sự kiện `apkDownloadComplete` để hiển thị `showReadyToInstallModal(info)`.
- Tạo hàm `showReadyToInstallModal(info)` với 2 nút: [Cài đặt ngay] và [Để sau].
  - Bấm [Cài đặt ngay]: gọi `AppUpdate.installApk({ fileName: info.fileName })`.
  - Hỗ trợ keyboard / remote D-pad: Enter, Escape, ArrowLeft, ArrowRight.
- Thêm CSS trong `src/style.css` cho modal `#update-install-modal`, badge "CẬP NHẬT MỚI", button focus vàng hổ phách `#ffd45a`.

- [ ] **Step 4: Chạy lại test `test/update-engine.test.js`**

Run: `node --test test/update-engine.test.js`
Expected: PASS

- [ ] **Step 5: Chạy toàn bộ test suite dự án**

Run: `npm test`
Expected: Toàn bộ tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/update.js src/style.css test/update-engine.test.js
git commit -m "feat(update): implement background APK download coordination and install prompt modal"
```

---

### Task 4: Tích hợp sự kiện Phím Remote TV & Toàn vẹn Shell (`src/main.js`)

**Files:**
- Modify: `src/main.js`
- Test: `test/ui-regressions.test.js`

**Interfaces:**
- Consumes: `#update-install-modal`, Remote key handler `handleKeydown` trong `src/main.js`
- Produces: Cho phép người dùng TV Box dùng điều khiển bấm Enter / Back / Left / Right thao tác mượt mà trên modal cập nhật mới.

- [ ] **Step 1: Viết test cho modal key navigation trong test suite**

Kiểm tra khi modal `#update-install-modal` mở, phím Enter bấm nút đang focus, phím Escape / Back đóng modal.

- [ ] **Step 2: Cập nhật `src/main.js`**

Cập nhật trình bắt phím `handleKeydown`:
- Kiểm tra nếu `#update-install-modal` đang hiển thị:
  - Phím `Escape` hoặc `Back`: đóng modal.
  - Phím `ArrowLeft` / `ArrowRight`: chuyển focus giữa [Cài đặt ngay] và [Để sau].
  - Phím `Enter`: kích hoạt nút đang focus.

- [ ] **Step 3: Chạy toàn bộ test kiểm thử**

Run: `npm test`
Expected: ALL PASS.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat(tv): support remote navigation on background update install dialog"
```

---

### Task 5: Xác minh Tổng thể & Chạy Build Thử Nghiệm

**Files:**
- Verify: Toàn bộ codebase, test suite, build scripts.

- [ ] **Step 1: Chạy toàn bộ test suite**

Run: `npm test`
Expected: Toàn bộ tests PASS 100%.

- [ ] **Step 2: Chạy kiểm tra build web bundle**

Run: `npm run build && npm run build:tv`
Expected: Thành công tạo `dist/` và `dist-tv/` không có lỗi cú pháp hay thiếu file.

- [ ] **Step 3: Commit và push hoàn thiện**

```bash
git push origin main
```
