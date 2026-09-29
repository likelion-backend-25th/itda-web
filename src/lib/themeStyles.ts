/** 인가된 유료 테마 CSS를 document에 주입한다. cssText는 localStorage에 저장하지 않는다. */

const STYLE_ID = 'itda-paid-theme'

/** 세션 동안 themeId → cssText (디스크 저장 금지) */
const memoryCache = new Map<number, string>()

export function cachePaidThemeCss(themeId: number, cssText: string) {
  memoryCache.set(themeId, cssText)
}

export function getCachedPaidThemeCss(themeId: number): string | null {
  return memoryCache.get(themeId) ?? null
}

export function injectPaidThemeCss(cssText: string) {
  if (typeof document === 'undefined') return
  let node = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!node) {
    node = document.createElement('style')
    node.id = STYLE_ID
    document.head.appendChild(node)
  }
  node.textContent = cssText
}

export function clearPaidThemeCss() {
  if (typeof document === 'undefined') return
  document.getElementById(STYLE_ID)?.remove()
}

export function clearPaidThemeCssCache() {
  memoryCache.clear()
}
