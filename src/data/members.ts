export type MemberProfile = {
  id: string
  /** 백엔드 member.id. 결제 prepare의 targetId로 사용 */
  backendId: number
  name: string
  avatar: string
  bio: string
  followers: number
  following: number
  posts: number
}

/** 게시글·댓글 작성자. 백엔드 memberId가 있으면 /member/{id} 로 간다 */
export function profileHrefForMember(
  memberId: number | undefined,
  _name: string,
  viewerMemberId?: number,
): string | null {
  if (memberId != null && Number.isInteger(memberId) && memberId > 0) {
    if (viewerMemberId != null && memberId === viewerMemberId) return '/mypage'
    return `/member/${memberId}`
  }
  return null
}
