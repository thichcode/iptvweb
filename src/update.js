import { $ } from './utils.js'
import { isTV } from './platform.js'

const REPO = 'thichcode/iptvweb'

export function parseBuildNum(tag) {
  if (!tag || typeof tag !== 'string') return 0
  const m = tag.match(/build-(\d+)/i) || tag.match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!m) return 0
  if (m[1] && m[2] && m[3]) return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3])
  return parseInt(m[1], 10) || 0
}

export function selectTargetApk(isTVPlatform) {
  return isTVPlatform ? 'WebPhimTV.apk' : 'WebPhim.apk'
}

export function getNativeAppUpdate() {
  try {
    return window.Capacitor?.isNativePlatform?.() ? (window.Capacitor?.Plugins?.AppUpdate || null) : null
  } catch {
    return null
  }
}

let _lastTag = ''
export async function checkUpdate() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!res.ok) return null
    const data = await res.json()
    const tag = data.tag_name || ''
    if (!tag || tag === _lastTag) return null

    const tagBuildNum = parseBuildNum(tag)

    // Check installed version on native Android first
    const native = getNativeAppUpdate()
    if (native) {
      try {
        const appInfo = await native.getAppVersion()
        if (appInfo) {
          const installedVerNum = parseBuildNum(appInfo.versionName) || Number(appInfo.versionCode) || 0
          if (tagBuildNum <= installedVerNum) return null
        }
      } catch {}
    }

    const currentStoredTag = localStorage.getItem('wp_last_update_tag') || ''
    if (tagBuildNum <= parseBuildNum(currentStoredTag)) return null

    _lastTag = tag
    const targetFileName = selectTargetApk(isTV())
    const apk = data.assets?.find(a => a.name === targetFileName)
    const downloadUrl = apk?.browser_download_url || `https://github.com/${REPO}/releases/latest/download/${targetFileName}`

    return {
      version: tag.replace(/^v/, ''),
      tag,
      downloadUrl,
      fileName: targetFileName,
      notes: data.body || ''
    }
  } catch {
    return null
  }
}

export function showUpdateModal(info) {
  if ($('#update-modal') || $('#update-install-modal')) return
  const modal = document.createElement('div')
  modal.id = 'update-modal'
  modal.innerHTML = `
    <div class="update-backdrop"></div>
    <div class="update-box">
      <div class="update-head">Có phiên bản mới!</div>
      <div class="update-ver"></div>
      <div class="update-notes" style="display:none"></div>
      <div class="update-actions">
        <a class="update-btn update-dl" target="_blank" rel="noopener">Tải APK</a>
        <button class="update-btn update-close">Để sau</button>
      </div>
    </div>`
  document.body.appendChild(modal)
  const verEl = modal.querySelector('.update-ver')
  if (verEl) verEl.textContent = info.version
  const dlEl = modal.querySelector('.update-dl')
  if (dlEl) { dlEl.href = info.downloadUrl; dlEl.textContent = 'Tải APK' }
  if (info.notes) {
    const notesEl = modal.querySelector('.update-notes')
    if (notesEl) { notesEl.textContent = info.notes.slice(0, 500); notesEl.style.display = 'block' }
  }
  modal.querySelector('.update-close')?.addEventListener('click', () => modal.remove())
  modal.querySelector('.update-backdrop')?.addEventListener('click', () => modal.remove())
  try { localStorage.setItem('wp_last_update_tag', info.tag) } catch {}
}

export function showReadyToInstallModal(info) {
  if ($('#update-install-modal')) return
  // Remove old update-modal if open
  $('#update-modal')?.remove()

  const modal = document.createElement('div')
  modal.id = 'update-install-modal'
  modal.className = 'update-modal-backdrop'
  modal.innerHTML = `
    <div class="update-backdrop"></div>
    <div class="update-install-box">
      <div class="update-badge">CẬP NHẬT MỚI</div>
      <h3 class="update-install-head">Bản cập nhật đã sẵn sàng!</h3>
      <div class="update-install-ver">Phiên bản: <strong>${info.version || info.tag}</strong></div>
      ${info.notes ? `<div class="update-install-notes">${info.notes.slice(0, 500)}</div>` : ''}
      <div class="update-install-actions">
        <button id="btn-install-now" class="update-btn update-btn-primary" tabindex="0">Cài đặt ngay</button>
        <button id="btn-install-later" class="update-btn update-btn-secondary" tabindex="0">Để sau</button>
      </div>
    </div>`
  document.body.appendChild(modal)

  const btnInstall = modal.querySelector('#btn-install-now')
  const btnLater = modal.querySelector('#btn-install-later')

  if (btnInstall) {
    btnInstall.onclick = async () => {
      const native = getNativeAppUpdate()
      if (native) {
        try {
          const res = await native.installApk({ fileName: info.fileName })
          if (res?.needsPermission) {
            btnInstall.textContent = 'Cấp quyền & Cài đặt'
          } else {
            try { localStorage.setItem('wp_last_update_tag', info.tag) } catch {}
            modal.remove()
          }
        } catch (e) {
          console.error('Install failed:', e)
          try { window.open(info.downloadUrl, '_system') } catch {}
        }
      } else {
        window.open(info.downloadUrl, '_blank')
        modal.remove()
      }
    }
    // Focus install button by default for TV remote
    const defer = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setTimeout
    defer(() => btnInstall.focus())
  }

  if (btnLater) {
    btnLater.onclick = () => modal.remove()
  }

  modal.querySelector('.update-backdrop')?.addEventListener('click', () => modal.remove())
}

export function initUpdateChecker() {
  checkUpdate().then(async info => {
    if (!info) return

    const native = getNativeAppUpdate()
    if (native) {
      try {
        const checkRes = await native.isApkDownloaded({ fileName: info.fileName, version: info.version })
        if (checkRes?.downloaded) {
          showReadyToInstallModal(info)
          return
        }

        if (checkRes?.downloading) {
          // Already downloading in background, just wait for event
          native.addListener('apkDownloadComplete', async () => {
            const recheck = await native.isApkDownloaded({ fileName: info.fileName, version: info.version })
            if (recheck?.downloaded) {
              showReadyToInstallModal(info)
            }
          })
          return
        }

        // Trigger background download
        await native.startDownload({
          url: info.downloadUrl,
          fileName: info.fileName,
          version: info.version,
          title: `Cập nhật WebPhim ${info.version}`
        })

        // Listen for download completion event
        native.addListener('apkDownloadComplete', async () => {
          const recheck = await native.isApkDownloaded({ fileName: info.fileName, version: info.version })
          if (recheck?.downloaded) {
            showReadyToInstallModal(info)
          }
        })
      } catch (err) {
        console.warn('Native update check failed, fallback to modal:', err)
        showUpdateModal(info)
      }
    } else {
      showUpdateModal(info)
    }
  })
}
