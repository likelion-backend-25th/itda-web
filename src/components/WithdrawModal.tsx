import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './icons'

export type WithdrawKind = 'general' | 'subscriber' | 'creator'

type WithdrawModalProps = {
  kind: WithdrawKind
  onClose: () => void
  onConfirm: () => void
}

const subscriberWarning = {
  title: '현재 이용 중인 유료 구독이 있습니다.',
  body: '탈퇴 시 구독 이용이 종료되며, 환불 여부는 환불 정책에 따라 처리됩니다.',
}

const creatorWarning = {
  title: '현재 회원님의 콘텐츠를 구독 중인 사용자가 있습니다.',
  body: '회원 탈퇴 시 신규 구독이 중단되며, 기존 구독자의 이용 및 환불 처리는 서비스 정책에 따라 처리됩니다.',
}

export default function WithdrawModal({ kind, onClose, onConfirm }: WithdrawModalProps) {
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [policyOpen, setPolicyOpen] = useState(false)
  const warning = kind === 'creator' ? creatorWarning : kind === 'subscriber' ? subscriberWarning : null

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (policyOpen) {
        setPolicyOpen(false)
        return
      }
      onCloseRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [policyOpen])

  return createPortal(
    <>
      <div className="detail-backdrop withdraw-layer" onClick={onClose}>
        <div
          className="withdraw-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="withdraw-head">
            <h2 id={titleId}>회원 탈퇴</h2>
            <button type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
              <CloseIcon />
            </button>
          </header>
          <p className="withdraw-ask">정말 회원 탈퇴 하시겠습니까?</p>
          <p className="withdraw-lead">탈퇴하면 다음 사항이 적용됩니다.</p>
          <ul className="withdraw-list">
            <li>회원 정보가 삭제됩니다.</li>
            <li>작성한 게시글 및 활동 내역이 삭제됩니다.</li>
            {warning && (
              <li className="withdraw-warn">
                <strong>
                  <span aria-hidden="true">⚠</span>
                  {warning.title}
                </strong>
                <span>{warning.body}</span>
                <button type="button" className="withdraw-policy" onClick={() => setPolicyOpen(true)}>
                  [환불 정책 보기]
                </button>
              </li>
            )}
            <li>탈퇴 후에는 계정을 복구할 수 없습니다.</li>
          </ul>
          <div className="withdraw-actions">
            <button type="button" onClick={onClose}>
              취소
            </button>
            <button type="button" onClick={onConfirm}>
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>
      {policyOpen && <RefundPolicyModal onClose={() => setPolicyOpen(false)} />}
    </>,
    document.body,
  )
}

function RefundPolicyModal({ onClose }: { onClose: () => void }) {
  const titleId = useId()

  return (
    <div className="detail-backdrop policy-layer" onClick={onClose}>
      <div
        className="withdraw-dialog policy-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="withdraw-head">
          <h2 id={titleId}>환불 정책</h2>
          <button type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <section className="policy-block">
          <h3>테마</h3>
          <p>적용 이력 있으면 환불 불가, 없으면 환불 가능</p>
        </section>
        <section className="policy-block">
          <h3>구독</h3>
          <ul>
            <li>7일 이내 사용이면 전액 환불</li>
            <li>이후는 남은 기간 만큼 환불 + 위약금 최대 10%부과</li>
            <li>일정 기간내에 환불 횟수 5회 초과 시 구독 불가</li>
            <li>창작자 탈퇴 시, 남은기간만큼 환불</li>
          </ul>
        </section>
        <div className="policy-actions">
          <button type="button" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
