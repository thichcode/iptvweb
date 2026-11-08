import { test, beforeEach } from 'node:test'
import assert from 'node:assert'
import { parseBuildNum, selectTargetApk, showReadyToInstallModal, getNativeAppUpdate } from '../src/update.js'

test('parseBuildNum handles tags correctly', () => {
  assert.strictEqual(parseBuildNum('build-15'), 15)
  assert.strictEqual(parseBuildNum('v1.2.3'), 10203)
  assert.strictEqual(parseBuildNum('1.0.5'), 10005)
  assert.strictEqual(parseBuildNum('invalid'), 0)
  assert.strictEqual(parseBuildNum(''), 0)
})

test('selectTargetApk selects WebPhimTV.apk on TV and WebPhim.apk on Mobile', () => {
  assert.strictEqual(selectTargetApk(true), 'WebPhimTV.apk')
  assert.strictEqual(selectTargetApk(false), 'WebPhim.apk')
})

test('getNativeAppUpdate returns null when not on native platform', () => {
  global.window = {}
  assert.strictEqual(getNativeAppUpdate(), null)

  global.window = {
    Capacitor: {
      isNativePlatform: () => true,
      Plugins: {
        AppUpdate: { test: true }
      }
    }
  }
  assert.deepStrictEqual(getNativeAppUpdate(), { test: true })
})

test('showReadyToInstallModal creates modal with install and cancel buttons', () => {
  let appended = null
  let removed = false

  global.window = {
    requestAnimationFrame: (cb) => cb(),
    Capacitor: { isNativePlatform: () => false }
  }

  global.document = {
    body: {
      appendChild: (el) => { appended = el }
    },
    getElementById: (id) => null,
    querySelector: (sel) => null,
    createElement: (tag) => {
      const children = []
      const el = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        querySelector: (sel) => {
          if (sel === '#btn-install-now') return { onclick: null, focus: () => {} }
          if (sel === '#btn-install-later') return { onclick: null }
          if (sel === '.update-backdrop') return { addEventListener: () => {} }
          return null
        },
        remove: () => { removed = true }
      }
      return el
    }
  }

  showReadyToInstallModal({
    version: '1.2.0',
    tag: 'v1.2.0',
    downloadUrl: 'https://example.com/WebPhim.apk',
    fileName: 'WebPhim.apk',
    notes: 'Release notes'
  })

  assert.ok(appended, 'Modal element must be appended to body')
  assert.strictEqual(appended.id, 'update-install-modal')
  assert.ok(appended.innerHTML.includes('Bản cập nhật đã sẵn sàng!'))
})
