import type { ThemeTone } from '@/components/theme/ThemeShot'

export type ShopTheme = {
  id: string
  name: string
  description: string
  price: number
  tone: ThemeTone
}

export const shopThemes: ShopTheme[] = [
  {
    id: 'light',
    name: '기본 라이트',
    description: '밝고 산뜻한 기본 테마입니다. 맑은 하늘처럼 가벼운 분위기로 하루의 기록을 담아 보세요.',
    price: 10000,
    tone: 'light',
  },
  {
    id: 'dark',
    name: '기본 다크',
    description: '밤하늘처럼 차분한 다크 테마입니다. 눈의 피로를 덜고 글과 사진에 집중할 수 있어요.',
    price: 10000,
    tone: 'dark',
  },
  {
    id: 'ocean',
    name: '오션 블루',
    description: '바다와 하늘이 맞닿은 듯한 시원한 테마입니다. 맑은 파도처럼 마음이 환해지는 공간을 만들어 보세요.',
    price: 10000,
    tone: 'ocean',
  },
  {
    id: 'sunset',
    name: '선셋 코랄',
    description:
      '노을이 물든 하늘처럼, 따뜻하고 포근한 감성을 담은 테마입니다. 일상의 소중한 순간들이 더 특별하게 빛날 수 있도록, 선셋 코랄이 함께합니다.',
    price: 10000,
    tone: 'sunset',
  },
  {
    id: 'forest',
    name: '포레스트 그린',
    description: '숲속 바람처럼 편안한 그린 테마입니다. 잔잔한 초록빛 속에서 하루를 천천히 돌아볼 수 있어요.',
    price: 10000,
    tone: 'forest',
  },
  {
    id: 'lavender',
    name: '라벤더 나이트',
    description: '보랏빛 밤하늘처럼 고요한 테마입니다. 하루의 끝을 포근한 라벤더 색으로 마무리해 보세요.',
    price: 10000,
    tone: 'lavender',
  },
]

export const themesPerPage = 6

export function shopThemeById(id: string) {
  return shopThemes.find((theme) => theme.id === id)
}

export function formatThemePrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`
}

let owned = new Set<string>(['light', 'lavender'])
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
  emit()
}
