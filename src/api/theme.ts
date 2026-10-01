import { apiJson, getApiOrigin } from '@/lib/apiClient'
import type { PageResponse, ThemeDetailResponse, ThemeResponse, ThemeStylesResponse } from '@/types/theme'

const S3_PUBLIC_BASE =
  import.meta.env.VITE_S3_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
  'https://itda-sns-s3.s3.ap-northeast-2.amazonaws.com'

/** 썸네일 상대경로/S3키 → 브라우저에서 열 수 있는 URL */
export function resolveThemeThumbnailUrl(thumbnailUrl: string | null | undefined): string | null {
  if (!thumbnailUrl || thumbnailUrl.trim() === '') return null
  const trimmed = thumbnailUrl.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  // 프론트/백엔드 static (예: /images/themes/default.png)
  if (trimmed.startsWith('/images/')) return trimmed

  // S3 키 (예: theme/1/thumbnail.webp)
  if (!trimmed.startsWith('/') && !trimmed.startsWith('images/')) {
    return `${S3_PUBLIC_BASE}/${trimmed.replace(/^\//, '')}`
  }

  const origin = getApiOrigin() || (import.meta.env.DEV ? 'http://localhost:8080' : '')
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return origin ? `${origin}${path}` : path
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeTheme(raw: unknown): ThemeResponse | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  const id = asNumber(record.id)
  if (id == null) return null

  return {
    id,
    themeName: typeof record.themeName === 'string' ? record.themeName : '',
    price: asNumber(record.price) ?? 0,
    thumbnailUrl: resolveThemeThumbnailUrl(asOptionalString(record.thumbnailUrl)),
    themeCode: typeof record.themeCode === 'string' ? record.themeCode : '',
    isOwned: Boolean(record.isOwned),
    isApplied: Boolean(record.isApplied),
  }
}

function normalizeThemeDetail(raw: unknown): ThemeDetailResponse {
  const base = normalizeTheme(raw)
  if (!base) throw new Error('테마 상세 응답 형식이 올바르지 않습니다.')
  const record = raw as Record<string, unknown>
  return {
    ...base,
    description: asOptionalString(record.description),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
  }
}

function normalizePage(raw: unknown): PageResponse<ThemeResponse> {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('테마 목록 응답 형식이 올바르지 않습니다.')
  }
  const record = raw as Record<string, unknown>
  const contentRaw = Array.isArray(record.content) ? record.content : []
  const content = contentRaw.flatMap((item) => {
    const theme = normalizeTheme(item)
    return theme ? [theme] : []
  })

  return {
    content,
    page: asNumber(record.page) ?? 1,
    size: asNumber(record.size) ?? content.length,
    totalElements: asNumber(record.totalElements) ?? content.length,
    totalPages: Math.max(1, asNumber(record.totalPages) ?? 1),
  }
}

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label}이(가) 올바르지 않습니다.`)
  }
}

/** GET /api/v1/themes — 판매중 테마 목록 (비로그인 가능). keyword면 이름·코드 전체 검색 */
export function fetchThemeList(
  page = 1,
  size = 6,
  keyword?: string,
): Promise<PageResponse<ThemeResponse>> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1
  const safeSize = Number.isFinite(size) && size >= 1 ? Math.floor(size) : 6
  const params = new URLSearchParams({
    page: String(safePage),
    size: String(safeSize),
  })
  const trimmed = keyword?.trim() ?? ''
  if (trimmed) params.set('keyword', trimmed)
  return apiJson<unknown>(`/themes?${params}`).then(normalizePage)
}

/** GET /api/v1/themes/{themeId} — 테마 상세 */
export function fetchThemeDetail(themeId: number): Promise<ThemeDetailResponse> {
  assertPositiveInt(themeId, '테마 id')
  return apiJson<unknown>(`/themes/${themeId}`).then(normalizeThemeDetail)
}

/** GET /api/v1/themes/owned — 내 보유 테마 (인증 필요) */
export function fetchOwnedThemeList(page = 1, size = 6): Promise<PageResponse<ThemeResponse>> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1
  const safeSize = Number.isFinite(size) && size >= 1 ? Math.floor(size) : 6
  const params = new URLSearchParams({
    page: String(safePage),
    size: String(safeSize),
  })
  return apiJson<unknown>(`/themes/owned?${params}`).then(normalizePage)
}

function normalizeThemeStyles(raw: unknown): ThemeStylesResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('테마 스타일 응답 형식이 올바르지 않습니다.')
  }
  const record = raw as Record<string, unknown>
  const themeId = asNumber(record.themeId)
  const themeCode = typeof record.themeCode === 'string' ? record.themeCode.trim() : ''
  const cssText = typeof record.cssText === 'string' ? record.cssText.trim() : ''
  if (themeId == null || themeCode === '' || cssText === '') {
    throw new Error('테마 스타일 응답이 비어 있습니다.')
  }
  return { themeId, themeCode, cssText }
}

/** GET /api/v1/themes/{themeId}/styles — 보유·기본 테마만 CSS 반환 (인증 필요) */
export function fetchThemeStyles(themeId: number): Promise<ThemeStylesResponse> {
  assertPositiveInt(themeId, '테마 id')
  return apiJson<unknown>(`/themes/${themeId}/styles`).then(normalizeThemeStyles)
}

/** POST /api/v1/themes/{themeId}/apply — member.theme_id 저장 (+ is_used sticky) */
export function applyTheme(themeId: number): Promise<ThemeDetailResponse> {
  assertPositiveInt(themeId, '테마 id')
  return apiJson<unknown>(`/themes/${themeId}/apply`, { method: 'POST' }).then(normalizeThemeDetail)
}

/** POST /api/v1/themes/{themeId}/claim — 0원 테마 무료 수령 (PortOne 우회) */
export function claimFreeTheme(themeId: number): Promise<ThemeDetailResponse> {
  assertPositiveInt(themeId, '테마 id')
  return apiJson<unknown>(`/themes/${themeId}/claim`, { method: 'POST' }).then(normalizeThemeDetail)
}
