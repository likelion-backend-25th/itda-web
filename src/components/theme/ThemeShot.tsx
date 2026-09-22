export type ThemeTone = 'light' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'lavender'

const photos: Record<ThemeTone, string> = {
  light: '/images/photo-palms.jpg',
  dark: '/images/photo-cliff.jpg',
  ocean: '/images/photo-palms.jpg',
  sunset: '/images/photo-field.jpg',
  forest: '/images/photo-field.jpg',
  lavender: '/images/photo-cliff.jpg',
}

type ThemeShotProps = {
  tone: ThemeTone
}

export default function ThemeShot({ tone }: ThemeShotProps) {
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
