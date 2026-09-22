import type { ThemeTone } from '../components/ThemeShot'

export type AdminMember = {
  id: string
  nickname: string
  email: string
  provider: string
  year: string
  avatar: string
}

export type AdminPayment = {
  id: string
  orderNo: string
  memberId: string
  targetId: string
  paidOn: string
  expiresOn: string
  payType: string
}

export type AdminRefund = {
  id: string
  orderNo: string
  email: string
  purchaseType: string
  payType: string
  purchasedOn: string
  refunded: boolean
}

export type AdminPost = {
  id: string
  nickname: string
  email: string
  content: string
  createdAt: string
}

export type AdminTheme = {
  id: string
  name: string
  tone: ThemeTone
}

export type AdminReport = {
  id: string
  nickname: string
  email: string
  content: string
  createdAt: string
}

const avatars = [
  '/images/avatar-minsu.jpg',
  '/images/avatar-haneul.jpg',
  '/images/avatar-jieun.jpg',
  '/images/avatar-minseo.jpg',
  '/images/avatar-dohyun.jpg',
  '/images/avatar-cat.jpg',
]

const memberSeeds = [
  ['하늘바다', 'skysea123@naver.com', '카카오', '2021년'],
  ['달콤라떼', 'latte_92@gmail.com', '구글', '2022년'],
  ['여행좋아', 'triplover@kakao.com', '카카오', '2023년'],
  ['코딩하는제이', 'jcode.dev@gmail.com', '구글', '2024년'],
  ['감성일기', 'sensitive@naver.com', '카카오', '2022년'],
  ['푸른고양이', 'bluecat@gmail.com', '구글', '2023년'],
] as const

const paymentSeeds = [
  ['P202409001', '1042', '2018', '2024-09-01', '2024-10-01', '카드 결제'],
  ['P202409002', '1098', '2044', '2024-09-04', '2024-10-04', '계좌이체'],
  ['P202409003', '1121', '2060', '2024-09-07', '2024-10-07', '카카오페이'],
  ['P202409004', '1155', '2027', '2024-09-10', '2024-10-10', '구글페이'],
  ['P202409005', '1180', '2099', '2024-09-12', '2024-10-12', '기타'],
  ['P202409006', '1204', '2033', '2024-09-15', '2024-10-15', '카드 결제'],
] as const

const refundSeeds = [
  ['P2024090101', 'happy_dog@naver.com', '테마', '카드 결제', '2024-09-01'],
  ['P2024090102', 'latte_92@gmail.com', '구독', '카카오페이', '2024-09-04'],
  ['P2024090103', 'minsu1203@naver.com', '테마', '구글페이', '2024-09-07'],
  ['P2024090104', 'sweetcat@gmail.com', '구독', '계좌이체', '2024-09-10'],
  ['P2024090105', 'may_bloom@naver.com', '테마', '카드 결제', '2024-09-12'],
  ['P2024090106', 'bluecat@gmail.com', '구독', '카카오페이', '2024-09-15'],
] as const

const postSeeds = [
  ['1042', '하늘바다', 'skysea123@naver.com', '오늘 날씨가 너무 좋...', '2024-09-01 14:23'],
  ['1098', '달콤라떼', 'latte_92@gmail.com', '여행 가고 싶다! 다...', '2024-09-03 09:12'],
  ['1121', '여행좋아', 'triplover@kakao.com', '사진 하나 올려봐요...', '2024-09-05 18:40'],
  ['1155', '코딩하는제이', 'jcode.dev@gmail.com', '이번 프로젝트 정말 ...', '2024-09-07 11:05'],
  ['1180', '감성일기', 'sensitive@naver.com', '맛있는 거 먹고 힐링...', '2024-09-10 16:22'],
  ['1204', '푸른고양이', 'bluecat@gmail.com', '주말에 카페 다녀왔...', '2024-09-12 20:18'],
] as const

const reportSeeds = [
  ['1042', '하늘바다', 'skysea92@naver.com', '불쾌한 욕설이 포함된 게시글입니다.', '2024-11-03 14:27'],
  ['1098', '달콤한라떼', 'latte_bean@daum.net', '상업적 광고 링크를 지속적으로 작성합니다.', '2024-11-05 09:13'],
  ['1121', '푸른고래', 'bluewhale@gmail.com', '다른 회원을 대상으로 한 비방 댓글입니다.', '2024-11-08 21:45'],
  ['1155', '사과좋아', 'applelover@naver.com', '도배성 게시물로 커뮤니티 운영에 지장을 줍니다.', '2024-11-10 11:02'],
  ['1180', '겨울소년', 'winter1204@daum.net', '음란한 내용이 포함된 게시글입니다.', '2024-11-12 18:36'],
  ['1204', '별빛여행', 'starlight@hanmail.net', '허위 정보로 다른 사용자를 혼란스럽게 합니다.', '2024-11-14 16:09'],
] as const

