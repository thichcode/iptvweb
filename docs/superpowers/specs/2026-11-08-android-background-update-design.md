# Thiết kế Kỹ thuật: Chức năng Kiểm tra và Cập nhật Ngầm cho Android & Android TV

## 1. Mục tiêu và Bối cảnh
- **Mục tiêu:** Cung cấp cơ chế tự động kiểm tra phiên bản mới từ GitHub Releases, âm thầm tải file APK (`WebPhim.apk` hoặc `WebPhimTV.apk`) bằng hệ thống native Android `DownloadManager` trong nền mà không làm gián đoạn trải nghiệm xem phim của người dùng. Khi quá trình tải hoàn tất, ứng dụng hiển thị thông báo và cho phép người dùng kích hoạt trình cài đặt gói (`PackageInstaller`) của Android chỉ với 1 cú click hoặc 1 nút bấm trên điều khiển TV (Remote D-pad).
- **Môi trường hỗ trợ:** 
  - Android Mobile / Tablet (`WebPhim.apk`, gói `com.webphim.app`).
  - Android TV / TV Box (`WebPhimTV.apk`, gói `com.webphim.tv`).
  - Web Browser / PC (giữ nguyên fallback mở link trình duyệt thông thường).

---

## 2. Kiến trúc Hệ thống

### 2.1. Cấu trúc Thư mục và Tệp Native Template
Tạo thư mục `android-template/` chứa các tệp mã nguồn và cấu hình được chuẩn hóa, không phụ thuộc vào việc thư mục `android/` bị gitignore:
- `android-template/UpdatePlugin.java`: Lớp Native Capacitor Plugin viết bằng Java, đăng ký dưới tên `"AppUpdate"`.
- `android-template/file_paths.xml`: Cấu hình thư mục chia sẻ an toàn cho `FileProvider`.

### 2.2. Native Plugin: `UpdatePlugin.java`
- **Tên plugin:** `@CapacitorPlugin(name = "AppUpdate")`.
- **Chức năng chính:**
  1. `getAppVersion()`: Lấy `versionCode` và `versionName` thực tế đang cài trên thiết bị từ `PackageManager`.
  2. `isApkDownloaded(String fileName, String version)`: Kiểm tra xem file APK của phiên bản chỉ định đã có sẵn trong thư mục `Download` của ứng dụng và có dung lượng hợp lệ (> 1MB) hay chưa.
  3. `startDownload(String url, String fileName, String title)`:
     - Tạo yêu cầu tải file thông qua `android.app.DownloadManager`.
     - Cấu hình: cho phép tải qua cả Wi-Fi và mạng di động (`NETWORK_WIFI | NETWORK_MOBILE`), hiển thị thông báo tiến trình trên hệ thống (`VISIBILITY_VISIBLE_NOTIFY_COMPLETED`), lưu trữ trong thư mục riêng của app: `context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)`.
     - Lưu lại `downloadId` và `version` vào SharedPreferences.
  4. `installApk(String fileName)`:
     - Tìm file APK trong thư mục `getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)`.
     - Kiểm tra quyền cài đặt ứng dụng:
       - Nếu Android >= 8.0 (API 26) và `!context.getPackageManager().canRequestPackageInstalls()`: mở `Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES` để người dùng cấp quyền.
     - Tạo `content://` URI qua `androidx.core.content.FileProvider.getUriForFile(...)`.
     - Tạo `Intent(Intent.ACTION_VIEW)` với:
       - `setDataAndType(apkUri, "application/vnd.android.package-archive")`
       - `addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)`
       - `addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)`
     - Khởi chạy Intent để mở giao diện cài đặt / cập nhật hệ thống.
  5. `BroadcastReceiver` cho sự kiện tải xong:
     - Lắng nghe `DownloadManager.ACTION_DOWNLOAD_COMPLETE`.
     - Khi tải thành công, phát thông báo event `apkDownloadComplete` về cho WebView qua `notifyListeners("apkDownloadComplete", data)`.

