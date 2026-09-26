import { categories, formatDateTime, type Post, type PostCategory } from '@/data/feed'
import { apiFetch, apiJson, getApiOrigin } from '@/lib/apiClient'
import type { MemberProfileResponse } from '@/types/member'
import type { PostFeedResponse, PostResponse, PostUpdateRequest } from '@/types/post'

const DEFAULT_AVATAR = '/images/avatar-jieun.jpg'
const PAGE_SIZE = 5

/** 수정 시 카테고리를 바꿀 때 쓰는 취미 카테고리 시드 id. 이름은 응답의 categoryName 을 따른다. */
const CATEGORY_ID_BY_LABEL: Record<string, number> = {
  독서: 8,
  음악: 9,
  요리: 10,
  공예: 11,
  쥬얼리: 12,
  그림: 13,
  기타: 14,
}

function categoryFromName(name: string): PostCategory {
  const found = categories.find((item) => item.id !== 'all' && item.label === name)
  if (found && found.id !== 'all') return found.id
  return 'etc'
}

/** 이름을 유지하면 글의 categoryId, 바꾸면 시드 이름에 맞는 id */
export function categoryIdForUpdate(label: string, currentId: number | undefined, currentLabel: string): number {
  if (currentId != null && label === currentLabel) return currentId
  const mapped = CATEGORY_ID_BY_LABEL[label]
  if (mapped != null) return mapped
  throw new Error('선택한 카테고리는 서버에서 수정할 수 없습니다.')
}

export type PostFeedQuery = {
  publicCursor?: number | null
  subscribedCursor?: number | null
  size?: number
}

/** 백엔드 상대 경로 이미지를 절대 URL로 맞춘다 */
export function resolvePostImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === '') return null
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl

  const origin =
    getApiOrigin() ||
    (import.meta.env.DEV ? 'http://localhost:8080' : '')
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return `${origin}${path}`
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return formatDateTime(date)
}

/**
 * PostResponse → 피드 카드용 Post.
 * 응답에 닉네임이 없어, 본인 글만 프로필 닉네임을 쓰고 나머지는 회원 번호로 표시한다.
 * 카테고리명은 백엔드 categoryName 을 그대로 쓴다.
 */
export function toFeedPost(dto: PostResponse, viewer: MemberProfileResponse | null): Post {
  const mine = viewer != null && viewer.id === dto.memberId
  const image = resolvePostImageUrl(dto.imageUrl)
  const created = new Date(dto.createdAt)

  return {
    id: String(dto.id),
    memberId: dto.memberId,
    categoryId: dto.categoryId,
    imageUrl: dto.imageUrl,
    author: mine ? viewer.nickname : `회원 ${dto.memberId}`,
    avatar:
      mine && viewer.profileImage?.trim()
        ? viewer.profileImage
        : DEFAULT_AVATAR,
    time: formatRelativeTime(dto.createdAt),
    category: categoryFromName(dto.categoryName.trim()),
    categoryLabel: dto.categoryName.trim(),
    isMe: mine,
    content: dto.content,
    images: image ? [{ src: image, alt: '게시글 이미지' }] : [],
    createdAt: Number.isNaN(created.getTime()) ? dto.createdAt : formatDateTime(created),
    comments: 0,
    likes: dto.likeCount,
    liked: false,
    views: dto.viewCount,
    bookmarked: false,
    visibility: dto.subscriberOnly ? 'subscribers' : 'public',
    thread: [],
  }
}

/** 메인 피드. publicCursor / subscribedCursor 로 다음 페이지를 받는다. */
export function fetchPosts(query: PostFeedQuery = {}): Promise<PostFeedResponse> {
  const params = new URLSearchParams()
  if (query.publicCursor != null) params.set('publicCursor', String(query.publicCursor))
  if (query.subscribedCursor != null) params.set('subscribedCursor', String(query.subscribedCursor))
  params.set('size', String(query.size ?? PAGE_SIZE))
  return apiJson<PostFeedResponse>(`/posts?${params}`)
}

/** 게시글 단건. 상세를 열 때 최신 조회수·본문을 다시 받는다. */
export function fetchPostById(id: number): Promise<PostResponse> {
  return apiJson<PostResponse>(`/posts/${id}`)
}

/** 게시글 삭제. 성공 응답에는 본문이 없다. */
export async function deletePost(id: number): Promise<void> {
  await apiFetch(`/posts/${id}`, { method: 'DELETE' })
}

/** 게시글 수정. 응답으로 최신 본문·카테고리명을 다시 받는다. */
export function updatePost(id: number, body: PostUpdateRequest): Promise<PostResponse> {
  return apiJson<PostResponse>(`/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** 화면의 첫 이미지가 서버 원본이면 그 경로를, 새 URL이면 그 값을 보낸다. */
export function imageUrlForUpdate(
  images: { src: string }[],
  original: string | null | undefined,
): string | undefined {
  const src = images[0]?.src
  if (!src || src.startsWith('data:')) return original?.trim() ? original : undefined
  if (original && (src === original || src === resolvePostImageUrl(original))) return original
  return src
}
