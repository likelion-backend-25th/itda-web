import { apiJson } from '@/lib/apiClient'
import type { FeedUser } from '@/data/feed'
import type { FollowerResponse, FollowingResponse, MemberProfileResponse } from '@/types/member'

export const DEFAULT_AVATAR = '/images/avatar-default.svg'

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** 응답 필드가 빠지거나 null이어도 UI가 깨지지 않게 정규화 */
export function normalizeMemberProfile(raw: unknown): MemberProfileResponse {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('프로필 응답 형식이 올바르지 않습니다.')
  }
  const record = raw as Record<string, unknown>
  const id = asNumber(record.id)
  if (id == null) throw new Error('프로필 id가 없습니다.')

  const email = typeof record.email === 'string' ? record.email : ''
  const nickname = typeof record.nickname === 'string' ? record.nickname : ''
  const role = typeof record.role === 'string' ? record.role : 'ROLE_USER'
  const createdAt = typeof record.createdAt === 'string' ? record.createdAt : ''

  return {
    id,
    email,
    nickname,
    profileImage: asOptionalString(record.profileImage),
    role,
    introduction: asOptionalString(record.introduction),
    themeId: asNumber(record.themeId),
    createdAt,
    status: typeof record.status === 'string' && record.status.trim() !== '' ? record.status : 'ACTIVE',
  }
}

function normalizeFollowMember(item: unknown): FollowerResponse | null {
  if (typeof item !== 'object' || item === null) return null
  const record = item as Record<string, unknown>
  const id = asNumber(record.id ?? record.Id)
  if (id == null) return null
  return {
    id,
    nickname: typeof record.nickname === 'string' ? record.nickname : '',
    profileImage: asOptionalString(record.profileImage),
  }
}

async function fetchFollowMembers(path: string): Promise<FollowerResponse[]> {
  const raw = await apiJson<unknown>(path)
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const normalized = normalizeFollowMember(item)
    return normalized ? [normalized] : []
  })
}

/** GET /api/v1/member/me */
export function fetchMyProfile(): Promise<MemberProfileResponse> {
  return apiJson<unknown>('/member/me').then(normalizeMemberProfile)
}

/** GET /api/v1/member/{memberId} */
export function fetchMemberProfile(memberId: number): Promise<MemberProfileResponse> {
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return Promise.reject(new Error('잘못된 회원 id입니다.'))
  }
  return apiJson<unknown>(`/member/${memberId}`).then(normalizeMemberProfile)
}

/** GET /api/v1/member/{id}/followers */
export function fetchFollowers(memberId: number): Promise<FollowerResponse[]> {
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return Promise.reject(new Error('잘못된 회원 id입니다.'))
  }
  return fetchFollowMembers(`/member/${memberId}/followers`)
}

/** GET /api/v1/member/{id}/followings */
export function fetchFollowings(memberId: number): Promise<FollowingResponse[]> {
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return Promise.reject(new Error('잘못된 회원 id입니다.'))
  }
  return fetchFollowMembers(`/member/${memberId}/followings`)
}

/**
 * 프로필 이미지 표시 URL
 * - https/data: 백엔드 프리사인드 URL 등 → 그대로 사용
 * - /images/...: 프론트 정적 기본 아바타
 * - S3 키(profile/...)만 오면 private 버킷이라 추측 URL을 만들지 않음
 *   (추측하면 403 → 깨진 이미지). 백엔드에서 프리사인 후 내려줘야 함.
 */
export function resolveMemberImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || imageUrl.trim() === '') return DEFAULT_AVATAR
  const trimmed = imageUrl.trim()

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('/images/')) return trimmed

  // 키만 남은 응답(팔로워 목록 등) — 잘못된 공개 URL 합성 금지
  return DEFAULT_AVATAR
}

/** API 프로필 → 피드/사이드바용 FeedUser */
export function toFeedUser(profile: MemberProfileResponse): FeedUser {
  const local = profile.email.includes('@') ? profile.email.split('@')[0] : profile.email || String(profile.id)
  return {
    name: profile.nickname || local,
    handle: `@${local}`,
    bio: profile.introduction?.trim() ? profile.introduction : '',
    avatar: resolveMemberImageUrl(profile.profileImage),
  }
}
