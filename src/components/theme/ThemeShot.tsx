import { useState } from 'react'

export type ThemeTone =
  | 'light'
  | 'dark'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'lavender'
  | 'cream'
  | 'sky'
  | 'hidden'
  | 'watermelon'
  | 'skiper'

/** 서버 썸네일이 없을 때 / themeCode 매핑용 미리보기 */
const previewImages: Record<ThemeTone, string> = {
  light: '/images/themes/default.png',
  dark: '/images/themes/dark.png',
  ocean: '/images/themes/ocean.png',
  sunset: '/images/themes/sunset.png',
  forest: '/images/themes/forest.png',
  lavender: '/images/themes/lavender.png',
  cream: '/images/themes/cream.png',
  sky: '/images/themes/sky.png',
  hidden: '/images/themes/hidden.png',
  watermelon: '/images/themes/default.png',
  skiper: '/images/themes/default.png',
}

const tones: ThemeTone[] = [
  'light',
  'dark',
  'ocean',
  'sunset',
  'forest',
  'lavender',
  'cream',
  'sky',
  'hidden',
  'watermelon',
  'skiper',
]

const referenceTones = new Set<ThemeTone>(['watermelon', 'skiper'])

/** themeCode → 미리보기 톤 */
export function toneFromThemeCode(themeCode: string): ThemeTone {
  const lower = themeCode.trim().toLowerCase()
  if (lower === 'default' || lower === 'basic') return 'light'
  if (lower === 'cream' || lower === 'cotton') return 'cream'
  if (lower === 'sky' || lower === 'skylight') return 'sky'
  if (lower === 'hidden' || lower === 'hide') return 'hidden'
  if ((tones as string[]).includes(lower)) return lower as ThemeTone
  let hash = 0
  for (let i = 0; i < lower.length; i += 1) {
    hash = (hash * 31 + lower.charCodeAt(i)) | 0
  }
  return tones[Math.abs(hash) % tones.length]
}

type ThemeShotProps = {
  tone?: ThemeTone
  /** API thumbnailUrl 이 있으면 톤 미리보기 대신 이미지 표시 */
  thumbnailUrl?: string | null
}

function remoteThumbnail(thumbnailUrl: string | null | undefined): string | null {
  if (!thumbnailUrl || thumbnailUrl.trim() === '') return null
  const trimmed = thumbnailUrl.trim()
  // 프론트 public 정적 경로 (/images/themes/...) 도 그대로 사용
  if (trimmed.startsWith('/images/')) return trimmed
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed
  return trimmed
}

export default function ThemeShot({ tone = 'light', thumbnailUrl }: ThemeShotProps) {
  const remote = remoteThumbnail(thumbnailUrl)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (referenceTones.has(tone) && !remote) {
    return (
      <div className={`theme-shot thumb theme-ref ${tone}`} aria-hidden="true">
        <div className="theme-ref-bar">
          <strong>ITDA</strong>
          <span className="theme-ref-dot" />
        </div>
        <div className="theme-ref-card">
          <b />
          <b />
          <em />
        </div>
      </div>
    )
  }

  const src = !remote || failedUrl === remote ? previewImages[tone] : remote

  return (
    <div className="theme-shot thumb" aria-hidden="true">
      <img
        className="theme-shot-thumb"
        src={src}
        alt=""
        onError={() => {
          if (remote) setFailedUrl(remote)
        }}
      />
    </div>
  )
}
