import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'

// PITFALL Android TV: input.focus() from JS does NOT open the soft keyboard
// (IME) on Android WebView — the browser only opens it on real user gesture
// (touch/click) or explicit native showSoftInput. Capacitor's Keyboard plugin
// wraps InputMethodManager.showSoftInput, which is the only reliable way to
// pop the on-screen keyboard when a remote D-pad focuses a search field.
export function showKeyboard() {
  if (Capacitor.isNativePlatform()) {
    try { Keyboard.show() } catch (err) { console.warn('Keyboard.show failed', err) }
  }
}

export function hideKeyboard() {
  if (Capacitor.isNativePlatform()) {
    try { Keyboard.hide() } catch (err) { console.warn('Keyboard.hide failed', err) }
  }
}
