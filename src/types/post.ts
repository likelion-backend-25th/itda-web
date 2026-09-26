/** 백엔드 PostResponse 와 필드명 일치 */
export interface PostResponse {
  id: number
  memberId: number
  nickname: string
  categoryId: number
  categoryName: string
  content: string
  imageUrl: string | null
  likeCount: number
  viewCount: number
  subscriberOnly: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 글쓰기 모달은 categoryName, content, imageUrl, subscriberOnly 만 받는다.
 * 작성·수정 시각은 DB DEFAULT 라서 보내지 않는다.
 */
export interface PostCreateRequest {
  id: number
  memberId: number
  nickname: string
  categoryId: number
  categoryName: string
  content: string
  imageUrl?: string
  likeCount: number
  viewCount: number
  subscriberOnly: boolean
}

/** 백엔드 PostUpdateRequest. imageUrl 은 선택 */
export interface PostUpdateRequest {
  categoryId: number
  content: string
  imageUrl?: string
  subscriberOnly: boolean
}

/** 백엔드 PostFeedResponse */
export interface PostFeedResponse {
  posts: PostResponse[]
  nextPublicCursor: number | null
  nextSubscribedCursor: number | null
  hasNext: boolean
}
