import { categories, formatDateTime, type CategoryId, type Post, type PostCategory } from '@/data/feed'
import { resolveMemberImageUrl } from '@/api/member'
import { apiFetch, apiJson, getApiOrigin } from '@/lib/apiClient'
import type { MemberProfileResponse } from '@/types/member'
import type {
  CreatePostPayload,
  PostFeedResponse,
  PostLikeResponse,
  PostResponse,
  PostScrapResponse,
  UpdatePostPayload,
} from '@/types/post'

const PAGE_SIZE = 5

/** 게시글 카테고리 common_code type 3. 1~4는 결제 상태라 쓰지 않는다. */
const CATEGORY_ID_BY_LABEL: Record<string, number> = {
  맛집: 8,
  여행: 9,
  운동: 10,
  독서: 11,
  음악: 12,
  요리: 13,
  공예: 14,
  그림: 15,
  게임: 16,
  기타: 17,
}

/** 글 등록·수정에 쓸 수 있는 게시글 카테고리인지 */
export function isPostCategoryLabel(label: string): boolean {
  return CATEGORY_ID_BY_LABEL[label] != null
}

function categoryFromName(name: string): PostCategory {
  const found = categories.find((item) => item.id !== 'all' && item.label === name)
  if (found && found.id !== 'all') return found.id
  return 'etc'
}

/** 사이드바 CategoryId → 피드 조회용 categoryId. 전체는 쿼리를 붙이지 않는다. */
export function categoryIdForFeed(category: CategoryId): number | undefined {
  if (category === 'all') return undefined
  const label = categories.find((item) => item.id === category)?.label
  if (!label) return undefined
  return CATEGORY_ID_BY_LABEL[label]
}

/** 취미 카테고리 이름 → 시드 id. */
export function categoryIdFromLabel(label: string): number {
  const mapped = CATEGORY_ID_BY_LABEL[label]
  if (mapped != null) return mapped
  throw new Error('선택한 카테고리는 서버에 없습니다.')
}

/** 이름을 유지하면 글의 categoryId, 바꾸면 시드 이름에 맞는 id */
export function categoryIdForUpdate(label: string, currentId: number | undefined, currentLabel: string): number {
  if (currentId != null && label === currentLabel) return currentId
  return categoryIdFromLabel(label)
}

export type PostFeedQuery = {
  publicCursor?: number | null
  subscribedCursor?: number | null
  categoryId?: number | null
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
 * 닉네임·카테고리명은 응답 값을 그대로 쓴다.
 */
export function toFeedPost(dto: PostResponse, viewer: MemberProfileResponse | null): Post {
  const mine = viewer != null && viewer.id === dto.memberId
  const image = resolvePostImageUrl(dto.imageUrl)
  const created = new Date(dto.createdAt)
  const updated = new Date(dto.updatedAt)
  const categoryName = dto.categoryName?.trim() ?? ''
  const nickname = dto.nickname?.trim() ?? ''

  return {
    id: String(dto.id),
    memberId: dto.memberId,
    categoryId: dto.categoryId,
    imageUrl: dto.imageUrl,
    author: nickname || (mine && viewer ? viewer.nickname : `회원 ${dto.memberId}`),
    // 작성자 아바타: 게시글 응답의 프리사인 URL 우선, 내 글이면 /me 프로필로 보강
    avatar: resolveMemberImageUrl(
      dto.profileImage ?? (mine && viewer ? viewer.profileImage : null),
    ),
    time: formatRelativeTime(dto.createdAt),
    category: categoryFromName(categoryName),
    categoryLabel: categoryName,
    isMe: mine,
    content: dto.content,
    images: image ? [{ src: image, alt: '게시글 이미지' }] : [],
    createdAt: Number.isNaN(created.getTime()) ? dto.createdAt : formatDateTime(created),
    updatedAt: Number.isNaN(updated.getTime()) ? dto.updatedAt : formatDateTime(updated),
    comments: dto.replyCount ?? 0,
    likes: dto.likeCount,
    liked: dto.liked === true,
    views: dto.viewCount,
    bookmarked: dto.scrapped === true,
    visibility: dto.subscriberOnly ? 'subscribers' : 'public',
    thread: [],
  }
}

/** 메인 피드. publicCursor / subscribedCursor 로 다음 페이지를 받는다. */
export function fetchPosts(query: PostFeedQuery = {}): Promise<PostFeedResponse> {
  const params = new URLSearchParams()
  if (query.publicCursor != null) params.set('publicCursor', String(query.publicCursor))
  if (query.subscribedCursor != null) params.set('subscribedCursor', String(query.subscribedCursor))
  if (query.categoryId != null) params.set('categoryId', String(query.categoryId))
  params.set('size', String(query.size ?? PAGE_SIZE))
  return apiJson<PostFeedResponse>(`/posts?${params}`)
}

/**
 * 게시글 등록.
 * @RequestPart("request") JSON + @RequestPart("imageUrl") MultipartFile?
 */
export async function createPost({ request, image }: CreatePostPayload): Promise<PostResponse> {
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  if (image && image.size > 0) {
    form.append('imageUrl', image, image.name || 'post.png')
  }
  return apiJson<PostResponse>('/posts', {
    method: 'POST',
    body: form,
  })
}

/** 게시글 단건. 상세를 열 때 최신 조회수·본문을 다시 받는다. */
export function fetchPostById(id: number): Promise<PostResponse> {
  return apiJson<PostResponse>(`/posts/${id}`)
}

/** 게시글 삭제. 성공 응답에는 본문이 없다. */
export async function deletePost(id: number): Promise<void> {
  await apiFetch(`/posts/${id}`, { method: 'DELETE' })
}

/** 좋아요 토글. 다시 누르면 취소되고 likesCount 가 줄어든다. */
export function togglePostLike(id: number): Promise<PostLikeResponse> {
  return apiJson<PostLikeResponse>(`/posts/${id}/like`, { method: 'POST' })
}

/** 스크랩 토글. 다시 누르면 해제된다. */
export function togglePostScrap(id: number): Promise<PostScrapResponse> {
  return apiJson<PostScrapResponse>(`/posts/${id}/scrap`, { method: 'POST' })
}

/**
 * 게시글 수정.
 * @RequestPart("request") JSON + @RequestPart("imageUrl") MultipartFile?
 * 새 파일이 없으면 백엔드가 기존 이미지를 유지한다.
 */
export async function updatePost(
  id: number,
  { request, image }: UpdatePostPayload,
): Promise<PostResponse> {
  const form = new FormData()
  form.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }))
  if (image && image.size > 0) {
    form.append('imageUrl', image, image.name || 'post.png')
  }
  return apiJson<PostResponse>(`/posts/${id}`, {
    method: 'PUT',
    body: form,
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
