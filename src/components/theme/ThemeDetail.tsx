import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { OwnedTheme } from '@/data/mypage'
import { CloseIcon } from '@/components/icons'
import ThemeShot from './ThemeShot'

type ThemeDetailProps = {
  theme: OwnedTheme
  onClose: () => void
  onApply: () => void
}

export default function ThemeDetail({ theme, onClose, onApply }: ThemeDetailProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return createPortal(
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className="theme-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="theme-detail-preview">
          <ThemeShot tone={theme.tone} thumbnailUrl={theme.thumbnailUrl} />
        </div>
        <aside className="theme-detail-side">
          <button ref={closeRef} type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
          <h2 id={titleId}>{theme.title}</h2>
          <p>{theme.subtitle}</p>
          {theme.active && <p className="shop-applied">현재 적용 중인 테마입니다.</p>}
          {theme.active ? (
            <button type="button" className="theme-apply" disabled>
              적용 중
            </button>
          ) : (
            <button type="button" className="theme-apply" onClick={onApply}>
              적용
            </button>
          )}
        </aside>
      </div>
    </div>,
    document.body,
  )
}
