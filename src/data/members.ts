import { currentUser } from './feed'

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

export const members: MemberProfile[] = [
  {
    id: 'jieun',
    backendId: 1,
    name: '지은',
    avatar: '/images/avatar-default.svg',
    bio: '오늘도 좋은 하루, 좋은 사람들과 💙',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'minsu',
    backendId: 2,
    name: '민수',
    avatar: '/images/avatar-default.svg',
    bio: '운동과 건강한 하루를 기록합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'haneul',
    backendId: 3,
    name: '하늘',
    avatar: '/images/avatar-default.svg',
    bio: '카페와 골목 산책을 좋아합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'minseo',
    backendId: 4,
    name: '민서',
    avatar: '/images/avatar-default.svg',
    bio: '디저트와 홈베이킹을 좋아합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'dohyun',
    backendId: 3,
    name: '도현',
    avatar: '/images/avatar-default.svg',
    bio: '책과 조용한 시간을 좋아합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'cat',
    backendId: 2,
    name: '하늘냥',
    avatar: '/images/avatar-default.svg',
    bio: '맛있는 걸 보면 참을 수 없어요.',
    followers: 100,
    following: 100,
    posts: 100,
  },
]

export function memberById(id: string) {
  return members.find((member) => member.id === id)
}

export function profilePath(name: string) {
  if (name === currentUser.name) return '/mypage'
  const member = members.find((item) => item.name === name)
  return member ? `/member/${member.id}` : null
}

/** 게시글·댓글 작성자. 백엔드 memberId가 있으면 /member/{id} 로 간다 */
export function profileHrefForMember(
  memberId: number | undefined,
  name: string,
  viewerMemberId?: number,
): string | null {
  if (memberId != null && Number.isInteger(memberId) && memberId > 0) {
    if (viewerMemberId != null && memberId === viewerMemberId) return '/mypage'
    return `/member/${memberId}`
  }
  return profilePath(name)
}

/** 목 데이터 id → FollowList 표시용 */
export function followListItemsFromIds(ids: string[]) {
  return ids.flatMap((id) => {
    const member = memberById(id)
    if (!member) return []
    return [
      {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        href: profilePath(member.name),
      },
    ]
  })
}
