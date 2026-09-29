import { toFeedPost } from '@/api/post'
import type { MyPost } from '@/data/mypage'
import { apiJson } from '@/lib/apiClient'
import type { MemberProfileResponse } from '@/types/member'
import type { PostResponse } from '@/types/post'

/** GET /mypage/posts|likes|scraps. 백엔드 필드명은 hadNext */
export interface MyPagePostResponse {
  posts: PostResponse[]
  nextCursor: number | null
  hadNext: boolean
}

type RawMyPage = Partial<MyPagePostResponse> & { hasNext?: boolean }

const PAGE_SIZE = 5

function normalizePage(raw: RawMyPage): MyPagePostResponse {
  return {
    posts: Array.isArray(raw.posts) ? raw.posts : [],
    nextCursor: raw.nextCursor ?? null,
    hadNext: raw.hadNext === true || raw.hasNext === true,
  }
}

async function fetchMyPage(path: string, cursor?: number | null, size = PAGE_SIZE) {
  const params = new URLSearchParams()
  if (cursor != null) params.set('cursor', String(cursor))
  params.set('size', String(size))
  const raw = await apiJson<RawMyPage>(`${path}?${params}`)
  return normalizePage(raw)
}

/** 로그인한 회원이 작성한 글 */
export function fetchMyPosts(cursor?: number | null) {
  return fetchMyPage('/mypage/posts', cursor)
}

/** 로그인한 회원이 좋아요한 글 */
export function fetchMyLikedPosts(cursor?: number | null) {
  return fetchMyPage('/mypage/likes', cursor)
}

/** 로그인한 회원이 스크랩한 글 */
export function fetchMyScrappedPosts(cursor?: number | null) {
  return fetchMyPage('/mypage/scraps', cursor)
}

/** PostResponse → 마이페이지 카드. 첫 줄을 제목으로 쓴다 */
export function toMyPost(dto: PostResponse, viewer: MemberProfileResponse | null): MyPost {
  const feed = toFeedPost(dto, viewer)
  const [title, ...rest] = feed.content.split('\n')
  const body = rest.join('\n').trim()
  return {
    id: feed.id,
    memberId: feed.memberId,
    categoryId: feed.categoryId,
    imageUrl: feed.imageUrl,
    author: feed.author,
    avatar: feed.avatar,
    intro: '',
    category: feed.category,
    categoryLabel: feed.categoryLabel,
    title: title.trim(),
    body: body || undefined,
    images: feed.images,
    comments: feed.comments,
    likes: feed.likes,
    liked: feed.liked,
    scrapped: feed.bookmarked,
    views: feed.views,
    visibility: feed.visibility,
    createdAt: feed.createdAt,
    thread: [],
  }
}
