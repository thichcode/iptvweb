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

test('local 7.5MB index not loaded at startup', () => {
  assert.match(mainSource, /requestIdleCallback|setTimeout\(\s*loadMovies/)
  // loadHomeData must reach for local movies only AFTER attempting API fetch
  assert.match(homeSource, /fetchMovies[\s\S]*loadMovies/)
  assert.doesNotMatch(homeSource, /const localMovies = await loadMovies\(\)\s*\n\s*rows = await Promise\.all/)
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
