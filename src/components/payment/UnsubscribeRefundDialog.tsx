import { useEffect, useId, useRef } from 'react'

type UnsubscribeRefundDialogProps = {
  name: string
  busy: boolean
  error: string
  done: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function UnsubscribeRefundDialog({
  name,
  busy,
  error,
  done,
  onClose,
  onConfirm,
}: UnsubscribeRefundDialogProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    cancelRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy])

  return (
    <div
      className="detail-backdrop pay-done-layer"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        className="pay-card pay-done"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        {done ? (
          <>
            <h2 id={titleId}>사용자가 결제를 취소하였습니다</h2>
            <button type="button" className="pay-submit" onClick={onClose}>
              확인
            </button>
          </>
        ) : (
          <>
            <h2 id={titleId}>구독을 해제할까요?</h2>
            <p>{name} 구독을 해제하면 남은 구독일 수만큼 환불이 진행됩니다.</p>
            {error && <p className="pay-error">{error}</p>}
            <button ref={cancelRef} type="button" className="pay-back" disabled={busy} onClick={onClose}>
              취소
            </button>
            <button type="button" className="pay-submit" disabled={busy} onClick={onConfirm}>
              {busy ? '환불 처리 중…' : '해제하고 환불'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
