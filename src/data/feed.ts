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
  author: string
  avatar: string
  createdAt: string
  content: string
}

export type Post = {
  id: string
  /** 백엔드 PostResponse.memberId. 목 데이터에는 없음 */
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
  { id: 'cooking', label: '요리' },
  { id: 'music', label: '음악' },
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
  { id: 'cooking', label: '요리' },
  { id: 'music', label: '음악' },
  { id: 'drawing', label: '그림' },
  { id: 'game', label: '게임' },
  { id: 'etc', label: '기타' },
]

export const currentUser: FeedUser = {
  name: '지은',
  handle: '@jieun',
  bio: '오늘도 좋은 하루,\n좋은 사람들과 💙',
  avatar: '/images/avatar-jieun.jpg',
}

export const initialPosts: Post[] = [
  {
    id: 'jeju',
    author: '지은',
    avatar: '/images/avatar-jieun.jpg',
    time: '2시간 전',
    category: 'travel',
    categoryLabel: '여행',
    isMe: true,
    content:
      '주말에 다녀온 제주도 여행!\n푸른 바다와 맑은 하늘을 보니 정말 힐링되는 시간이었어요. 🌊💙\n다음엔 더 오래 있고 싶다...',
    images: [
      { src: '/images/photo-cliff.jpg', alt: '푸른 바다와 맞닿은 초록 해안 절벽' },
      { src: '/images/photo-palms.jpg', alt: '야자수가 늘어선 해변' },
      { src: '/images/photo-field.jpg', alt: '노을이 비친 넓은 들판' },
    ],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
    bookmarked: false,
    createdAt: '2024. 03. 16. 11:20',
    thread: [
      {
        id: 'jeju-1',
        author: '민수',
        avatar: '/images/avatar-minsu.jpg',
        createdAt: '2024. 03. 16. 13:05',
        content: '사진만 봐도 바람이 느껴져요. 다음에 같이 가요!',
      },
    ],
  },
  {
    id: 'workout',
    author: '민수',
    avatar: '/images/avatar-minsu.jpg',
    time: '5시간 전',
    category: 'workout',
    categoryLabel: '운동',
    content:
      '오늘도 운동 완료! 💪\n꾸준히 하니까 조금씩 몸이 변하는 게 느껴져서 뿌듯하네요.\n다들 건강한 하루 보내세요!',
    images: [{ src: '/images/photo-gym.jpg', alt: '헬스장에서 바벨을 드는 모습' }],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
    bookmarked: true,
    createdAt: '2024. 03. 16. 08:10',
    thread: [
      {
        id: 'workout-1',
        author: '하늘',
        avatar: '/images/avatar-haneul.jpg',
        createdAt: '2024. 03. 16. 09:40',
        content: '꾸준함이 정말 멋있어요. 오늘도 화이팅!',
      },
    ],
  },
  {
    id: 'cafe',
    author: '하늘',
    avatar: '/images/avatar-haneul.jpg',
    time: '1일 전',
    category: 'food',
    categoryLabel: '맛집',
    content:
      '서촌에 있는 작은 카페에 다녀왔어요.\n분위기도 좋고 커피도 정말 맛있었어요.\n조용한 주말에 가기 딱 좋은 곳이라 추천합니다!',
    images: [{ src: '/images/photo-cafe.jpg', alt: '카페 테이블 위의 커피' }],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
    bookmarked: false,
    createdAt: '2024. 03. 15. 16:40',
    thread: [
      {
        id: 'cafe-1',
        author: '도현',
        avatar: '/images/avatar-dohyun.jpg',
        createdAt: '2024. 03. 15. 18:12',
        content: '서촌 카페 리스트에 추가해 둘게요.',
      },
    ],
  },
  {
    id: 'cake',
    author: '민서',
    avatar: '/images/avatar-minseo.jpg',
    time: '3일 전',
    category: 'cooking',
    categoryLabel: '요리',
    content: '딸기 생크림 케이크를 만들어 봤어요.\n커피랑 같이 먹으니 오후가 더 달콤해졌어요.',
    images: [
      { src: '/images/photo-cake.jpg', alt: '베리와 생크림을 올린 케이크 한 조각' },
      { src: '/images/photo-cake2.jpg', alt: '딸기를 올린 디저트' },
    ],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
    bookmarked: true,
    createdAt: '2024. 03. 14. 14:20',
    thread: [
      {
        id: 'cake-1',
        author: '하늘냥',
        avatar: '/images/avatar-cat.jpg',
        createdAt: '2024. 03. 14. 16:27',
        content:
          '와 정말 맛있어 보여요! 🍓\n어디 카페인지 궁금하네요. 다음에 꼭 가보고 싶어요!',
      },
    ],
  },
  {
    id: 'book',
    author: '도현',
    avatar: '/images/avatar-dohyun.jpg',
    time: '1일 전',
    category: 'reading',
    categoryLabel: '독서',
    content:
      '좋은 책 한 권이 주는 힘은 정말 크네요.\n다들 요즘 어떤 책 읽고 계신가요?',
    images: [{ src: '/images/photo-book.jpg', alt: '펼쳐 둔 책과 차 한 잔' }],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
    bookmarked: false,
    createdAt: '2024. 03. 15. 09:05',
    thread: [
      {
        id: 'book-1',
        author: '지은',
        avatar: '/images/avatar-jieun.jpg',
        createdAt: '2024. 03. 15. 10:18',
        content: '요즘은 에세이를 읽고 있어요. 추천해 주세요!',
      },
    ],
  },
  {
    id: 'minsu-sub',
    author: '민수',
    avatar: '/images/avatar-minsu.jpg',
    time: '3시간 전',
    category: 'workout',
    categoryLabel: '운동',
    visibility: 'subscribers',
    content: '구독자분들께만 남기는 오늘 운동 루틴입니다.\n하체 위주로 60분 진행했어요.',
    images: [],
    comments: 21,
    likes: 10,
    liked: false,
    views: 53,
    bookmarked: false,
    createdAt: '2024. 03. 16. 18:20',
    thread: [],
  },
  {
    id: 'haneul-sub',
    author: '하늘',
    avatar: '/images/avatar-haneul.jpg',
    time: '6시간 전',
    category: 'food',
    categoryLabel: '맛집',
    visibility: 'subscribers',
    content: '구독자에게만 공개하는 단골 카페 자리입니다.\n창가 2인석이 제일 조용해요.',
    images: [],
    comments: 21,
    likes: 10,
    liked: false,
    views: 53,
    bookmarked: true,
    createdAt: '2024. 03. 16. 15:10',
    thread: [],
  },
  {
    id: 'minseo-sub',
    author: '민서',
    avatar: '/images/avatar-minseo.jpg',
    time: '1일 전',
    category: 'cooking',
    categoryLabel: '요리',
    visibility: 'subscribers',
    content: '구독자 전용 레시피예요.\n생크림은 덜 달게, 딸기는 한 줌만 올렸어요.',
    images: [],
    comments: 21,
    likes: 10,
    liked: true,
    views: 53,
    bookmarked: false,
    createdAt: '2024. 03. 15. 20:40',
    thread: [],
  },
  {
    id: 'dohyun-sub',
    author: '도현',
    avatar: '/images/avatar-dohyun.jpg',
    time: '2일 전',
    category: 'reading',
    categoryLabel: '독서',
    visibility: 'subscribers',
    content: '구독자분들께 먼저 권하는 이번 주 책입니다.\n짧은 에세이라 하루면 읽혀요.',
    images: [],
    comments: 21,
    likes: 10,
    liked: false,
    views: 53,
    bookmarked: false,
    createdAt: '2024. 03. 14. 21:05',
    thread: [],
  },
]
