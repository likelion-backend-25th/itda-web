/** 백엔드 ReplyCreateRequest */
export interface ReplyCreateRequest {
  content: string
}

/** 백엔드 ReplyResponse */
export interface ReplyResponse {
  id: number
  memberId: number
  nickname: string
  profileImage: string | null
  postId: number
  content: string
  createdAt: string
  updatedAt: string
}
