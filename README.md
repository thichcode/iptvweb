# WebPhim 🎬

Xem phim online trực tuyến, giao diện tối giản, phát HLS mượt mà.

## Tính năng

- **Danh mục phim**: Phim Mới, Phim Bộ, Phim Lẻ, TV Shows, Hoạt Hình
- **Tìm kiếm** phim theo tên
- **Lọc** theo thể loại, quốc gia
- **Chọn server & tập phim** — nhiều server cho mỗi phim
- **Tự động chuyển tập** tiếp theo khi hết
- **Yêu thích** (♥) — lưu vào localStorage
- **Lịch sử đã xem** — tiếp tục xem dở dang
- **Phát HLS** với hls.js, hỗ trợ tua ±10s
- **Responsive** — xem được trên desktop & mobile
- **Điều khiển bàn phím**: ↑↓ chọn, Enter vào, ←→ tua, Space play/pause, Esc thoát

## Công nghệ

- [Vite](https://vitejs.dev/) — build tool
- [hls.js](https://github.com/video-dev/hls.js/) — HLS playback
- Vanilla JavaScript — không framework
- [phimapi.com](https://phimapi.com) — API phim

## Phát triển

```bash
npm install
npm run dev     # dev server at localhost:3000
npm run build   # build ra dist/
```

## Deploy

Push lên GitHub → Vercel auto-deploy (static SPA).

---

Built from [@kv8n2oryk/tizenfilm](https://www.npmjs.com/package/@kv8n2oryk/tizenfilm)
