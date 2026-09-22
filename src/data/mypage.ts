import type { FeedImage, PostCategory } from './feed'

export type PostVisibility = 'public' | 'subscribers'

export type MyPost = {
  id: string
  author: string
  avatar: string
  intro: string
  category: PostCategory
  categoryLabel: string
  title: string
  body?: string
  images: FeedImage[]
  comments: number
  likes: number
  liked: boolean
  views: number
  visibility?: PostVisibility
}

export type OwnedTheme = {
  id: string
  name: string
  title: string
  subtitle: string
  tone: 'light' | 'dark'
  active: boolean
}

const intro = '소개글 : 오늘도 좋은 하루, 좋은 사람들과.'

export const profileStats = {
  followers: 100,
  following: 100,
  posts: 100,
}

export const myPosts: MyPost[] = [
  {
    id: 'my-jeju',
    author: '지은',
    avatar: '/images/avatar-jieun.jpg',
    intro,
    category: 'travel',
    categoryLabel: '여행',
    title: '주말에 다녀온 제주도 여행!',
    body: '푸른 바다와 노란 유채꽃',
    images: [
      { src: '/images/photo-cliff.jpg', alt: '바다와 맞닿은 해안 절벽' },
      { src: '/images/photo-field.jpg', alt: '노란 빛이 감도는 들판' },
    ],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
  },
  {
    id: 'my-cafe',
    author: '지은',
    avatar: '/images/avatar-jieun.jpg',
    intro,
    category: 'cooking',
    categoryLabel: '요리',
    title: '집에서 즐기는 홈카페',
    images: [{ src: '/images/photo-home-cafe-2.jpg', alt: '커피와 빵이 놓인 나무 테이블' }],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
  },
]

export const likedPosts: MyPost[] = [
  {
    id: 'liked-workout',
    author: '민수',
    avatar: '/images/avatar-minsu.jpg',
    intro: '소개글 : 오늘도 운동 완료.',
    category: 'workout',
    categoryLabel: '운동',
    title: '오늘도 운동 완료!',
    body: '꾸준히 하니까 조금씩 몸이 변하는 게 느껴져요.',
    images: [{ src: '/images/photo-gym.jpg', alt: '헬스장에서 운동하는 모습' }],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
  },
]

export const scrappedPosts: MyPost[] = [
  {
    id: 'scrap-cafe',
    author: '하늘',
    avatar: '/images/avatar-haneul.jpg',
    intro: '소개글 : 주말엔 카페 탐방.',
    category: 'food',
    categoryLabel: '맛집',
    title: '서촌에 있는 작은 카페',
    body: '분위기도 좋고 커피도 정말 맛있었어요.',
    images: [{ src: '/images/photo-cafe.jpg', alt: '카페 커피' }],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
  },
]

export const ownedThemes: OwnedTheme[] = [
  {
    id: 'light',
    name: '기본 라이트',
    title: '라이트모드',
    subtitle: '기본 라이트 모드',
    tone: 'light',
    active: true,
  },
  {
    id: 'dark',
    name: '기본 다크',
    title: '다크모드',
    subtitle: '기본 다크 모드',
    tone: 'dark',
    active: false,
  },
]

export const pageProfile = {
  name: '하늘님',
  handle: '@haneul',
  bio: '소개글 - 카페 디저트와 사진을 좋아합니다.',
  avatar: '/images/avatar-minseo.jpg',
}
