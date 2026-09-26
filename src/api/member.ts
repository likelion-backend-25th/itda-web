import { apiJson, getApiOrigin } from '@/lib/apiClient'
import type { FeedUser } from '@/data/feed'
import type { FollowerResponse, MemberProfileResponse } from '@/types/member'

const DEFAULT_AVATAR = '/images/avatar-jieun.jpg'

export function fetchMyProfile(): Promise<MemberProfileResponse> {
  return apiJson<MemberProfileResponse>('/member/me')
}

/**
 * GET /api/v1/member/followers
 * 현재 로그인한 회원을 팔로우하는 사람 목록.
 * OpenAPI 스키마가 Id(대문자)로 올 수 있어 정규화한다.
 */
export async function fetchMyFollowers(): Promise<FollowerResponse[]> {
  const raw = await apiJson<unknown>('/member/followers')
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const normalized = normalizeFollower(item)
    return normalized ? [normalized] : []
  })
}

function normalizeFollower(item: unknown): FollowerResponse | null {
  if (typeof item !== 'object' || item === null) return null
  const record = item as Record<string, unknown>
  const idRaw = record.id ?? record.Id
  const id = typeof idRaw === 'number' ? idRaw : typeof idRaw === 'string' ? Number(idRaw) : NaN
  if (!Number.isFinite(id)) return null
  const nickname = typeof record.nickname === 'string' ? record.nickname : ''
  const profileImage =
    typeof record.profileImage === 'string' && record.profileImage.trim() !== ''
      ? record.profileImage
      : null
  return { id, nickname, profileImage }
}

/** 상대 경로 프로필 이미지를 절대 URL로 */
export function resolveMemberImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '') return DEFAULT_AVATAR
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('/')) {
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('/images/')) {
      const origin = getApiOrigin() || (import.meta.env.DEV ? 'http://localhost:8080' : '')
      return `${origin}${imageUrl}`
    }
    return imageUrl
  }
  const origin = getApiOrigin() || (import.meta.env.DEV ? 'http://localhost:8080' : '')
  return `${origin}/${imageUrl}`
}

/** API 프로필 → 피드 UI용 FeedUser */
export function toFeedUser(profile: MemberProfileResponse): FeedUser {
  const local = profile.email.includes('@') ? profile.email.split('@')[0] : profile.email
  return {
    name: profile.nickname,
    handle: `@${local}`,
    bio: profile.introduction?.trim() ? profile.introduction : '',
    avatar: resolveMemberImageUrl(profile.profileImage),
  }
}
