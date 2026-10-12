# Tài liệu Thiết kế: Chuẩn hóa UI/UX Đa Nền Tảng (PC, Mobile, APK Android TV)

- **Ngày tạo**: 2026-10-12
- **Trạng thái**: Đã thống nhất thiết kế, chờ duyệt triển khai
- **Tác giả / Phụ trách**: Antigravity & User

---

## 1. Bối cảnh & Mục tiêu

### 1.1. Hiện trạng
- Ứng dụng WebPhim hiện tại đang phục vụ người dùng trên nhiều nền tảng nhưng trải nghiệm UI/UX chưa được chuẩn hóa theo từng môi trường cụ thể:
  - **PC Desktop**: Chưa tận dụng tối đa không gian màn hình rộng, thiếu phím tắt trình phát phim chuẩn và điều hướng nhanh bằng chuột/bàn phím.
  - **Mobile Touch (Web & APK điện thoại)**: Thanh điều hướng phía dưới (Bottom Bar) hiện tại còn sơ khai (`nav-back`, `nav-search-btn`, `nav-home`, `nav-fav`), thiếu phân loại Khám phá chuyên biệt; Header trên mobile còn chứa nhiều nút thừa gây chật chội; Trình phát video chưa có cử chỉ chạm đúp để tua nhanh $10\text{s}$ như các app video hiện đại.
  - **Android TV / TV Box**: Bị phân mảnh khi đang có một file riêng biệt `public/tv.html` chỉ có giao diện tối giản, thiếu các tính năng mới (chuyển đổi API nguồn, lưu lịch sử, danh mục, cập nhật). Trong khi đó, `src/main.js` cũng có một phần logic TV mode nhưng chưa được thống nhất thành 1 quy trình build duy nhất.

### 1.2. Mục tiêu
- Xây dựng kiến trúc **Adaptive Platform Engine** trong một codebase duy nhất (`src/`).
- Chuẩn hóa trải nghiệm người dùng đặc thù cho từng môi trường:
  - **PC Desktop**: Tận dụng chuột, bàn phím, màn hình lớn, hiển thị nhiều thông tin, phím tắt player phong phú.
  - **Mobile Touch**: Tối ưu ngón cái thao tác một tay, Bottom Bar chuẩn 4 tab, safe area insets (tai thỏ/notch), cử chỉ chạm đúp tua video, xoay ngang fullscreen tự động.
  - **Android TV / Box**: 10-foot UI với Spatial Navigation D-pad nhạy bén, viền focus vàng sáng nổi bật, bàn phím ảo remote, Watch-Mode Panel xem phim không gián đoạn, hợp nhất loại bỏ `public/tv.html`.
- Bảo toàn 100% 32 bài kiểm thử hiện có của dự án và bổ sung kiểm thử cho các tính năng nền tảng mới.

---

## 2. Kiến trúc Kỹ thuật: Adaptive Platform Engine

### 2.1. Module điều phối `src/platform.js`
Tạo mới module `src/platform.js` chịu trách nhiệm:
1. **Phát hiện môi trường (`detectPlatform`)**:
   - `TV`:
     - Kiểm tra User-Agent: `/Android TV|Leanback|BRAVIA|AFTT|MiTV|GoogleTV|SmartTV/i`.
     - Hoặc cờ cấu hình `window.__PLATFORM__ === 'tv'` (được chèn khi build TV APK) hoặc tham số URL `?tv=1`.
     - Hoặc khi người dùng nhấn các phím D-pad (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) trên thiết bị chưa xác định chuột.
   - `MOBILE`:
     - Thiết bị có màn hình $< 768\text{px}$ hoặc media query `(pointer: coarse)` kích hoạt, hoặc chạy trong Capacitor trên Android/iOS điện thoại.
   - `PC`:
     - Màn hình $\ge 768\text{px}$, media query `(pointer: fine)`, hỗ trợ chuột và bàn phím đầy đủ.
2. **Đồng bộ trạng thái DOM**:
   - Gán thuộc tính `data-platform="pc" | "mobile" | "tv"` lên thẻ `<html>`.
   - Cung cấp class `platform-pc`, `platform-mobile`, `platform-tv` lên `<body>`.
   - Cung cấp API `isPC()`, `isMobile()`, `isTV()` cho toàn bộ mã nguồn sử dụng đồng bộ.

