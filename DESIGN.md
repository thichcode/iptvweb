# Design System: WebPhim Cinema TV

## 1. Visual Theme & Atmosphere
WebPhim uses a restrained cinema-room interface: dark, quiet, readable, and built for long-distance TV viewing as much as mobile touch. Density is Daily App Balanced (5/10), variance is Offset Asymmetric (6/10), and motion is Fluid CSS (5/10). The mood is warm off-black projection room, not neon arcade.

Every screen should feel like a focused movie surface. Menus use strong focus states, lists use poster-led scanning, and detail pages prioritize poster, title, metadata, description, then episode action. No element should overlap another element.

## 2. Color Palette & Roles
- **Projection Black** (#0B0B09) — Primary app background. Never use pure black.
- **Charcoal Stage** (#11100D) — Secondary page depth and sticky surfaces.
- **Film Surface** (rgba(28,26,20,0.88)) — Cards, list rows, panels, and controls.
- **Raised Film Surface** (rgba(38,35,27,0.94)) — Focused or hovered interactive surfaces.
- **Warm Ivory Text** (#FFF8E6) — Primary text and high-priority labels.
- **Aged Subtitle** (#B9AD91) — Descriptions, metadata, helper text.
- **Faint Reel** (#766F5D) — De-emphasized dividers and inactive hints.
- **Amber Projector** (#FFD45A) — The only accent color. Used for focus rings, active state, primary CTA, and episode focus.
- **Reel Border** (rgba(255,214,96,0.16)) — Default structural lines.
- **Active Reel Border** (rgba(255,214,96,0.62)) — Focused borders and selected states.
- **Signal Green** (#72D987) — Success text only.
- **Subtitle Red** (#FF6868) — Error text only.

## 3. Typography Rules
- **Display:** Satoshi or Outfit, track-tight, weight 700-800, `clamp(1.5rem, 4vw, 3rem)`. Use color and weight for hierarchy, not oversized text.
- **Body:** Satoshi or Outfit, relaxed leading 1.65-1.8, maximum 65 characters per line.
- **Mono:** Geist Mono or JetBrains Mono for timers, episode numbers, build numbers, and dense metadata.
- **Fallback:** System UI is acceptable only when no webfont is loaded in the production app.
- **Banned:** Inter, generic serif fonts, pure system-only premium mocks, all-caps paragraphs, and body text below 14px.

## 4. Component Stylings
- **Home Wheel:** Large centered selection target, no emoji icons, warm amber focus border, tactile active scale. The focused item must be visibly larger or brighter than neighbors.
- **Buttons:** Flat or softly raised. Primary buttons use Amber Projector fill with dark text (#141006). Active state translates or scales down subtly. No neon outer glows.
- **Movie Cards:** Poster-first at tablet and desktop sizes. Mobile can use compact horizontal rows. Radius 14px-22px, tinted shadows, visible focus border.
- **Detail Hero:** Poster and metadata sit in one raised panel. Description stays under 65ch. Episode list is a separate panel below the hero.
- **Inputs:** Label or clear placeholder, 48px minimum height, accent border on focus, error text below the field.
- **Loaders:** Skeletons must match poster/list dimensions. No circular spinners.
- **Empty States:** Use title plus hint explaining how content appears. Avoid one-word empty messages.
- **Error States:** Inline title, useful hint, and one retry action. Errors must not hide navigation.

## 5. Layout Principles
Use CSS Grid for poster lists and flex only for simple alignment. Contain wide layouts at 1600px with TV-safe side padding of at least 48px. On screens below 768px, all multi-column layouts collapse to one column with no horizontal scroll.

Home is a functional app hub, not a marketing hero. Keep it simple: wheel, update/download actions, and large-mode toggle. Detail screens must keep episode buttons reachable without precision pointing. TV mode should reduce visual density and increase touch/focus targets.

## 6. Motion & Interaction
Motion should use transform and opacity only. Default feel is weighty and calm: 250-350ms transitions, no linear easing for major interactive states. Lists can cascade in future Stitch mocks, but production should prioritize responsiveness over choreography.

Every interactive element must support keyboard/remote focus. Touch targets are minimum 44px; TV-focused episode buttons should target 56px minimum height. Do not animate layout properties such as width, height, top, or left.

## 7. API And Media Rules
- Default API host is `https://ophim1.com`.
- Default image host is `https://img.ophim.live/uploads/movies`.
- Do not proxy images through `phimapi.com/image.php`; that endpoint is unreliable and currently returns 404 for valid OPhim images.
- API calls must use `GET`; do not rely on `HEAD` checks for OPhim endpoints.
- Support both current OPhim v1 list payloads (`data.items`) and legacy payloads (`items`).

## 8. Anti-Patterns Banned
- No emojis in production UI labels or decorative menu icons.
- No Inter font in Stitch outputs.
- No pure black (`#000000` or `#000`).
- No purple or blue neon aesthetic.
- No neon outer glow shadows.
- No oversaturated accent palette. Amber Projector is the only accent.
- No excessive gradient text on large headers.
- No custom mouse cursors.
- No overlapping elements or absolute-positioned content stacks.
- No generic three-equal-card feature rows.
- No fake round-number claims.
- No AI copywriting cliches such as Elevate, Seamless, Unleash, or Next-Gen.
- No filler UI text such as Scroll to explore, Swipe down, or bouncing arrows.
- No broken Unsplash links; use real API posters, `picsum.photos`, or local SVG placeholders for mocks.
