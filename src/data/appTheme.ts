import { fetchOwnedThemeList, fetchThemeStyles } from '@/api/theme'
import { toneFromThemeCode } from '@/components/theme/ThemeShot'
import { ApiError } from '@/lib/apiClient'
import {
  cachePaidThemeCss,
  clearPaidThemeCss,
  clearPaidThemeCssCache,
  getCachedPaidThemeCss,
  injectPaidThemeCss,
} from '@/lib/themeStyles'

/** 화면 전체에 입히는 팔레트. 기본 light + DB 스타일 테마 */
export type AppThemeId =
  | 'light'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'dark'
  | 'lavender'
  | 'cream'
  | 'sky'
  | 'hidden'
  | 'watermelon'
  | 'skiper'

type AppliedTheme = {
  palette: AppThemeId
  /** 상점 테마 id. 새로고침 뒤에도 어떤 상품이 적용 중인지 구분한다 */
  themeId: number | null
}

const STORAGE_KEY = 'itda-applied-theme'
/** 번들에 CSS가 있는 팔레트는 light만. dark 포함 나머지는 styles API */
const FREE_THEMES = new Set<AppThemeId>(['light'])
const APP_THEMES: AppThemeId[] = [
  'light',
  'ocean',
  'sunset',
  'forest',
  'dark',
  'lavender',
  'cream',
  'sky',
  'hidden',
  'watermelon',
  'skiper',
]

function isAppThemeId(value: string): value is AppThemeId {
  return (APP_THEMES as string[]).includes(value)
}

export function isFreeAppTheme(palette: AppThemeId): boolean {
  return FREE_THEMES.has(palette)
}

/** themeCode를 화면 팔레트로 맞춘다. OCEAN, DEFAULT 같은 서버 코드도 포함한다 */
export function resolveAppTheme(themeCode: string): AppThemeId {
  const lower = themeCode.trim().toLowerCase()
  if (lower === 'default' || lower === 'basic' || lower === 'light') return 'light'
  if (lower === 'cream' || lower === 'cotton') return 'cream'
  if (lower === 'sky' || lower === 'skylight') return 'sky'
  if (lower === 'hidden' || lower === 'hide') return 'hidden'
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

let applied: AppliedTheme =
  typeof localStorage === 'undefined' ? { palette: 'light', themeId: null } : readStored()
const listeners = new Set<() => void>()
let applyGeneration = 0

function emit() {
  listeners.forEach((listener) => listener())
}

function paint(palette: AppThemeId) {
  if (typeof document === 'undefined') return
  if (palette === 'light') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = palette
  }
}

function persist(next: AppliedTheme) {
  applied = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applied))
  } catch {
    // 저장 실패해도 화면 반영은 유지
  }
  emit()
}

function fallbackToLight() {
  clearPaidThemeCss()
  clearPaidThemeCssCache()
  paint('light')
  persist({ palette: 'light', themeId: null })
}

/** 로그아웃·비로그인 시 테마/유료 CSS를 기본(light)으로 되돌린다 */
export function resetAppTheme() {
  applyGeneration += 1
  fallbackToLight()
}

/**
 * 로그인 후 서버에 적용 중인 테마로 화면을 맞춘다.
 * member/me.themeId 가 null 인 경우가 있어 owned 목록의 isApplied 를 우선한다.
 */
export async function syncAppliedThemeFromServer(): Promise<void> {
  const owned = await fetchOwnedThemeList(1, 50)
  const serverApplied = owned.content.find((theme) => theme.isApplied)
  if (!serverApplied) {
    resetAppTheme()
    return
  }
  await applyAppThemeAsync(serverApplied.themeCode, serverApplied.id)
}

export function subscribeAppTheme(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAppliedTheme(): AppliedTheme {
  return applied
}

async function ensurePaidCss(themeId: number): Promise<string> {
  const cached = getCachedPaidThemeCss(themeId)
  if (cached) return cached
  const styles = await fetchThemeStyles(themeId)
  cachePaidThemeCss(themeId, styles.cssText)
  return styles.cssText
}

/**
 * 테마 적용. 유료는 styles API로 CSS를 받은 뒤에만 data-theme 을 올린다.
 * themeId 없이 유료 팔레트만 넘기면 light로 폴백한다.
 */
export async function applyAppThemeAsync(
  themeCode: string,
  themeId: number | null = null,
): Promise<void> {
  const generation = ++applyGeneration
  const palette = resolveAppTheme(themeCode)

  if (isFreeAppTheme(palette)) {
    clearPaidThemeCss()
    paint(palette)
    if (applied.palette === palette && applied.themeId === themeId) {
      emit()
      return
    }
    persist({ palette, themeId })
    return
  }

  if (themeId == null || !Number.isInteger(themeId) || themeId <= 0) {
    fallbackToLight()
    throw new Error('유료 테마를 적용하려면 테마 id가 필요합니다.')
  }

  try {
    const cssText = await ensurePaidCss(themeId)
    if (generation !== applyGeneration) return
    injectPaidThemeCss(cssText)
    paint(palette)
    persist({ palette, themeId })
  } catch (error: unknown) {
    if (generation !== applyGeneration) return
    fallbackToLight()
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      throw error
    }
    throw error instanceof Error ? error : new Error('테마 스타일을 불러오지 못했습니다.')
  }
}

/** @deprecated 동기 호출용. 내부적으로 applyAppThemeAsync 를 시작한다. */
export function applyAppTheme(themeCode: string, themeId: number | null = null) {
  void applyAppThemeAsync(themeCode, themeId).catch(() => {
    // 호출부가 await 하지 않을 때 폴백은 applyAppThemeAsync 안에서 처리됨
  })
}

/**
 * 앱 부트 시 호출. 무료는 즉시 paint, 유료는 캐시/API 후 주입.
 * cssText는 localStorage에 두지 않는다.
 */
export function restoreAppTheme() {
  const { palette, themeId } = applied

  if (isFreeAppTheme(palette)) {
    clearPaidThemeCss()
    paint(palette)
    return
  }

  // 유료 CSS가 번들에 없으므로 먼저 light로 두고 비동기 복원
  paint('light')

  if (themeId == null || !Number.isInteger(themeId) || themeId <= 0) {
    fallbackToLight()
    return
  }

  void applyAppThemeAsync(palette, themeId).catch(() => {
    // 401/403/네트워크 → light 유지
  })
}
