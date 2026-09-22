import { apiJson } from '@/lib/apiClient'
import type { MemberProfileResponse } from '@/types/member'
import type { FeedUser } from '@/data/feed'

const DEFAULT_AVATAR = '/images/avatar-jieun.jpg'

export function fetchMyProfile(): Promise<MemberProfileResponse> {
  return apiJson<MemberProfileResponse>('/member/me')
}

/** API 프로필 → 피드 UI용 FeedUser */
export function toFeedUser(profile: MemberProfileResponse): FeedUser {
  const local = profile.email.includes('@') ? profile.email.split('@')[0] : profile.email
  return {
    name: profile.nickname,
    handle: `@${local}`,
    bio: profile.introduction?.trim() ? profile.introduction : '',
    avatar: profile.profileImage?.trim() ? profile.profileImage : DEFAULT_AVATAR,
  }
}
