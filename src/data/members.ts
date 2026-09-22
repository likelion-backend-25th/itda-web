import { currentUser } from './feed'

export type MemberProfile = {
  id: string
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
    name: '지은',
    avatar: '/images/avatar-jieun.jpg',
    bio: '오늘도 좋은 하루, 좋은 사람들과 💙',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'minsu',
    name: '민수',
    avatar: '/images/avatar-minsu.jpg',
    bio: '운동과 건강한 하루를 기록합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'haneul',
    name: '하늘',
    avatar: '/images/avatar-haneul.jpg',
    bio: '카페와 골목 산책을 좋아합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'minseo',
    name: '민서',
    avatar: '/images/avatar-minseo.jpg',
    bio: '디저트와 홈베이킹을 좋아합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'dohyun',
    name: '도현',
    avatar: '/images/avatar-dohyun.jpg',
    bio: '책과 조용한 시간을 좋아합니다.',
    followers: 100,
    following: 100,
    posts: 100,
  },
  {
    id: 'cat',
    name: '하늘냥',
    avatar: '/images/avatar-cat.jpg',
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