### 2.2. Hợp nhất `public/tv.html` vào Codebase Chính
- Loại bỏ sự phân mảnh của `public/tv.html`.
- Cập nhật kịch bản build `scripts/build-tv.ps1`:
  - Build ứng dụng từ Vite (`npm run build`) sang thư mục `dist-tv/` kèm cấu hình `capacitor.config.tv.json` với cờ TV được bật sẵn.
  - Đảm bảo Android TV thừa hưởng trọn vẹn toàn bộ tính năng và bản cập nhật của webphim.

---

## 3. Thiết kế Chi tiết Từng Môi trường

### 3.1. PC Desktop (`platform-pc`)
1. **Header & Thanh điều hướng Top-Nav**:
   - Hiển thị đầy đủ menu hàng ngang: `Trang chủ`, `Phim Mới`, `Phim Bộ`, `Phim Lẻ`, `Thể Loại`, `Quốc Gia`, `Yêu Thích`, `Lịch Sử`, `Tải APK`.
   - Thanh tìm kiếm dài, trực quan, hỗ trợ phím nóng `/` để tìm kiếm tức thì.
   - Nút chuyển đổi nguồn API (OPhim / PhimAPI / Proxy) và nút bật/tắt ảnh (thumb) nằm góc phải với tooltip giải thích.
2. **Trang chủ & Lưới phim**:
   - **Hero Banner**: Nổi bật ở đầu trang với thông tin tóm tắt phim, 2 nút mũi tên trượt trái/phải (`‹` và `›`) bằng chuột để đổi phim nổi bật.
   - **Lưới phim (Movie Grid)**: 5–6 cột trên màn hình $\ge 1200\text{px}$, tỉ lệ poster $2:3$.
   - **Hover Card**: Rê chuột qua card poster có độ nảy nhẹ ($1.03\times$), hiển thị nhãn tập/chất lượng HD/Vietsub và nút xem nhanh rõ ràng.
3. **Trình phát Player**:
   - Hỗ trợ đầy đủ phím tắt bàn phím:
     - `Space` hoặc `K`: Phát / Tạm dừng.
     - `F`: Bật / Tắt chế độ toàn màn hình.
     - `M`: Tắt / Bật tiếng.
     - `←` / `→`: Tua lùi / tới $5\text{s}$.
     - `↑` / `↓`: Tăng / Giảm âm lượng $10\%$.
   - Thanh Seekbar to rõ hơn khi rê chuột, có hiển thị bóng tooltip thời gian xem trước.

---

### 3.2. Mobile Touch (Web & APK Điện thoại) (`platform-mobile`)
1. **Thanh điều hướng dưới đáy (Bottom Navigation Bar) 4 Tab chuẩn App**:
   - Vị trí cố định chân trang (`position: fixed; bottom: 0`), tự động đệm an toàn `padding-bottom: env(safe-area-inset-bottom, 0)`.
   - Gồm 4 tab rõ ràng:
     1. `⌂ Trang chủ` (`home`): Trở về feed trang chủ với các hàng phim đề xuất.
     2. `🧭 Khám phá` (`explore`): Trang duyệt danh mục thông minh (các chip chọn nhanh: Phim lẻ, Phim bộ, Thể loại hành động, cổ trang, Quốc gia Hàn, Trung, Mỹ...).
     3. `🔍 Tìm kiếm` (`search`): Màn hình tìm kiếm nhanh, bàn phím tự động sẵn sàng nhập liệu.
     4. `👤 Cá nhân` (`profile`): Tích hợp tiện lợi giữa danh sách **Yêu thích** và **Lịch sử xem**.
   - Tab đang kích hoạt hiển thị màu vàng nhấn (`var(--accent)`) và icon nổi bật.
2. **Mobile Header**:
   - Tinh giản: Chỉ hiển thị Logo `WebPhim` + Badge tình trạng nguồn API nhỏ gọn.
   - Ẩn thanh Top-Nav cồng kềnh và ẩn ô tìm kiếm to ở header để tránh chiếm diện tích dọc quý giá của màn hình điện thoại.
   - Đệm an toàn phía trên: `padding-top: env(safe-area-inset-top, 0)`.
3. **Mobile Trình phát Video**:
   - **Chạm đúp (Double-tap) tua nhanh**:
     - Chạm đúp vùng bên trái màn hình: Tua lùi $10\text{s}$ kèm hiệu ứng gợn sóng `-10s`.
     - Chạm đúp vùng bên phải màn hình: Tua tới $10\text{s}$ kèm hiệu ứng gợn sóng `+10s`.
   - **Tự động xoay ngang khi Toàn màn hình**:
     - Khi bấm nút phóng to, tự động khóa xoay ngang (`landscape`) nếu thiết bị hỗ trợ.
   - **Vùng chạm lớn (Touch Targets)**:
     - Toàn bộ nút điều khiển trong player và danh sách tập đạt kích thước tối thiểu $44 \times 44\text{px}$.

