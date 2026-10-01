import { fetchOwnedThemeList, fetchThemeStyles } from '@/api/theme'
import { ApiError } from '@/lib/apiClient'
import {
  cachePaidThemeCss,
  clearPaidThemeCss,
  clearPaidThemeCssCache,
  getCachedPaidThemeCss,
  injectPaidThemeCss,
} from '@/lib/themeStyles'

/**
 * data-theme 에 올라가는 값.
 * 기본(light)만 번들 CSS. 그 외는 서버 themeCode(소문자) + styles API css_text.
 * 관리자가 새 코드를 등록해도 FE 화이트리스트 없이 동작한다.
 */
export type AppThemeId = string

type AppliedTheme = {
  palette: AppThemeId
  /** 상점 테마 id. 새로고침 뒤에도 어떤 상품이 적용 중인지 구분한다 */
  themeId: number | null
}

const STORAGE_KEY = 'itda-applied-theme'

function normalizeThemeCode(themeCode: string): string {
  return themeCode.trim().toLowerCase()
}

/** 번들 기본 테마(css_text 없음). data-theme attribute 를 제거한다 */
export function isFreeThemeCode(themeCode: string): boolean {
  const code = normalizeThemeCode(themeCode)
  return code === '' || code === 'default' || code === 'basic' || code === 'light'
}

/** @deprecated isFreeThemeCode 사용 */
export function isFreeAppTheme(palette: AppThemeId): boolean {
  return isFreeThemeCode(palette)
}

/**
 * themeCode → data-theme / 비교용 키.
 * 별칭만 정규화하고, 그 외는 서버 코드를 소문자 그대로 쓴다.
 */
export function resolveAppTheme(themeCode: string): AppThemeId {
  const lower = normalizeThemeCode(themeCode)
  if (isFreeThemeCode(lower)) return 'light'
  if (lower === 'cream' || lower === 'cotton') return 'cream'
  if (lower === 'sky' || lower === 'skylight') return 'sky'
  if (lower === 'hidden' || lower === 'hide') return 'hidden'
  return lower
}

function readStored(): AppliedTheme {
  const fallback: AppliedTheme = { palette: 'light', themeId: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    // 예전 포맷: "ocean"
    if (typeof raw === 'string' && !raw.startsWith('{')) {
      const palette = resolveAppTheme(raw)
      return { palette, themeId: null }
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return fallback
    if (!('palette' in parsed) || typeof parsed.palette !== 'string') return fallback
    const palette = resolveAppTheme(parsed.palette)
    const themeId =
      'themeId' in parsed && typeof parsed.themeId === 'number' ? parsed.themeId : null
    return { palette, themeId }
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

/** 서버 themeCode(소문자)를 data-theme 에 올린다. css_text 셀렉터와 맞춰야 한다. */
function paint(palette: AppThemeId) {
  if (typeof document === 'undefined') return
  if (isFreeThemeCode(palette) || palette === 'light') {
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

async function ensurePaidCss(themeId: number): Promise<{ cssText: string; themeCode: string }> {
  const cached = getCachedPaidThemeCss(themeId)
  if (cached) {
    // 캐시에는 css만 있으므로 themeCode는 호출부 값을 쓴다
    return { cssText: cached, themeCode: '' }
  }
  const styles = await fetchThemeStyles(themeId)
  cachePaidThemeCss(themeId, styles.cssText)
  return { cssText: styles.cssText, themeCode: styles.themeCode }
}

/**
 * 테마 적용. 유료는 styles API로 CSS를 받은 뒤
 * 서버 themeCode(소문자)로 data-theme 을 올린다.
 */
export async function applyAppThemeAsync(
  themeCode: string,
  themeId: number | null = null,
): Promise<void> {
  const generation = ++applyGeneration

  if (isFreeThemeCode(themeCode)) {
    clearPaidThemeCss()
    paint('light')
    if (applied.palette === 'light' && applied.themeId === themeId) {
      emit()
      return
    }
    persist({ palette: 'light', themeId })
    return
  }

  if (themeId == null || !Number.isInteger(themeId) || themeId <= 0) {
    fallbackToLight()
    throw new Error('유료 테마를 적용하려면 테마 id가 필요합니다.')
  }

  try {
    const { cssText, themeCode: styleCode } = await ensurePaidCss(themeId)
    if (generation !== applyGeneration) return
    injectPaidThemeCss(cssText)
    // styles 응답 코드를 우선해 css_text 셀렉터와 맞춘다
    const attr = resolveAppTheme(styleCode || themeCode)
    paint(attr)
    persist({ palette: attr, themeId })
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

  if (isFreeThemeCode(palette)) {
    clearPaidThemeCss()
    paint('light')
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
