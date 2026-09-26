import { formatDateTime, type Post } from '@/data/feed'
import { apiJson, getApiOrigin } from '@/lib/apiClient'
import type { MemberProfileResponse } from '@/types/member'
import type { PostFeedResponse, PostResponse } from '@/types/post'

const DEFAULT_AVATAR = '/images/avatar-jieun.jpg'
const PAGE_SIZE = 5

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
 * 응답에 닉네임·카테고리명이 없어, 본인 글만 프로필 닉네임을 쓰고 나머지는 회원 번호로 표시한다.
 */
export function toFeedPost(dto: PostResponse, viewer: MemberProfileResponse | null): Post {
  const mine = viewer != null && viewer.id === dto.memberId
  const image = resolvePostImageUrl(dto.imageUrl)
  const created = new Date(dto.createdAt)

  return {
    id: String(dto.id),
    memberId: dto.memberId,
    author: mine ? viewer.nickname : `회원 ${dto.memberId}`,
    avatar:
      mine && viewer.profileImage?.trim()
        ? viewer.profileImage
        : DEFAULT_AVATAR,
    time: formatRelativeTime(dto.createdAt),
    category: 'etc',
    categoryLabel: `카테고리 ${dto.categoryId}`,
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
