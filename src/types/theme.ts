/** 백엔드 ThemeResponse */
export interface ThemeResponse {
  id: number
  themeName: string
  price: number
  thumbnailUrl: string | null
  themeCode: string
  isOwned: boolean
  isApplied: boolean
}

/** 백엔드 ThemeDetailResponse */
export interface ThemeDetailResponse extends ThemeResponse {
  description: string | null
  createdAt: string
  updatedAt: string
}

/** GET /api/v1/themes/{themeId}/styles — 보유 검증 후 CSS */
export interface ThemeStylesResponse {
  themeId: number
  themeCode: string
  cssText: string
}

export type { PageResponse } from '@/types/page'
