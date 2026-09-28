export function formatThemePrice(price: number) {
  if (price <= 0) return '무료'
  return `${price.toLocaleString('ko-KR')}원`
}

export const themesPerPage = 6

const OWNED_KEY = 'itda-owned-themes'

function readOwned(): Set<string> {
  try {
    const raw = localStorage.getItem(OWNED_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return new Set(parsed)
    }
  } catch {
    // 손상된 저장값은 버리고 빈 목록으로 시작한다
  }
  return new Set()
}

let owned = typeof localStorage === 'undefined' ? new Set<string>() : readOwned()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function writeOwned(next: Set<string>) {
  owned = next
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify([...owned]))
  } catch {
    // 저장에 실패해도 이번 세션의 보유 목록은 유지한다
  }
  emit()
}

export function subscribeOwnedThemes(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getOwnedThemeIds() {
  return owned
}

/** 서버 보유 목록으로 로컬 캐시를 통째로 맞춘다 */
export function syncOwnedThemes(themeKeys: Iterable<string>) {
  writeOwned(new Set(themeKeys))
}

/** 결제 직후 낙관적 UI용. 키는 themeCode */
export function setThemeOwned(themeKey: string) {
  if (owned.has(themeKey)) return
  const next = new Set(owned)
  next.add(themeKey)
  writeOwned(next)
}
