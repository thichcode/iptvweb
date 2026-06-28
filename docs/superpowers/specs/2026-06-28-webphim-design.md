# WebPhim - Web Movie Browser Design

## Overview

Port the TizenBrew app `@kv8n2oryk/tizenfilm` to a standalone web application deployed on Vercel. The app uses `phimapi.com` to browse and stream Vietnamese movies with HLS playback.

## Tech Stack

- **Build tool:** Vite (vanilla JS)
- **Player:** hls.js for HLS streams
- **Storage:** localStorage (favorites, watch history)
- **Deploy:** Vercel (static SPA output)

## Architecture

### Project Structure

```
/          → Static root (no framework)
├── index.html       # Entry SPA shell
├── src/
│   ├── main.js      # App init, keybindings, router
│   ├── style.css    # All styles (dark theme, responsive)
│   ├── api.js       # phimapi.com HTTP client
│   ├── store.js     # State + localStorage persistence
│   ├── screens/
│   │   ├── home.js  # Main menu
│   │   ├── list.js  # Movie list / search / categories
│   │   ├── detail.js# Movie detail + episodes
│   │   └── player.js# Video player overlay
│   └── utils.js     # Focus management, rendering helpers
├── vite.config.js
└── vercel.json
```

### Screens

1. **Home** — 10 menu items (New, Series, Movies, TV, Cartoons, Favorites, History, Categories, Countries, Search)
2. **List** — Card-based grid with pagination; supports movie items, category sub-items, search input
3. **Detail** — Poster + metadata + episode grid grouped by server; star toggle for favorites
4. **Player** — Full-viewport `<video>` with overlay; auto-next episode; keyboard controls

### Data Flow

- `https://phimapi.com` called directly from browser
- Image proxy: `phimapi.com/image.php?url=...`
- Favs stored in `localStorage.tz_favs` as `{ slug: { name, thumb, year, origin } }`
- History stored in `localStorage.tz_hist` as `{ slug: { name, thumb, ..., episode, at } }`
- Favorites & history are local-only; no backend sync

### Key Changes from Tizen Original

| Aspect | Tizen Original | Web Version |
|--------|---------------|-------------|
| Input | TV remote keys only | Mouse + keyboard + touch |
| CSS | Inline JS string | External `style.css`, responsive |
| Search | Popup prompt | Text input + submit button |
| Episode grid | Arrow-key nav | Clickable + keyboard nav |
| Layout | Fixed TV UI | Responsive (desktop grid, mobile list) |
| Player | `<video>` native | `<video>` + hls.js for HLS |

### API Endpoints Used

- `GET /danh-sach/phim-moi-cap-nhat?page=N`
- `GET /v1/api/danh-sach/{type}?page=N&limit=20`
- `GET /v1/api/tim-kiem?keyword=...&page=N&limit=20`
- `GET /v1/api/the-loai/{slug}?page=N&limit=20`
- `GET /v1/api/quoc-gia/{slug}?page=N&limit=20`
- `GET /the-loai` (categories list)
- `GET /quoc-gia` (countries list)
- `GET /phim/{slug}` (movie detail + episodes)

### Vercel Deployment

- Build: `npm run build` → outputs to `dist/`
- SPA fallback: rewrite all routes to `/index.html`
- No serverless functions needed (static site)
