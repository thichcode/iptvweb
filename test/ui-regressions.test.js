import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
const playerSource = fs.readFileSync(new URL('../src/screens/player.js', import.meta.url), 'utf8')

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
