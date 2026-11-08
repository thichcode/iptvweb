# UX/UI Incremental Polish Design

## Overview

Minimal, mobile-first UX/UI improvements for WebPhim movie streaming SPA. Focus on skeleton loading, portrait grid layout, subtle transitions, and player UX enhancements.

## Approach: Incremental Polish

Keep existing codebase structure. Add visual improvements without major refactoring.

## 1. Skeleton Loading

Replace "Đang tải..." text with animated skeleton placeholders.

### Skeleton Components

**Movie List Skeleton** (5 items):
```
┌─────────────────────────────────┐
│ ┌──────┐  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ │      │  ▓▓▓▓▓▓▓▓▓▓▓▓         │
│ │  img │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │
│ │      │  ▓▓▓▓▓▓▓▓▓▓           │
│ └──────┘                        │
└─────────────────────────────────┘
```

**Detail Skeleton**:
- Poster: 260x380px gray box
- Title: 200px gray bar
- Tags: 3 small gray bars
- Description: 3 lines gray bars
- Episodes: grid of gray boxes

**Player Skeleton**:
- Seekbar: gray bar
- Time: gray text
- Controls: gray icons

### CSS Implementation

```css
.skeleton {
  background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## 2. Movie Grid Layout (Portrait)

### Responsive Breakpoints

| Screen | Columns | Gap | Poster Size |
|--------|---------|-----|-------------|
| Mobile (<600px) | 2 | 12px | ~170x255px |
| Tablet (600-900px) | 3 | 16px | ~200x300px |
| Desktop (>900px) | 4-5 | 16px | ~220x330px |

### Grid Structure

```css
.movie-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
}

@media (min-width: 600px) {
  .movie-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
}

@media (min-width: 900px) {
  .movie-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1200px) {
  .movie-grid { grid-template-columns: repeat(5, 1fr); }
}
```

### Card Design

```
┌─────────────┐
│             │
│   Poster    │
│   (2:3)     │
│             │
├─────────────┤
│ Title       │ ← overflow ellipsis
│ 2024 • VN   │ ← gray text
└─────────────┘
```

- Poster aspect ratio: 2:3 (portrait)
- Bottom gradient overlay for text readability
- Title: 1 line, overflow ellipsis
- Meta: year • origin_name

## 3. Screen Transitions

### Fade-In Animation

```css
.screen {
  display: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.screen.active {
  display: block;
  opacity: 1;
}
```

### Scroll-to-Top

When loading new data, scroll to top:
```js
container.scrollTo(0, 0)
// or
window.scrollTo({ top: 0, behavior: 'smooth' })
```

## 4. Player UX Enhancements

### Gesture Hint Overlay

Show on first play, auto-hide after 3s:
```
┌─────────────────────────────────┐
│         Movie Title             │
│                                 │
│   ← → Seek  |  Space Play/Pause│
│   Double-tap to seek 10s        │
└─────────────────────────────────┘
```

### Seek Feedback Animation

When seeking, show floating "+10s" or "-10s" text:
```css
.seek-feedback {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  color: #ffd600;
  opacity: 0;
  animation: seek-anim 0.5s ease-out;
}

@keyframes seek-anim {
  0% { opacity: 1; transform: translateY(-50%) scale(1); }
  100% { opacity: 0; transform: translateY(-50%) scale(1.5); }
}
```

### Better Controls

- Larger touch targets (min 44px)
- Better seekbar hover state
- Volume control (optional, future)

## 5. Visual Polish

### Gradient Overlays

Movie cards get subtle gradient at bottom:
```css
.movie-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  pointer-events: none;
}
```

### Focus States

Better keyboard/remote focus:
```css
.movie-card:focus-within {
  outline: 2px solid #ffd600;
  outline-offset: 2px;
}
```

### Custom Scrollbar

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #111; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #555; }
```

### Error States

Better error messages with illustration:
```html
<div class="error-state">
  <div class="error-icon">📡</div>
  <div class="error-title">Không kết nối được</div>
  <div class="error-hint">Kiểm tra mạng và thử lại</div>
  <button class="retry-btn">Thử lại</button>
</div>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/style.css` | Skeleton CSS, grid layout, transitions, scrollbar, focus states |
| `src/screens/list.js` | Skeleton rendering, grid container class |
| `src/screens/detail.js` | Skeleton rendering |
| `src/screens/player.js` | Gesture hints, seek feedback |
| `src/main.js` | Scroll-to-top, transition trigger |

## Success Metrics

- [ ] Skeleton loading visible on all screens
- [ ] Movie grid responsive 2→3→4→5 columns
- [ ] Fade-in transitions smooth
- [ ] Player gesture hints show on first play
- [ ] Seek feedback animation works
- [ ] Focus states visible for keyboard navigation
- [ ] No performance regression on low-end devices
