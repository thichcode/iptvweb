# Balanced Cinema TV Redesign Design

## Context

WebPhim is a vanilla Vite app for browsing and watching movies from OPhim. The current stack is plain JavaScript modules, vanilla CSS, `hls.js`, and Capacitor Android. The UI must work well on mobile phones, desktop browsers, and Android TV with remote control.

The redesign should improve visual quality without changing the app architecture or adding a framework. Existing flows stay the same: home menu, movie list, category/country lists, search, favorites/history, detail page, and player.

## Design Direction

Use a **Balanced Cinema TV** direction:

- Dark cinema surface with warm amber focus color.
- Large readable typography and high-contrast states.
- Poster-first where it improves browsing, but not at the cost of TV usability.
- Motion should feel smooth and tactile, not decorative or heavy.
- Remote focus must be obvious from couch distance.

This is intentionally not a marketing-site redesign. It is an app UI redesign focused on everyday watching.

## Goals

- Make mobile, desktop, and Android TV each feel intentionally designed.
- Make focus/selection unmistakable for Android TV remote users.
- Improve desktop browsing with stronger poster presentation.
- Preserve mobile thumb usability and large touch targets.
- Keep implementation small: CSS and minor markup changes only unless a screen needs a small class/structure hook.

## Non-Goals

- No React/Tailwind migration.
- No new animation or UI libraries.
- No GSAP.
- No change to OPhim API logic.
- No new calendar/date feature.
- No autoplay preview, account system, or recommendation engine.

## Visual System

### Color

- Background: off-black charcoal, not pure black.
- Surface: layered dark panels with subtle warm tint.
- Accent: keep the existing amber/yellow family for focus and primary actions.
- Error: keep red only for error states.
- Success: keep green only for update success states.

### Typography

- Keep system font for reliability on Android TV and low-end devices.
- Increase hierarchy through size, weight, spacing, and line-height rather than importing a web font.
- Use `font-variant-numeric: tabular-nums` where time/progress is shown.
- Clamp long titles to 2 lines in lists.
- Detail descriptions max out near 65 characters per line.

### Surfaces

- Keep the existing subtle grain overlay.
- Add cinematic radial depth on major screens.
- Cards should feel tactile: dark surface, restrained border, focus glow, and pressed scale.
- Avoid too much blur because Android TV WebView performance can vary.

## Screen Designs

### Home

Keep the 3D wheel concept but make it more TV-readable.

- Primary focus remains the center wheel item.
- Focused item gets a thick amber border, brighter text, and soft glow.
- Non-focused items stay visible but quieter.
- Reduce visual competition from secondary actions.
- APK/update/large-mode controls move into a quieter secondary control row below the wheel.
- Emoji icons may stay for now, but they should not dominate the label. If rendering looks inconsistent, replace them with text-only compact markers.

Responsive behavior:

- Mobile: wheel fills most of the vertical space, controls wrap under it.
- Desktop: wheel is centered with comfortable width.
- TV: wheel item height and label size increase; focus glow becomes stronger.

### List

The list screen needs the biggest layout upgrade.

- Mobile keeps one-column list cards for speed and thumb use.
- Desktop changes movie results to a poster-card grid instead of a compact horizontal list.
- Android TV uses larger cards with fewer columns, avoiding tiny text and crowded rows.
- Category and country chips remain wrap layouts, but with larger focus and better spacing.
- Pagination stays simple and centered.

Movie card contents:

- Poster image.
- Movie title, max 2 lines.
- Metadata row: year and origin.
- Focus state: amber border, glow, slight scale.

Grid targets:

- Mobile: 1 column list style.
- Tablet/desktop: 3-4 poster cards depending on width.
- TV/large mode: 2 large columns or 1 column in large mode.

### Search

- Keep sticky mobile search under the header.
- Desktop search should be wider and visually centered.
- Search button remains high-contrast amber with dark text.
- Input focus uses amber border.

### Detail

Detail should feel like a movie page without becoming heavy.

- Poster left, content right on desktop/TV.
- Poster top, content below on mobile.
- Title becomes more prominent.
- Tags become restrained chips.
- Description line length stays readable.
- Episodes sit in a separate panel below the main movie info.
- Episode buttons become larger on TV and large mode.
- Favorite action remains available both inline and as mobile FAB.

Responsive behavior:

- Mobile: poster max around 180px, content stacked, FAB remains near thumb.
- Desktop: poster 260-340px, content uses available width.
- TV: poster larger, episode panel capped so buttons do not stretch across the entire screen.

### Player

Keep player logic unchanged.

Visual changes only:

- Stronger bottom gradient for readability.
- Larger title and time on TV/large mode.
- Center play button remains large and obvious.
- Exit and fullscreen controls keep high contrast.
- Seekbar gets larger hit area on mobile and TV.

## Interaction And Focus

- All clickable elements keep visible hover, active, and focus states.
- `.focused` remains the app-controlled TV focus state.
- `:focus-visible` remains as a native fallback.
- Use transform and opacity for motion, not layout-changing properties.
- Keep transitions short: 150-300ms.
- Android TV focus must be visible without relying on hover.

## Error, Empty, And Loading States

- Keep skeleton loaders.
- Upgrade empty states from plain `Trống` to short composed states like `Chưa có phim` with a secondary hint.
- Keep retry buttons in error states.
- Avoid `window.alert()`.

## Accessibility

- Preserve large touch targets.
- Add meaningful `alt` text for movie posters where the movie name is available.
- Keep focus rings visible.
- Keep Vietnamese labels consistent.
- Avoid icon-only buttons without `aria-label`.

## Implementation Scope

Expected file changes:

- `src/style.css`: primary redesign work.
- `src/screens/list.js`: add classes/markup needed for poster-card layout and better empty states.
- `src/screens/detail.js`: add classes/markup needed for detail page panels and poster alt text.
- `src/screens/home.js`: minor class/markup cleanup if needed for home controls.
- `src/main.js`: no expected logic changes except labels/ARIA if needed.
- `index.html`: optional meta polish only if needed.

## Verification

Run:

- `npm run build`
- `npm test`

Manual checks:

- Mobile width around 390px.
- Desktop width around 1440px.
- TV width around 1920px.
- Keyboard/remote navigation: home, list, detail, player.
- Large mode on/off.
- Error/empty/loading states remain readable.

## Decisions

- Keep emoji icons in the home wheel unless they visibly render badly on Android TV.
- Keep system font to avoid performance and font-loading issues on TV.
- Do not add a date/calendar display.
