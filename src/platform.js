// Platform detection & adaptation engine for WebPhim (PC, Mobile Touch, Android TV)

let currentPlatform = 'pc'

const TV_UA_REGEX = /Android TV|Leanback|BRAVIA|AFTT|MiTV|GoogleTV|SmartTV/i

export function detectPlatform(options = {}) {
  const ua = options.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  const width = options.width !== undefined
    ? options.width
    : (typeof window !== 'undefined' ? window.innerWidth : 1200)
  const isCoarse = options.isCoarse !== undefined
    ? options.isCoarse
    : (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false)
  const isTVFlag = options.isTVFlag !== undefined
    ? options.isTVFlag
    : (typeof window !== 'undefined' && (
        window.__PLATFORM__ === 'tv' ||
        (window.location && new URLSearchParams(window.location.search).get('tv') === '1')
      ))

  if (isTVFlag || TV_UA_REGEX.test(ua)) {
    return 'tv'
  }
  if (width < 768 || isCoarse) {
    return 'mobile'
  }
  return 'pc'
}

export function getPlatform() {
  return currentPlatform
}

export function isPC() {
  return currentPlatform === 'pc'
}

export function isMobile() {
  return currentPlatform === 'mobile'
}

export function isTV() {
  return currentPlatform === 'tv'
}

export function applyPlatformClasses(targetDoc, platform) {
  if (!targetDoc) return
  if (targetDoc.documentElement) {
    targetDoc.documentElement.dataset.platform = platform
  }
  if (targetDoc.body && targetDoc.body.classList) {
    targetDoc.body.classList.remove('platform-pc', 'platform-mobile', 'platform-tv')
    targetDoc.body.classList.add(`platform-${platform}`)
    if (platform === 'tv') {
      targetDoc.body.classList.add('tv-mode')
    }
  }
}

export function initPlatform(options = {}) {
  const doc = options.doc || (typeof document !== 'undefined' ? document : null)
  currentPlatform = detectPlatform(options.env || {})

  if (doc) {
    applyPlatformClasses(doc, currentPlatform)
  }

  // Auto-switch to TV mode if D-pad keys are pressed on an ambiguous device
  if (typeof window !== 'undefined') {
    const handleDpadSwitch = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (currentPlatform !== 'tv' && currentPlatform !== 'pc') {
          currentPlatform = 'tv'
          applyPlatformClasses(document, currentPlatform)
        }
      }
    }
    window.addEventListener('keydown', handleDpadSwitch, { passive: true })

    // Auto-update on resize between mobile and pc if not tv
    window.addEventListener('resize', () => {
      if (currentPlatform !== 'tv') {
        const next = detectPlatform()
        if (next !== 'tv' && next !== currentPlatform) {
          currentPlatform = next
          applyPlatformClasses(document, currentPlatform)
        }
      }
    })
  }

  return currentPlatform
}
