/** 백엔드 MemberProfileResponse 와 필드명 일치 */
export interface MemberProfileResponse {
  id: number
  email: string
  nickname: string
  profileImage: string | null
  role: string
  introduction: string | null
  themeId: number
  createdAt: string
}

/** GET /api/v1/member/{id}/followers — 해당 회원을 팔로우하는 사람 */
export interface FollowerResponse {
  id: number
  nickname: string
  profileImage: string | null
}

/** GET /api/v1/member/{id}/followings — 해당 회원이 팔로우하는 사람 */
export interface FollowingResponse {
  id: number
  nickname: string
  profileImage: string | null
}
