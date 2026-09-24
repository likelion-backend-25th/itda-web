import { apiJson, getApiOrigin } from '@/lib/apiClient'
import type { PageResponse, ThemeResponse } from '@/types/theme'

/** 백엔드 상대경로 썸네일을 절대 URL로 맞춘다 */
export function resolveThemeThumbnailUrl(thumbnailUrl: string | null | undefined): string | null {
  if (!thumbnailUrl || thumbnailUrl.trim() === '') return null
  if (/^https?:\/\//i.test(thumbnailUrl)) return thumbnailUrl

  const origin =
    getApiOrigin() ||
    (import.meta.env.DEV ? 'http://localhost:8080' : '')
  const path = thumbnailUrl.startsWith('/') ? thumbnailUrl : `/${thumbnailUrl}`
  return `${origin}${path}`
}

function normalizeTheme(theme: ThemeResponse): ThemeResponse {
  return {
    ...theme,
    thumbnailUrl: resolveThemeThumbnailUrl(theme.thumbnailUrl),
    isOwned: Boolean(theme.isOwned),
    isApplied: Boolean(theme.isApplied),
  }
}

/** 판매중 테마 목록. 비로그인: isOwned/isApplied false. 로그인(JWT): 보유·적용 반영. */
export function fetchThemeList(page = 1, size = 6): Promise<PageResponse<ThemeResponse>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  return apiJson<PageResponse<ThemeResponse>>(`/themes?${params}`).then((result) => ({
    ...result,
    content: result.content.map(normalizeTheme),
  }))
}
