import test from 'node:test'
import assert from 'node:assert/strict'
import { detectPlatform, getPlatform, initPlatform, isPC, isMobile, isTV } from '../src/platform.js'

test('Platform detection: identifies TV from User-Agent or explicit flag', () => {
  assert.equal(detectPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 10; BRAVIA 4K UR2 Build/QTG3) AppleWebKit/537.36' }), 'tv')
  assert.equal(detectPlatform({ userAgent: 'Mozilla/5.0 (Linux; U; Android TV)' }), 'tv')
  assert.equal(detectPlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 9; AFTT)' }), 'tv')
  assert.equal(detectPlatform({ isTVFlag: true }), 'tv')
})

test('Platform detection: identifies Mobile from touch pointer or narrow viewport', () => {
  assert.equal(detectPlatform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', width: 390, isCoarse: true }), 'mobile')
  assert.equal(detectPlatform({ width: 480, isCoarse: true }), 'mobile')
  assert.equal(detectPlatform({ width: 600, isCoarse: false }), 'mobile')
})

test('Platform detection: identifies PC Desktop on wide screen with fine pointer', () => {
  assert.equal(detectPlatform({ width: 1440, isCoarse: false, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }), 'pc')
  assert.equal(detectPlatform({ width: 1024, isCoarse: false }), 'pc')
})

test('DOM synchronization: initPlatform sets data-platform and body classes', () => {
  // Mock window & document
  const mockClassList = new Set()
  const mockDoc = {
    documentElement: { dataset: {} },
    body: {
      classList: {
        add: (c) => mockClassList.add(c),
        remove: (c) => mockClassList.delete(c),
        contains: (c) => mockClassList.has(c)
      }
    }
  }

  const p = initPlatform({
    doc: mockDoc,
    env: { width: 1280, isCoarse: false, userAgent: 'Mozilla/5.0 (Windows NT 10.0)' }
  })

  assert.equal(p, 'pc')
  assert.equal(mockDoc.documentElement.dataset.platform, 'pc')
  assert.ok(mockDoc.body.classList.contains('platform-pc'))
  assert.equal(getPlatform(), 'pc')
  assert.equal(isPC(), true)
  assert.equal(isMobile(), false)
  assert.equal(isTV(), false)
})
