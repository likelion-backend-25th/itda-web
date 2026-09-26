import type { ThemeTone } from '@/components/theme/ThemeShot'
import type { ThemeResponse } from '@/types/theme'

export type ShopTheme = {
  id: string
  /** 백엔드 theme.id. 결제 prepare의 targetId로 사용 */
  backendId: number
  name: string
  description: string
  price: number
  tone: ThemeTone
}

/** 참고 사이트를 바탕으로 만든 예시. id < 0 이면 결제 없이 바로 적용한다 */
export const exampleThemes: ThemeResponse[] = [
  {
    id: -1,
    themeName: '워터멜론',
    price: 0,
    thumbnailUrl: null,
    themeCode: 'watermelon',
    isOwned: false,
    isApplied: false,
  },
  {
    id: -2,
    themeName: '스킵퍼',
    price: 0,
    thumbnailUrl: null,
    themeCode: 'skiper',
    isOwned: false,
    isApplied: false,
  },
]

export function isExampleThemeId(id: number) {
  return id < 0
}

export const shopThemes: ShopTheme[] = [
  {
    id: 'watermelon',
    backendId: -1,
    name: '워터멜론',
    description: '흰 카드와 먹색 글자, 라임 포인트로 정리한 테마입니다. 목록과 버튼이 한결 또렷해집니다.',
    price: 0,
    tone: 'watermelon',
  },
  {
    id: 'skiper',
    backendId: -2,
    name: '스킵퍼',
    description: '흰 바탕에 따뜻한 회색 카드와 검은 버튼을 얹은 테마입니다. 글과 여백이 먼저 보입니다.',
    price: 0,
    tone: 'skiper',
  },
  {
    id: 'ocean',
    backendId: -1,
    name: '오션 블루',
    description: '바다와 하늘이 맞닿은 듯한 시원한 테마입니다. 맑은 파도처럼 마음이 환해지는 공간을 만들어 보세요.',
    price: 10000,
    tone: 'ocean',
  },
  {
    id: 'sunset',
    backendId: -2,
    name: '선셋 코랄',
    description:
      '노을이 물든 하늘처럼, 따뜻하고 포근한 감성을 담은 테마입니다. 일상의 소중한 순간들이 더 특별하게 빛날 수 있도록, 선셋 코랄이 함께합니다.',
    price: 10000,
    tone: 'sunset',
  },
  {
    id: 'forest',
    backendId: -3,
    name: '포레스트 그린',
    description: '숲속 바람처럼 편안한 그린 테마입니다. 잔잔한 초록빛 속에서 하루를 천천히 돌아볼 수 있어요.',
    price: 10000,
    tone: 'forest',
  },
  {
    id: 'dark',
    backendId: 6,
    name: '미드나잇 다크',
    description: '밤하늘처럼 차분한 다크 테마입니다. 눈의 피로를 덜고 글과 사진에 집중할 수 있어요.',
    price: 4000,
    tone: 'dark',
  },
  {
    id: 'lavender',
    backendId: 5,
    name: '라벤더 나이트',
    description: '보랏빛 밤하늘처럼 고요한 테마입니다. 하루의 끝을 포근한 라벤더 색으로 마무리해 보세요.',
    price: 5000,
    tone: 'lavender',
  },
]

export const themesPerPage = 6

export function shopThemeById(id: string) {
  return shopThemes.find((theme) => theme.id === id)
}

export function formatThemePrice(price: number) {
  if (price <= 0) return '무료'
  return `${price.toLocaleString('ko-KR')}원`
}

const OWNED_KEY = 'itda-owned-themes'

function readOwned(): Set<string> {
  try {
    const raw = localStorage.getItem(OWNED_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return new Set(parsed)
    }
  } catch {
    // 손상된 저장값은 버리고 빈 목록으로 시작한다
  }
  return new Set()
}

let owned = typeof localStorage === 'undefined' ? new Set<string>() : readOwned()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeOwnedThemes(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getOwnedThemeIds() {
  return owned
}

export function setThemeOwned(themeId: string) {
  if (owned.has(themeId)) return
  owned = new Set(owned)
  owned.add(themeId)
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify([...owned]))
  } catch {
    // 저장에 실패해도 이번 세션의 보유 목록은 유지한다
  }
  emit()
}
