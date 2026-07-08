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

test('home uses cinema row instead of animation row', () => {
  assert.match(homeSource, /phim-chieu-rap/)
  assert.match(homeSource, /Phim Chiếu Rạp/)
  assert.doesNotMatch(homeSource, /Hoạt Hình/)
})

test('header has API toggle with health dot styles', () => {
  assert.match(mainSource, /api-toggle-btn/)
  assert.match(mainSource, /api-toggle-label/)
  assert.match(css, /\.api-dot\.ok/)
  assert.match(css, /\.api-dot\.err/)
})

test('APK workflow installs custom app icon', () => {
  assert.ok(fs.existsSync(new URL('../assets/app-icon.png', import.meta.url)))
  assert.match(apkWorkflow, /assets\/app-icon\.png/)
  assert.match(apkWorkflow, /ic_launcher\.png/)
})

test('theme avoids pure black color values', () => {
  assert.doesNotMatch(css, /#[0]{3,6}\b/i)
})
