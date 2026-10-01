import type { Location, NavigateFunction } from 'react-router'

/** 공유·직접 진입용 게시글 상세 경로 */
export function postPath(postId: string | number): string {
  return `/posts/${postId}`
}

/** 피드 위에 모달을 띄울 때 location.state 에 넣는 값 */
export type PostModalState = {
  backgroundLocation: Location
}

/** 현재 화면을 유지한 채 /posts/:id 로 이동해 상세 모달을 연다 */
export function openPostDetail(
  navigate: NavigateFunction,
  location: Location,
  postId: string | number,
) {
  navigate(postPath(postId), {
    state: { backgroundLocation: location } satisfies PostModalState,
  })
}

export type CategoryId =
  | 'all'
  | 'food'
  | 'travel'
  | 'workout'
  | 'reading'
  | 'cooking'
  | 'music'
  | 'craft'
  | 'drawing'
  | 'game'
  | 'etc'

export type PostCategory = Exclude<CategoryId, 'all'>

export type FeedImage = {
  src: string
  alt: string
}

export type Comment = {
  id: string
  /** 백엔드 ReplyResponse.memberId */
  memberId?: number
  author: string
  avatar: string
  createdAt: string
  content: string
}

export type Post = {
  id: string
  /** 백엔드 PostResponse.memberId */
  memberId?: number
  /** 백엔드 PostResponse.categoryId. 수정 PUT 에 다시 보낸다 */
  categoryId?: number
  /** 서버에 저장된 원본 이미지 경로. 화면용 절대 URL 과 구분한다 */
  imageUrl?: string | null
  author: string
  avatar: string
  time: string
  category: PostCategory
  categoryLabel: string
  isMe?: boolean
  content: string
  images: FeedImage[]
  createdAt: string
  /** 백엔드 PostResponse.updatedAt. 상세에서만 표시 */
  updatedAt?: string
  comments: number
  likes: number
  liked: boolean
  views: number
  bookmarked: boolean
  visibility?: 'public' | 'subscribers'
  thread: Comment[]
}

export function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}. ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export type FeedUser = {
  name: string
  handle: string
  bio: string
  avatar: string
}

export const categories: { id: CategoryId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'food', label: '맛집' },
  { id: 'travel', label: '여행' },
  { id: 'workout', label: '운동' },
  { id: 'reading', label: '독서' },
  { id: 'music', label: '음악' },
  { id: 'cooking', label: '요리' },
  { id: 'craft', label: '공예' },
  { id: 'drawing', label: '그림' },
  { id: 'game', label: '게임' },
  { id: 'etc', label: '기타' },
]

export const myPageCategories: { id: CategoryId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'food', label: '맛집' },
  { id: 'travel', label: '여행' },
  { id: 'workout', label: '운동' },
  { id: 'reading', label: '독서' },
  { id: 'music', label: '음악' },
  { id: 'cooking', label: '요리' },
  { id: 'craft', label: '공예' },
  { id: 'drawing', label: '그림' },
  { id: 'game', label: '게임' },
  { id: 'etc', label: '기타' },
]
