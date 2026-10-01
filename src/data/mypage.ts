import type { ThemeTone } from '@/components/theme/ThemeShot'
import type { Comment, FeedImage, PostCategory } from './feed'

export type PostVisibility = 'public' | 'subscribers'

export type MyPost = {
  id: string
  /** 백엔드 PostResponse.memberId */
  memberId?: number
  /** 수정 PUT 에 다시 보낸다 */
  categoryId?: number
  imageUrl?: string | null
  author: string
  avatar: string
  intro: string
  /** 메인 피드와 같은 상대 시간. 예: 3분 전 */
  time?: string
  category: PostCategory
  categoryLabel: string
  title: string
  body?: string
  images: FeedImage[]
  comments: number
  likes: number
  liked: boolean
  /** 로그인한 회원이 스크랩했는지 */
  scrapped?: boolean
  views: number
  visibility?: PostVisibility
  createdAt?: string
  thread?: Comment[]
}

export type OwnedTheme = {
  /** UI 키(팔레트 id). 서버 theme.id 와 다를 수 있다 */
  id: string
  /** 서버 테마 PK. styles API 호출에 사용 */
  themeId?: number
  name: string
  title: string
  subtitle: string
  tone: ThemeTone
  /** API 썸네일(없으면 ThemeShot 로컬 미리보기) */
  thumbnailUrl?: string | null
  active: boolean
}