---

### 3.3. Android TV / TV Box APK (`platform-tv`)
1. **Thiết kế 10-foot UI**:
   - Cỡ chữ lớn ($18\text{px} - 32\text{px}$), màu sắc độ tương phản cao, nền đen dịu mắt `#0b0b09`.
   - Khoảng lề an toàn viền màn hình (Overscan margin) $\ge 48\text{px}$ chống tràn khung hình TV.
2. **Spatial Navigation Engine (Điều hướng D-pad)**:
   - Di chuyển mượt mà giữa các hàng và thẻ poster bằng 4 phím điều hướng `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`.
   - Viền focus nổi bật màu vàng rực `#ffd45a`, độ dày $3\text{px}$, phóng to $1.08\times$, cuộn trang tức thì đưa phần tử vào giữa màn hình (`behavior: 'auto'`).
   - Hỗ trợ bàn phím ảo On-Screen Keyboard khi tìm kiếm, điều khiển dễ dàng bằng remote.
3. **Watch-Mode Panel (Xem phim không ngắt quãng)**:
   - Khi đang phát video, phím `Back` trên remote kích hoạt bảng điều khiển chọn tập, chọn server hoặc đổi phim trượt ra từ bên phải/dưới.
   - Video tiếp tục chạy mượt mà ở chế độ nền.
   - Nhấn `Back` lần 2 mới đóng panel và thoát khỏi player.

---

### 3.4. Xử lý Nút Back Cứng trên Nền tảng Android (Capacitor)
- Tích hợp qua `@capacitor/app`:
  1. Nếu đang hiển thị modal xác nhận hoặc popup tìm kiếm $\to$ Đóng modal.
  2. Nếu đang trong Player $\to$ Bật Watch-Mode Panel.
  3. Nếu đang ở màn hình con (Chi tiết phim, Danh mục) $\to$ Quay lại màn hình trước.
  4. Nếu đang ở màn hình Trang chủ $\to$ Bật toast thông báo: *"Nhấn Back lần nữa để thoát ứng dụng"* (yêu cầu nhấn 2 lần trong 2 giây để tránh thoát ngoài ý muốn).

---

## 4. Kế hoạch Kiểm thử & Hồi quy

1. **Kiểm thử Hồi quy (Regression)**:
   - Đảm bảo 32 test case trong `test/mobile-limit.test.js` và `test/ui-regressions.test.js` tiếp tục vượt qua 100%.
2. **Kiểm thử Mới (New Test Suites)**:
   - `test/platform-engine.test.js`:
     - Kiểm tra khả năng phát hiện `pc`, `mobile`, `tv` dựa trên User-Agent, media queries và URL flag.
     - Kiểm tra việc gắn class DOM chính xác lên thẻ `html`/`body`.
     - Kiểm tra cấu trúc 4 tab của Bottom Navigation Bar.
     - Kiểm tra phím tắt bàn phím của PC Player và cử chỉ chạm tua của Mobile Player.
     - Kiểm tra việc hợp nhất kịch bản TV không phá vỡ logic Leanback.

---

## 5. Danh sách Tệp Tin Tác động

- `src/platform.js` *(Tạo mới)*: Engine phát hiện và quản lý môi trường.
- `src/main.js`: Tích hợp `platform.js`, tái cấu trúc shell cho PC/Mobile/TV, xử lý Back button và Bottom Nav 4 tab.
- `src/style.css`: Bổ sung CSS cho 3 môi trường (`platform-pc`, `platform-mobile`, `platform-tv`), Bottom Bar 4 tab, safe area insets, focus rings TV, hover cards PC.
- `src/screens/player.js`: Bổ sung cử chỉ double-tap tua $\pm 10\text{s}$ trên mobile, phím tắt player trên PC, tối ưu Watch-Mode trên TV.
- `src/screens/list.js` & `src/screens/home.js`: Thích ứng hiển thị theo nền tảng (grid 5-6 cột PC, 2 cột Mobile, carousel TV).
- `scripts/build-tv.ps1`: Cập nhật build TV trực tiếp từ bundle chính thay vì `public/tv.html`.
- `test/platform-engine.test.js` *(Tạo mới)*: Bộ unit test cho tính năng đa nền tảng.
