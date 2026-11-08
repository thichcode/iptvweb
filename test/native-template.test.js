import { test } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'

test('native-template files exist and contain required methods', () => {
  const xml = fs.readFileSync('android-template/res/xml/file_paths.xml', 'utf8')
  assert.ok(xml.includes('external-files-path'), 'file_paths.xml must declare external-files-path')
  assert.ok(xml.includes('path="Download"'), 'file_paths.xml must map Download path')

  const java = fs.readFileSync('android-template/UpdatePlugin.java', 'utf8')
  assert.ok(java.includes('@CapacitorPlugin(name = "AppUpdate")'), 'must declare AppUpdate plugin')
  assert.ok(java.includes('isApkDownloaded'), 'must implement isApkDownloaded')
  assert.ok(java.includes('startDownload'), 'must implement startDownload')
  assert.ok(java.includes('installApk'), 'must implement installApk')
  assert.ok(java.includes('ACTION_DOWNLOAD_COMPLETE'), 'must handle download complete broadcast')
  assert.ok(java.includes('STATUS_SUCCESSFUL'), 'must verify download status is successful before emitting complete')
  assert.ok(java.includes('ActivityNotFoundException'), 'must handle ActivityNotFoundException for unknown app sources')
  assert.ok(java.includes('downloaded_version'), 'must track and verify downloaded version')
})
