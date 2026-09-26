/** 백엔드 PostResponse 와 필드명 일치 */
export interface PostResponse {
  id: number
  memberId: number
  categoryId: number
  content: string
  imageUrl: string | null
  likeCount: number
  viewCount: number
  subscriberOnly: boolean
  createdAt: string
  updatedAt: string
}

/** 백엔드 PostFeedResponse */
export interface PostFeedResponse {
  posts: PostResponse[]
  nextPublicCursor: number | null
  nextSubscribedCursor: number | null
  hasNext: boolean
}
