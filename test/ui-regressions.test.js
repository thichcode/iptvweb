import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
const playerSource = fs.readFileSync(new URL('../src/screens/player.js', import.meta.url), 'utf8')
const homeSource = fs.readFileSync(new URL('../src/screens/home.js', import.meta.url), 'utf8')
const mainSource = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
const apkWorkflow = fs.readFileSync(new URL('../.github/workflows/release-apk.yml', import.meta.url), 'utf8')

test('home screen only displays when active', () => {
  assert.doesNotMatch(css, /#screen-home\s*\{[^}]*display:\s*flex/)
  assert.match(css, /#screen-home\.active\s*\{[^}]*display:\s*flex/)
})

test('player close button does not depend on global module functions', () => {
  assert.doesNotMatch(playerSource, /onclick="exitPlayer\(\)"/)
})

test('player overlay helper is exported for app-level player clicks', async () => {
  const player = await import('../src/screens/player.js')
  assert.equal(typeof player.showOverlay, 'function')
})

test('home wheel does not render emoji icon spans', () => {
  assert.doesNotMatch(homeSource, /wi-icon/)
  assert.doesNotMatch(homeSource, /const ICONS/)
})

test('home navigation keeps APK download link', () => {
  assert.match(mainSource, /releases\/latest\/download\/WebPhim\.apk/)
  assert.match(mainSource, />Tải APK</)
})

test('home has tv-shows row instead of cinema row', () => {
  assert.match(homeSource, /tv-shows/)
  assert.match(homeSource, /Phim Netflix/)
  assert.doesNotMatch(homeSource, /Hoạt Hình/)
})

test('header has API toggle with health dot styles', () => {
  assert.match(mainSource, /api-toggle-btn/)
  assert.match(mainSource, /api-toggle-label/)
  assert.match(css, /\.api-dot\.ok/)
  assert.match(css, /\.api-dot\.err/)
})

test('APK workflow patches manifest for Android TV', () => {
  assert.match(apkWorkflow, /LEANBACK_LAUNCHER/)
  assert.match(apkWorkflow, /android\.software\.leanback/)
  assert.match(apkWorkflow, /android\.hardware\.touchscreen/)
  assert.match(apkWorkflow, /android:banner="@drawable\/tv_banner"/)
  assert.match(apkWorkflow, /tv_banner\.png/)
})

test('APK uses a stable debug keystore for consistent sideload signatures', () => {
  assert.ok(fs.existsSync(new URL('../certs/debug.keystore', import.meta.url)))
  assert.match(apkWorkflow, /certs\/debug\.keystore/)
  assert.match(apkWorkflow, /storeFile.*certs\/debug\.keystore/)
  assert.match(apkWorkflow, /signingConfig signingConfigs\.debug/)
})

test('TV remote toolbar navigation works on home screen', () => {
  assert.match(mainSource, /homeToolbarIdx/)
  assert.match(mainSource, /getHomeToolbarItems/)
  assert.match(mainSource, /toolbar-focused/)
  assert.match(css, /\.toolbar-focused/)
  assert.match(homeSource, /export let focusedRow/)
  assert.match(homeSource, /navigateHome[\s\S]*'reset'/)
})

test('home rows use content-visibility for performance', () => {
  assert.match(css, /\.home-row\s*\{[^}]*content-visibility:\s*auto/)
})

test('poster images use decoding async', () => {
  assert.match(homeSource, /decoding="async"/)
})

test('D-pad navigation scroll is instant, not smooth', () => {
  assert.match(homeSource, /scrollIntoView\(\{\s*block:\s*'nearest',\s*behavior:\s*'auto'\s*\}\)/)
  assert.doesNotMatch(homeSource, /scrollIntoView\(\{\s*block:\s*'nearest',\s*behavior:\s*'smooth'/)
  assert.match(mainSource, /scrollIntoView\(\{\s*block:\s*'nearest',\s*behavior:\s*'auto'/)
})

test('focus transition is near-instant for TV remote', () => {
  assert.match(css, /transition-duration:\s*0\.06s/)
})

test('home rows lazy-mount via IntersectionObserver', () => {
  assert.match(homeSource, /IntersectionObserver/)
  assert.match(homeSource, /data-row-type/)
  assert.match(homeSource, /mountRowCarousel/)
})

test('local 7.5MB index loaded on demand, not idle-preloaded', () => {
  // loadHomeData loads local movies first for instant render, then refreshes from API
  assert.match(homeSource, /await loadMovies\(\)/)
  assert.match(homeSource, /fetchMovies/)
  assert.doesNotMatch(mainSource, /requestIdleCallback|setTimeout\(\s*loadMovies/)
})

test('back button uses Capacitor App plugin and double-press exit', () => {
  assert.match(mainSource, /popstate/)
  assert.match(mainSource, /preventDefault[\s\S]*goBack/)
  assert.match(mainSource, /Plugins\.App\.exitApp/)
  assert.match(mainSource, /backPressTs/)
})

test('theme avoids pure black color values', () => {
  assert.doesNotMatch(css, /#[0]{3,6}\b/i)
})

test('watch-mode: Back opens panel instead of exiting player', () => {
  assert.match(mainSource, /isWatchPanelOpen\(\)/)
  assert.match(mainSource, /openWatchPanel\(\)/)
  assert.match(playerSource, /watch-panel/)
  assert.match(playerSource, /WATCH_HIDE_MS\s*=\s*10000/)
  assert.match(css, /#watch-panel/)
})

test('watch-mode panel covers episodes + history + favs + cached browse', () => {
  assert.match(playerSource, /getHist/)
  assert.match(playerSource, /getFavs/)
  assert.match(playerSource, /getHomeRows/)
  assert.match(homeSource, /getHomeRows/)
})

test('watch-mode movie pick plays first episode immediately', () => {
  assert.match(playerSource, /fetchDetail/)
  assert.match(playerSource, /playEpisode\(0,\s*0\)/)
})

test('mobile bottom bar has 4 modern tabs: home, explore, search, profile', () => {
  assert.match(mainSource, /id="nav-home"[\s\S]*data-nav="home"/)
  assert.match(mainSource, /id="nav-explore"[\s\S]*data-nav="explore"/)
  assert.match(mainSource, /id="nav-search"[\s\S]*data-nav="search"/)
  assert.match(mainSource, /id="nav-profile"[\s\S]*data-nav="profile"/)
  assert.match(css, /env\(safe-area-inset-bottom/)
  assert.match(css, /env\(safe-area-inset-top/)
})

test('explore screen renders chip categories and desktop hero banner has slide support', async () => {
  const listModule = await import('../src/screens/list.js')
  assert.equal(typeof listModule.renderExploreScreen, 'function')
  assert.match(homeSource, /home-hero-strip/)
  assert.match(css, /\.explore-chip/)
  assert.match(css, /\.chip-grid/)
})

test('player supports PC shortcuts (K, Mute, Volume) and mobile fullscreen orientation lock', () => {
  assert.match(mainSource, /key === 'k' \|\| key === 'K'/)
  assert.match(mainSource, /key === 'm' \|\| key === 'M'/)
  assert.match(mainSource, /orientation\?\.lock/)
})



