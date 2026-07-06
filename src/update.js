import { $ } from './utils.js'

const REPO = 'thichcode/iptvweb'
const APK_NAME = 'WebPhim.apk'
const CURRENT_VERSION = '1.0.0'

function parseVersion(tag) {
  const v = tag.replace(/^v/, '').split('.').map(Number)
  return (v[0] || 0) * 10000 + (v[1] || 0) * 100 + (v[2] || 0)
}

export async function checkUpdate() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!res.ok) return null
    const data = await res.json()
    const tag = data.tag_name || ''
    const latestVer = tag.replace(/^v/, '')
    if (parseVersion(tag) <= parseVersion(CURRENT_VERSION)) return null
    const apk = data.assets?.find(a => a.name === APK_NAME)
    const downloadUrl = apk?.browser_download_url || `https://github.com/${REPO}/releases/latest/download/${APK_NAME}`
    return { version: latestVer, tag, downloadUrl, notes: data.body || '' }
  } catch { return null }
}

export function showUpdateModal(info) {
  if ($('#update-modal')) return
  const modal = document.createElement('div')
  modal.id = 'update-modal'
  modal.innerHTML = `
    <div class="update-backdrop"></div>
    <div class="update-box">
      <div class="update-head">Có phiên bản mới!</div>
      <div class="update-ver">v${info.version}</div>
      ${info.notes ? `<div class="update-notes">${info.notes.slice(0, 500)}</div>` : ''}
      <div class="update-actions">
        <a class="update-btn update-dl" href="${info.downloadUrl}" target="_blank" rel="noopener">Tải APK</a>
        <button class="update-btn update-close">Để sau</button>
      </div>
    </div>`
  document.body.appendChild(modal)
  modal.querySelector('.update-close').onclick = () => modal.remove()
  modal.querySelector('.update-backdrop').onclick = () => modal.remove()
}

export function initUpdateChecker() {
  checkUpdate().then(info => { if (info) showUpdateModal(info) })
}
