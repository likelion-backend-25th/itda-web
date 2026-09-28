import { resolveMemberImageUrl } from '@/api/member'
import { formatDateTime, type Comment } from '@/data/feed'
import { apiFetch, apiJson } from '@/lib/apiClient'
import type { ReplyCreateRequest, ReplyResponse, ReplyUpdateRequest } from '@/types/reply'

/** 게시글 댓글 목록. 서버가 돌려주는 순서를 그대로 쓴다. */
export function fetchReplies(postId: number): Promise<ReplyResponse[]> {
  return apiJson<ReplyResponse[]>(`/posts/${postId}/replies`)
}

/** 상세 화면 댓글 등록. POST /posts/{postId}/replies */
export function createReply(postId: number, body: ReplyCreateRequest): Promise<ReplyResponse> {
  return apiJson<ReplyResponse>(`/posts/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** 작성자만 수정. PUT /posts/{postId}/replies/{replyId} */
export function updateReply(
  postId: number,
  replyId: number,
  body: ReplyUpdateRequest,
): Promise<ReplyResponse> {
  return apiJson<ReplyResponse>(`/posts/${postId}/replies/${replyId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** 작성자 또는 ADMIN 삭제. 성공 응답에는 본문이 없을 수 있다. */
export async function deleteReply(postId: number, replyId: number): Promise<void> {
  await apiFetch(`/posts/${postId}/replies/${replyId}`, { method: 'DELETE' })
}

/** ReplyResponse → 상세 댓글. 닉네임·작성 시각은 응답 값을 쓴다. */
export function toFeedComment(dto: ReplyResponse): Comment {
  const created = new Date(dto.createdAt)
  const nickname = dto.nickname?.trim() ?? ''
  return {
    id: String(dto.id),
    memberId: dto.memberId,
    author: nickname || `회원 ${dto.memberId}`,
    avatar: resolveMemberImageUrl(dto.profileImage),
    createdAt: Number.isNaN(created.getTime()) ? dto.createdAt : formatDateTime(created),
    content: dto.content,
  }
}
