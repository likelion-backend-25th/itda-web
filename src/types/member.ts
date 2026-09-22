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
