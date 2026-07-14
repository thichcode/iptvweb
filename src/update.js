import { $ } from './utils.js'

const REPO = 'thichcode/iptvweb'
const APK_NAME = 'WebPhim.apk'

function parseBuildNum(tag) {
  const m = tag.match(/build-(\d+)/i) || tag.match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!m) return 0
  if (m[1] && m[2] && m[3]) return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3])
  return parseInt(m[1], 10) || 0
}

let _lastTag = ''
export async function checkUpdate() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!res.ok) return null
    const data = await res.json()
    const tag = data.tag_name || ''
    if (!tag || tag === _lastTag || parseBuildNum(tag) <= parseBuildNum(localStorage.getItem('wp_last_update_tag') || '')) return null
    _lastTag = tag
    const apk = data.assets?.find(a => a.name === APK_NAME)
    const downloadUrl = apk?.browser_download_url || `https://github.com/${REPO}/releases/latest/download/${APK_NAME}`
    return { version: tag.replace(/^v/, ''), tag, downloadUrl, notes: data.body || '' }
  } catch { return null }
}

export function showUpdateModal(info) {
  if ($('#update-modal')) return
  const modal = document.createElement('div')
  modal.id = 'update-modal'
  const notesDiv = info.notes ? `<div class="update-notes"></div>` : ''
  modal.innerHTML = `
    <div class="update-backdrop"></div>
    <div class="update-box">
      <div class="update-head">Có phiên bản mới!</div>
      <div class="update-ver">${info.version}</div>
      ${notesDiv}
      <div class="update-actions">
        <a class="update-btn update-dl" href="${info.downloadUrl}" target="_blank" rel="noopener">Tải APK</a>
        <button class="update-btn update-close">Để sau</button>
      </div>
    </div>`
  document.body.appendChild(modal)
  if (info.notes) {
    const el = modal.querySelector('.update-notes')
    if (el) el.textContent = info.notes.slice(0, 500)
  }
  modal.querySelector('.update-close').onclick = () => modal.remove()
  modal.querySelector('.update-backdrop').onclick = () => modal.remove()
  try { localStorage.setItem('wp_last_update_tag', info.tag) } catch {}
}

export function initUpdateChecker() {
  checkUpdate().then(info => { if (info) showUpdateModal(info) })
}
