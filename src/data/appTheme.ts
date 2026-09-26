import { toneFromThemeCode } from '@/components/theme/ThemeShot'

/** 화면 전체에 입히는 팔레트. 기본 라이트 + 구매 테마 */
export type AppThemeId = 'light' | 'ocean' | 'sunset' | 'forest' | 'dark' | 'lavender' | 'watermelon' | 'skiper'

type AppliedTheme = {
  palette: AppThemeId
  /** 상점 테마 id. 새로고침 뒤에도 어떤 상품이 적용 중인지 구분한다 */
  themeId: number | null
}

const STORAGE_KEY = 'itda-applied-theme'
const APP_THEMES: AppThemeId[] = ['light', 'ocean', 'sunset', 'forest', 'dark', 'lavender', 'watermelon', 'skiper']

function isAppThemeId(value: string): value is AppThemeId {
  return (APP_THEMES as string[]).includes(value)
}

/** themeCode를 화면 팔레트로 맞춘다. OCEAN, DEFAULT 같은 서버 코드도 포함한다 */
export function resolveAppTheme(themeCode: string): AppThemeId {
  const lower = themeCode.trim().toLowerCase()
  if (lower === 'default' || lower === 'basic' || lower === 'light') return 'light'
  if (isAppThemeId(lower)) return lower
  const tone = toneFromThemeCode(themeCode)
  if (tone === 'light') return 'light'
  if (isAppThemeId(tone)) return tone
  return 'light'
}

function readStored(): AppliedTheme {
  const fallback: AppliedTheme = { palette: 'light', themeId: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    if (isAppThemeId(raw)) return { palette: raw, themeId: null }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return fallback
    if (!('palette' in parsed) || typeof parsed.palette !== 'string' || !isAppThemeId(parsed.palette)) {
      return fallback
    }
    const themeId =
      'themeId' in parsed && typeof parsed.themeId === 'number' ? parsed.themeId : null
    return { palette: parsed.palette, themeId }
  } catch {
    return fallback
  }
}

let applied: AppliedTheme = typeof localStorage === 'undefined' ? { palette: 'light', themeId: null } : readStored()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function paint(palette: AppThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = palette
}

export function subscribeAppTheme(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAppliedTheme(): AppliedTheme {
  return applied
}

/** 구매·적용한 테마를 화면과 저장소에 반영한다 */
export function applyAppTheme(themeCode: string, themeId: number | null = null) {
  const palette = resolveAppTheme(themeCode)
  paint(palette)
  if (applied.palette === palette && applied.themeId === themeId) return
  applied = { palette, themeId }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applied))
  } catch {
    // 저장에 실패해도 이번 화면에는 테마를 입힌다
  }
  emit()
}

/** 첫 페인트 전에 마지막 테마를 되돌린다 */
export function restoreAppTheme() {
  paint(applied.palette)
}
