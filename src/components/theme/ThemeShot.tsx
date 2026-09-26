import { useState } from 'react'

export type ThemeTone = 'light' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'watermelon' | 'skiper'

/** 서버 썸네일이 없을 때 쓰는 임시 미리보기. public/images 사진 */
const previewImages: Record<ThemeTone, string> = {
  light: '/images/photo-home-cafe.jpg',
  dark: '/images/photo-book.jpg',
  ocean: '/images/photo-cliff.jpg',
  sunset: '/images/photo-field.jpg',
  forest: '/images/photo-palms.jpg',
  lavender: '/images/photo-cafe.jpg',
  watermelon: '/images/photo-home-cafe.jpg',
  skiper: '/images/photo-book.jpg',
}

const tones: ThemeTone[] = ['light', 'dark', 'ocean', 'sunset', 'forest', 'lavender', 'watermelon', 'skiper']

const referenceTones = new Set<ThemeTone>(['watermelon', 'skiper'])

/** themeCode → 미리보기 톤 (알 수 없으면 해시로 고른다) */
export function toneFromThemeCode(themeCode: string): ThemeTone {
  const lower = themeCode.trim().toLowerCase()
  if (lower === 'default' || lower === 'basic') return 'light'
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
  // 백엔드가 아직 올려 두지 않은 테마 썸네일 경로는 건너뛴다
  if (thumbnailUrl.includes('/images/themes/')) return null
  return thumbnailUrl
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