### 2.3. Cấu hình `AndroidManifest.xml`
Bổ sung các thiết lập bắt buộc cho quy trình sideloading update:
1. Quyền cài đặt:
   ```xml
   <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```
2. Đăng ký `FileProvider`:
   ```xml
   <provider
       android:name="androidx.core.content.FileProvider"
       android:authorities="${applicationId}.fileprovider"
       android:exported="false"
       android:grantUriPermissions="true">
       <meta-data
           android:name="android.support.FILE_PROVIDER_PATHS"
           android:resource="@xml/file_paths" />
   </provider>
   ```
3. Cấu hình đường dẫn chia sẻ `android-template/file_paths.xml`:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <paths xmlns:android="http://schemas.android.com/apk/res/android">
       <external-files-path name="my_downloads" path="Download" />
   </paths>
   ```

---

## 3. Quy trình Tích hợp và Tự động hóa Build

### 3.1. Cập nhật `scripts/build-apk.ps1` (Mobile APK)
- Sau khi chạy `npx cap sync android`:
  - Copy `android-template/file_paths.xml` vào `android/app/src/main/res/xml/file_paths.xml`.
  - Copy `android-template/UpdatePlugin.java` vào `android/app/src/main/java/com/webphim/app/UpdatePlugin.java`. Đảm bảo khai báo package đúng là `package com.webphim.app;`.
  - Patch `android/app/src/main/java/com/webphim/app/MainActivity.java` để import và gọi `registerPlugin(UpdatePlugin.class)`.
  - Patch `AndroidManifest.xml` để thêm quyền `REQUEST_INSTALL_PACKAGES` và thẻ `<provider>`.

### 3.2. Cập nhật `scripts/build-tv.ps1` (TV APK)
- Sau khi chạy `npx cap sync android`:
  - Copy `android-template/file_paths.xml` vào `android-tv/app/src/main/res/xml/file_paths.xml`.
  - Copy `android-template/UpdatePlugin.java` vào `android-tv/app/src/main/java/com/webphim/tv/UpdatePlugin.java` với `package com.webphim.tv;`.
  - Patch `android-tv/app/src/main/java/com/webphim/tv/MainActivity.java` đăng ký `UpdatePlugin.class`.
  - Patch `AndroidManifest.xml` trong `android-tv` tương tự.

### 3.3. Cập nhật `.github/workflows/release-apk.yml`
- Đồng bộ các bước copy file template và patch vào cả job `build` và job `build-tv` trên môi trường GitHub Actions Ubuntu.

---

## 4. Thiết kế Logic Frontend (`src/update.js` & `src/main.js`)

### 4.1. Khởi tạo và Kiểm tra Phiên bản
- Hàm `getAppInfo()`:
  - Nếu có native plugin: gọi `AppUpdate.getAppVersion()` để lấy `versionCode` hoặc `versionName`.
  - Fallback: sử dụng `__APP_VERSION__` (được định nghĩa qua `vite.config.js`).
- Hàm `checkUpdate()`:
  - Gọi GitHub API: `https://api.github.com/repos/thichcode/iptvweb/releases/latest`.
  - Xác định tệp APK cần lấy:
    - Nếu `isTV()`: tìm asset `WebPhimTV.apk`.
    - Ngược lại: tìm asset `WebPhim.apk`.
  - So sánh phiên bản release với phiên bản hiện tại. Nếu release mới hơn: trả về đối tượng `updateInfo { version, tag, downloadUrl, fileName, notes }`.

