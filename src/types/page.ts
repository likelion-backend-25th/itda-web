/** 백엔드 net.likelion.bebc25.itda.dto.PageResponse */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
