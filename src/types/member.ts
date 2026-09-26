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

/** GET /api/v1/member/followers — 나를 팔로우하는 사람 */
export interface FollowerResponse {
  id: number
  nickname: string
  profileImage: string | null
}
