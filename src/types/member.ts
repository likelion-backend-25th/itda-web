/** 백엔드 MemberProfileResponse */
export interface MemberProfileResponse {
  id: number
  email: string
  nickname: string
  /** S3 객체 키 또는 절대 URL */
  profileImage: string | null
  role: string
  introduction: string | null
  themeId: number | null
  createdAt: string
  /** ACTIVE 정상, SUSPENDED 활동 정지 */
  status: string
  followerCount: number
  followingCount: number
  postCount: number
}

/** GET /api/v1/members/{id}/followers */
export interface FollowerResponse {
  id: number
  nickname: string
  profileImage: string | null
}

/** GET /api/v1/members/{id}/followings */
export interface FollowingResponse {
  id: number
  nickname: string
  profileImage: string | null
}
