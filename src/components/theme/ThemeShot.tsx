export type ThemeTone = 'light' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'lavender'

const photos: Record<ThemeTone, string> = {
  light: '/images/photo-palms.jpg',
  dark: '/images/photo-cliff.jpg',
  ocean: '/images/photo-palms.jpg',
  sunset: '/images/photo-field.jpg',
  forest: '/images/photo-field.jpg',
  lavender: '/images/photo-cliff.jpg',
}

const tones: ThemeTone[] = ['light', 'dark', 'ocean', 'sunset', 'forest', 'lavender']

/** themeCode → 미리보기 톤 (알 수 없으면 해시로 고른다) */
export function toneFromThemeCode(themeCode: string): ThemeTone {
  const lower = themeCode.trim().toLowerCase()
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

export default function ThemeShot({ tone = 'light', thumbnailUrl }: ThemeShotProps) {
  if (thumbnailUrl) {
    return (
      <div className="theme-shot thumb" aria-hidden="true">
        <img className="theme-shot-thumb" src={thumbnailUrl} alt="" />
      </div>
    )
  }

  return (
    <div className={`theme-shot ${tone}`} aria-hidden="true">
      <div className="shot-top">
        <strong>ITDA</strong>
        <span className="shot-search" />
        <span className="shot-pills" />
      </div>
      <div className="shot-body">
        <div className="shot-side">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="shot-feed">
          <img src={photos[tone]} alt="" />
          <div>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  )
}
