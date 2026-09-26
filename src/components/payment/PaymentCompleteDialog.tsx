import { useEffect, useId, useRef } from 'react'

type PaymentCompleteDialogProps = {
  orderName: string
  amount: number
  paymentId: string
  confirmLabel?: string
  onClose: () => void
}

export default function PaymentCompleteDialog({
  orderName,
  amount,
  paymentId,
  confirmLabel = '확인',
  onClose,
}: PaymentCompleteDialogProps) {
  const titleId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    confirmRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="detail-backdrop pay-done-layer" onClick={onClose}>
      <div
        className="pay-card pay-done"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>결제가 완료되었습니다</h2>
        <p>{orderName}</p>
        <strong className="pay-done-amount">{amount.toLocaleString('ko-KR')}원</strong>
        <p className="pay-done-id">결제번호 {paymentId}</p>
        <button ref={confirmRef} type="button" className="pay-submit" onClick={onClose}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
