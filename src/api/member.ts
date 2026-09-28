import { apiJson, getApiOrigin } from '@/lib/apiClient'
import type { FeedUser } from '@/data/feed'
import type { FollowerResponse, FollowingResponse, MemberProfileResponse } from '@/types/member'

export const DEFAULT_AVATAR = '/images/avatar-jieun.jpg'

export function fetchMyProfile(): Promise<MemberProfileResponse> {
  return apiJson<MemberProfileResponse>('/member/me')
}

/** GET /api/v1/member/{id}/followers — 해당 회원을 팔로우하는 사람 목록 (인증 필요) */
export async function fetchFollowers(memberId: number): Promise<FollowerResponse[]> {
  return fetchFollowMembers(`/member/${memberId}/followers`)
}

/** GET /api/v1/member/{id}/followings — 해당 회원이 팔로우하는 사람 목록 (인증 필요) */
export async function fetchFollowings(memberId: number): Promise<FollowingResponse[]> {
  return fetchFollowMembers(`/member/${memberId}/followings`)
}

async function fetchFollowMembers(path: string): Promise<FollowerResponse[]> {
  const raw = await apiJson<unknown>(path)
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const normalized = normalizeFollowMember(item)
    return normalized ? [normalized] : []
  })
}

function normalizeFollowMember(item: unknown): FollowerResponse | null {
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