### 4.2. Luồng Xử lý Tải ngầm
1. Khi `checkUpdate()` phát hiện có bản mới:
   - Nếu chạy trong môi trường Native Android (`window.Capacitor?.isNativePlatform()`):
     - Gọi `AppUpdate.isApkDownloaded({ fileName, version })`.
     - Nếu đã tải xong trước đó: Hiển thị ngay hộp thoại `showReadyToInstallModal(updateInfo)`.
     - Nếu chưa tải xong:
       - Hiển thị Toast thông báo: *"Đang tải bản cập nhật mới trong nền..."*.
       - Gọi `AppUpdate.startDownload({ url: downloadUrl, fileName, title: 'Cập nhật WebPhim ' + version })`.
       - Lắng nghe event `AppUpdate.addListener('apkDownloadComplete', ...)`:
         - Khi nhận được tín hiệu hoàn tất: hiển thị hộp thoại `showReadyToInstallModal(updateInfo)`.
   - Nếu chạy trên Web Desktop / Browser:
     - Giữ nguyên luồng hiển thị popup `showUpdateModal()` cho phép người dùng bấm link tải trực tiếp.

### 4.3. Giao diện Hộp thoại Cài đặt (`ReadyToInstallModal`)
- Modal chuẩn accessibility & TV focus:
  ```html
  <div id="update-install-modal" class="modal-overlay">
    <div class="update-box">
      <div class="update-badge">CẬP NHẬT MỚI</div>
      <h3 class="update-head">Bản cập nhật đã sẵn sàng!</h3>
      <div class="update-ver">Phiên bản: <span class="ver-text">v...</span></div>
      <div class="update-notes">...ghi chú phát hành...</div>
      <div class="update-actions">
        <button id="btn-install-now" class="update-btn update-primary" tabindex="0">Cài đặt ngay</button>
        <button id="btn-install-later" class="update-btn update-secondary" tabindex="0">Để sau</button>
      </div>
    </div>
  </div>
  ```
- Tương tác:
  - Phím điều hướng Remote TV (D-pad Left/Right/Enter) hoặc chuột cảm ứng.
  - Phím Back / Escape: đóng hộp thoại.
  - Bấm **Cài đặt ngay**: gọi `AppUpdate.installApk({ fileName })`.

---

## 5. Xử lý Lỗi và Trường hợp Ngoại lệ (Edge Cases)
1. **Người dùng từ chối cấp quyền cài đặt nguồn không xác định:**
   - Khi `installApk` phát hiện chưa có quyền, nó điều hướng sang trang Cài đặt ứng dụng của Android. Khi quay lại app, nếu người dùng bấm cài đặt lại thì tiếp tục thực hiện mà không cần tải lại file.
2. **Mất kết nối mạng khi đang tải ngầm:**
   - Hệ thống Android `DownloadManager` tự động quản lý hàng đợi và tiếp tục tải khi có mạng trở lại mà không gây crash app.
3. **File APK bị hỏng hoặc tải thiếu dung lượng:**
   - `isApkDownloaded` kiểm tra độ lớn file và tính toàn vẹn cơ bản. Nếu file bị lỗi, app tự động xóa file cũ và kích hoạt tải lại.
4. **Rate Limit của GitHub API:**
   - Khối `try ... catch` bao bọc mọi request API, âm thầm bỏ qua khi có lỗi kết nối, không làm phiền người dùng.

---

## 6. Kế hoạch Kiểm thử (Test Strategy)
1. **Unit Test (`test/update.test.js`):**
   - Test logic so sánh phiên bản (`parseBuildNum`).
   - Test logic lựa chọn đúng tên tệp APK theo môi trường (`WebPhimTV.apk` cho TV, `WebPhim.apk` cho Mobile).
   - Test trạng thái modal và mock các hàm gọi Capacitor bridge (`isApkDownloaded`, `startDownload`, `installApk`).
2. **Build Verification:**
   - Chạy `npm test` đảm bảo toàn bộ tests (cả 40 tests hiện tại và các test mới) đều PASS.
   - Kiểm tra cú pháp Java và XML trong template để đảm bảo không có lỗi biên dịch khi đưa vào Gradle build.
