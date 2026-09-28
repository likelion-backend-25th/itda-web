/** 백엔드 PostResponse 와 필드명 일치 */
export interface PostResponse {
  id: number
  memberId: number
  nickname: string
  /** 작성자 프로필 프리사인 URL (없으면 null) */
  profileImage?: string | null
  categoryId: number
  categoryName: string
  content: string
  imageUrl: string | null
  replyCount: number
  likeCount: number
  viewCount: number
  subscriberOnly: boolean
  /** 로그인한 회원이 이 글을 좋아요했는지 */
  liked: boolean
  /** 로그인한 회원이 이 글을 스크랩했는지 */
  scrapped: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 백엔드 PostCreateRequest (@RequestPart "request").
 * 이미지는 MultipartFile 파트(imageUrl)로 별도 전송.
 */
export interface PostCreateRequest {
  categoryId: number
  content: string
  subscriberOnly: boolean
}

/** PostController.createPost 요청 묶음 */
export type CreatePostPayload = {
  request: PostCreateRequest
  image?: File | null
}

/** 백엔드 PostUpdateRequest (@RequestPart "request") */
export interface PostUpdateRequest {
  categoryId: number
  content: string
  subscriberOnly: boolean
}

/** PostController.updatePost 요청 묶음 */
export type UpdatePostPayload = {
  request: PostUpdateRequest
  image?: File | null
}

/** POST /posts/{id}/like 응답. 카운트 필드명은 likesCount */
export interface PostLikeResponse {
  liked: boolean
  likesCount: number
}

/** POST /posts/{id}/scrap 응답 */
export interface PostScrapResponse {
  scrapped: boolean
}

/** 백엔드 PostFeedResponse */
export interface PostFeedResponse {
  posts: PostResponse[]
  nextPublicCursor: number | null
  nextSubscribedCursor: number | null
  hasNext: boolean
}
