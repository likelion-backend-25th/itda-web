type ThemeShotProps = {
  tone: 'light' | 'dark'
}

export default function ThemeShot({ tone }: ThemeShotProps) {
  const photo = tone === 'light' ? '/images/photo-palms.jpg' : '/images/photo-cliff.jpg'

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
          <img src={photo} alt="" />
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
