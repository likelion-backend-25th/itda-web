/** 백엔드 ThemeResponse 와 필드명 일치 */
export interface ThemeResponse {
  id: number
  themeName: string
  price: number
  thumbnailUrl: string | null
  themeCode: string
  isOwned: boolean
  isApplied: boolean
}

/** 백엔드 PageResponse 공통 래퍼 */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
