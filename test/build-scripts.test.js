import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'

test('build-apk.ps1 and build-tv.ps1 include update plugin patching', () => {
  const apkScript = fs.readFileSync('scripts/build-apk.ps1', 'utf8')
  assert.ok(apkScript.includes('UpdatePlugin'), 'build-apk.ps1 must copy UpdatePlugin')
  assert.ok(apkScript.includes('REQUEST_INSTALL_PACKAGES'), 'build-apk.ps1 must add REQUEST_INSTALL_PACKAGES')
  assert.ok(apkScript.includes('file_paths.xml'), 'build-apk.ps1 must copy file_paths.xml')

  const tvScript = fs.readFileSync('scripts/build-tv.ps1', 'utf8')
  assert.ok(tvScript.includes('UpdatePlugin'), 'build-tv.ps1 must copy UpdatePlugin')
  assert.ok(tvScript.includes('REQUEST_INSTALL_PACKAGES'), 'build-tv.ps1 must add REQUEST_INSTALL_PACKAGES')
  assert.ok(tvScript.includes('file_paths.xml'), 'build-tv.ps1 must copy file_paths.xml')

  const workflow = fs.readFileSync('.github/workflows/release-apk.yml', 'utf8')
  assert.ok(workflow.includes('UpdatePlugin.java'), 'release-apk.yml must patch UpdatePlugin.java')
  assert.ok(workflow.includes('REQUEST_INSTALL_PACKAGES'), 'release-apk.yml must add REQUEST_INSTALL_PACKAGES')
  assert.ok(workflow.includes('file_paths.xml'), 'release-apk.yml must copy file_paths.xml')
})