function pages<T, R>(seeds: readonly T[], map: (seed: T, index: number) => R): R[] {
  return Array.from({ length: 24 }, (_, index) => map(seeds[index % seeds.length], index))
}

const initial = {
  members: pages(memberSeeds, (seed, index) => ({
    id: `member-${index + 1}`,
    nickname: index < 6 ? seed[0] : `${seed[0]}${index + 1}`,
    email: index < 6 ? seed[1] : seed[1].replace('@', `${index}@`),
    provider: seed[2],
    year: seed[3],
    avatar: avatars[index % avatars.length],
  })),
  payments: pages(paymentSeeds, (seed, index) => ({
    id: `pay-${index + 1}`,
    orderNo: index < 6 ? seed[0] : `P202409${String(index + 1).padStart(3, '0')}`,
    memberId: String(Number(seed[1]) + (index < 6 ? 0 : index)),
    targetId: String(Number(seed[2]) + (index < 6 ? 0 : index)),
    paidOn: seed[3],
    expiresOn: seed[4],
    payType: seed[5],
  })),
  refunds: pages(refundSeeds, (seed, index) => ({
    id: `refund-${index + 1}`,
    orderNo: index < 6 ? seed[0] : `P20240901${String(index + 1).padStart(2, '0')}`,
    email: index < 6 ? seed[1] : seed[1].replace('@', `${index}@`),
    purchaseType: seed[2],
    payType: seed[3],
    purchasedOn: seed[4],
    refunded: false,
  })),
  posts: pages(postSeeds, (seed, index) => ({
    id: index < 6 ? seed[0] : String(Number(seed[0]) + index),
    nickname: index < 6 ? seed[1] : `${seed[1]}${index + 1}`,
    email: index < 6 ? seed[2] : seed[2].replace('@', `${index}@`),
    content: seed[3],
    createdAt: seed[4],
  })),
  themes: [
    { id: 'light', name: '기본 라이트', tone: 'light' },
    { id: 'dark', name: '기본 다크', tone: 'dark' },
    { id: 'sunset', name: '선셋 코랄', tone: 'sunset' },
    { id: 'ocean', name: '오션 블루', tone: 'ocean' },
    { id: 'forest', name: '포레스트 그린', tone: 'forest' },
  ] as AdminTheme[],
  reports: pages(reportSeeds, (seed, index) => ({
    id: index < 6 ? seed[0] : String(Number(seed[0]) + index),
    nickname: index < 6 ? seed[1] : `${seed[1]}${index + 1}`,
    email: index < 6 ? seed[2] : seed[2].replace('@', `${index}@`),
    content: seed[3],
    createdAt: seed[4],
  })),
}

let snapshot = initial
const listeners = new Set<() => void>()

function emit(next: typeof snapshot) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

export function subscribeAdminData(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAdminData() {
  return snapshot
}

export const adminPageSize = 6

export function removeMember(id: string) {
  emit({ ...snapshot, members: snapshot.members.filter((item) => item.id !== id) })
}

export function markRefunded(id: string) {
  emit({
    ...snapshot,
    refunds: snapshot.refunds.map((item) => (item.id === id ? { ...item, refunded: true } : item)),
  })
}

export function removePost(id: string) {
  emit({ ...snapshot, posts: snapshot.posts.filter((item) => item.id !== id) })
}

export function removeReport(id: string) {
  emit({ ...snapshot, reports: snapshot.reports.filter((item) => item.id !== id) })
}

export function removeTheme(id: string) {
  emit({ ...snapshot, themes: snapshot.themes.filter((item) => item.id !== id) })
}

export function renameTheme(id: string, name: string) {
  emit({
    ...snapshot,
    themes: snapshot.themes.map((item) => (item.id === id ? { ...item, name } : item)),
  })
}

export function addTheme(name: string) {
  const theme: AdminTheme = { id: `theme-${Date.now()}`, name, tone: 'light' }
  emit({ ...snapshot, themes: [...snapshot.themes, theme] })
}
