import { resolveMemberImageUrl } from '@/api/member'
import { formatDateTime, type Comment } from '@/data/feed'
import { apiJson } from '@/lib/apiClient'
import type { ReplyCreateRequest, ReplyResponse } from '@/types/reply'

/** 상세 화면 댓글 등록. POST /posts/{postId}/replies */
export function createReply(postId: number, body: ReplyCreateRequest): Promise<ReplyResponse> {
  return apiJson<ReplyResponse>(`/posts/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** ReplyResponse → 상세 댓글. 닉네임·작성 시각은 응답 값을 쓴다. */
export function toFeedComment(dto: ReplyResponse): Comment {
  const created = new Date(dto.createdAt)
  const nickname = dto.nickname?.trim() ?? ''
  return {
    id: String(dto.id),
    author: nickname || `회원 ${dto.memberId}`,
    avatar: resolveMemberImageUrl(dto.profileImage),
    createdAt: Number.isNaN(created.getTime()) ? dto.createdAt : formatDateTime(created),
    content: dto.content,
  }
}
