import { useEffect, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router'
import { fetchMyPayments, requestPaymentRefund } from '@/api/payment'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { myPageCategories, type CategoryId } from '@/data/feed'
import { getLoggedIn, subscribeSession } from '@/data/session'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { usePublishPost } from '@/hooks/post/usePublishPost'
import type { MyPaymentResponse } from '@/types/payment'

function paymentTypeLabel(paymentType: string): string {
  if (paymentType === 'THEME') return '테마'
  if (paymentType === 'SUBSCRIPTION') return '구독'
  return paymentType || '—'
}

function isRefundComplete(payment: MyPaymentResponse): boolean {
  return payment.paymentStatus.includes('환불 완료')
}

function isRefundClosed(payment: MyPaymentResponse): boolean {
  return payment.paymentStatus.includes('환불')
}

function refundButtonLabel(payment: MyPaymentResponse, busy: boolean): string {
  if (busy) return '처리 중…'
  if (isRefundComplete(payment)) return '환불 완료'
  if (isRefundClosed(payment)) return '신청 완료'
  if (payment.refundAvailable) return '환불 신청'
  return '환불 불가'
}

export default function SupportPage() {
  const navigate = useNavigate()
  const viewer = useViewerUser()
  const { publish } = usePublishPost()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [writing, setWriting] = useState(false)
  const [payments, setPayments] = useState<MyPaymentResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refundingId, setRefundingId] = useState<string | null>(null)

  // GET /api/v1/customer/payments
  useEffect(() => {
    if (!loggedIn) {
      setPayments([])
      setLoading(false)
      setError('로그인 후 결제 내역을 볼 수 있습니다.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function loadPayments() {
      try {
        const list = await fetchMyPayments()
        if (!cancelled) setPayments(list)
      } catch (loadError: unknown) {
        if (cancelled) return
        setPayments([])
        const message = loadError instanceof Error ? loadError.message : '결제 내역을 불러오지 못했습니다.'
        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPayments()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  async function requestRefund(payment: MyPaymentResponse) {
    if (refundingId != null || isRefundClosed(payment) || !payment.refundAvailable) return
    if (payment.paymentId === '') {
      setError('환불에 필요한 결제 정보가 없습니다.')
      return
    }
    setRefundingId(payment.paymentId)
    setError(null)
    try {
      await requestPaymentRefund(payment.paymentId)
      setPayments((current) =>
        current.map((item) =>
          item.id === payment.id
            ? { ...item, paymentStatus: '환불 완료', refundAvailable: false }
            : item,
        ),
      )
    } catch (refundError: unknown) {
      const message = refundError instanceof Error ? refundError.message : '환불 신청에 실패했습니다.'
      setError(message)
    } finally {
      setRefundingId(null)
    }
  }

  async function publishAndGoHome(draft: PostDraft) {
    await publish(draft)
    setWriting(false)
    navigate('/')
  }

  return (
    <div className="page">
      <div className="shell">
        <Header query={query} user={viewer} onQueryChange={setQuery} />
        <div className="layout">
          <Sidebar
            user={viewer}
            category={category}
            categories={myPageCategories}
            categoriesOpen={categoriesOpen}
            onCategoryChange={setCategory}
            onToggleCategories={() => setCategoriesOpen((open) => !open)}
            onWrite={() => setWriting(true)}
          />
          <main className="my-main" aria-label="고객센터">
            <h2 className="shop-title">환불 정책</h2>
            <div className="refund-policy">
              <p>테마: 적용한 적이 있으면 환불 불가</p>
              <p>구독: 남은 구독일 수 만큼 환불</p>
            </div>
            <div className="refund-list">
              {error && <p className="settle-error">{error}</p>}
              {loading ? (
                <div className="empty">결제 내역을 불러오는 중…</div>
              ) : payments.length === 0 && !error ? (
                <div className="empty">결제 내역이 없습니다.</div>
              ) : (
                payments.map((payment) => {
                  const closed = isRefundClosed(payment)
                  const busy = refundingId === payment.paymentId && payment.paymentId !== ''
                  return (
                    <article key={payment.id} className="refund-row">
                      <p>
                        <span>{payment.paymentId || payment.id}</span>
                        <span>{paymentTypeLabel(payment.paymentType)}</span>
                        <span>{payment.amount.toLocaleString('ko-KR')}원</span>
                        <span>{payment.createdAt || '—'}</span>
                      </p>
                      <button
                        type="button"
                        className="refund-apply"
                        disabled={busy || closed || !payment.refundAvailable}
                        onClick={() => {
                          void requestRefund(payment)
                        }}
                      >
                        {refundButtonLabel(payment, busy)}
                      </button>
                    </article>
                  )
                })
              )}
            </div>
          </main>
        </div>
      </div>
      {writing && (
        <WritePostModal
          user={viewer}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={publishAndGoHome}
        />
      )}
    </div>
  )
}
