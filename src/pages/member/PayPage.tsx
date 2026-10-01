import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { DEFAULT_AVATAR, fetchMemberProfile, resolveMemberImageUrl, toFeedUser } from '@/api/member'
import { preparePayment, unsubscribeAndRefund } from '@/api/payment'
import { fetchSubscriptionStatus } from '@/api/subscription'
import Header from '@/components/layout/Header'
import PayMethodPicker from '@/components/payment/PayMethodPicker'
import PaymentCompleteDialog from '@/components/payment/PaymentCompleteDialog'
import UnsubscribeRefundDialog from '@/components/payment/UnsubscribeRefundDialog'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { myPageCategories, type CategoryId } from '@/data/feed'
import { type MemberProfile } from '@/data/members'
import { getSubscribedIds, setSubscribed, subscribeMemberships } from '@/data/subscriptions'
import { usePortOneCheckout } from '@/hooks/payment/usePortOneCheckout'
import type { PayMethod, PaymentPrepareResponse } from '@/types/payment'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { usePublishPost } from '@/hooks/post/usePublishPost'

function toPayMember(profile: {
  id: number
  nickname: string
  bio: string
  avatar: string
}): MemberProfile {
  return {
    id: String(profile.id),
    backendId: profile.id,
    name: profile.nickname,
    avatar: profile.avatar,
    bio: profile.bio || '소개글이 없습니다.',
    followers: 0,
    following: 0,
    posts: 0,
  }
}

export default function PayPage() {
  const { memberId = '' } = useParams()
  const navigate = useNavigate()
  const numericId = /^\d+$/.test(memberId) ? Number(memberId) : null
  const [apiMember, setApiMember] = useState<MemberProfile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(numericId != null)
  const member = apiMember
  const viewer = useViewerUser()
  const { publish } = usePublishPost()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [writing, setWriting] = useState(false)
  const [payMethod, setPayMethod] = useState<PayMethod>('KAKAOPAY')
  const subscribedIds = useSyncExternalStore(subscribeMemberships, getSubscribedIds)
  const { payPrepared, busy, phase, error, receipt, reset } = usePortOneCheckout()
  const [quote, setQuote] = useState<PaymentPrepareResponse | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [serverSubscribed, setServerSubscribed] = useState(false)
  const [unsubscribeOpen, setUnsubscribeOpen] = useState(false)
  const [refundDone, setRefundDone] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelBusy, setCancelBusy] = useState(false)
  const paid = member ? subscribedIds.has(member.id) || serverSubscribed : false

  useEffect(() => {
    reset()
  }, [memberId, reset])

  // 구독 결제 complete 가 구독 행을 만든다. 완료 화면과 프로필 버튼이 그 결과를 따른다
  useEffect(() => {
    if (!receipt || !member) return
    setSubscribed(member.id, true)
    setServerSubscribed(true)
  }, [receipt, member])

  // 구독 버튼으로 들어온 결제 화면에서 prepare 금액·채널을 받는다
  useEffect(() => {
    if (!member || paid) {
      setQuote(null)
      setQuoteError('')
      setQuoteLoading(false)
      return
    }

    let cancelled = false
    setQuote(null)
    setQuoteLoading(true)
    setQuoteError('')

    async function loadQuote() {
      try {
        const prepared = await preparePayment({
          paymentType: 'SUBSCRIPTION',
          targetId: member!.backendId,
          payMethod,
        })
        if (!cancelled) setQuote(prepared)
      } catch (caught: unknown) {
        if (!cancelled) {
          setQuote(null)
          setQuoteError(caught instanceof Error ? caught.message : '구독 금액을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    }

    void loadQuote()
    return () => {
      cancelled = true
    }
  }, [member, paid, payMethod])

  useEffect(() => {
    if (numericId == null) {
      setServerSubscribed(false)
      return
    }
    let cancelled = false
    async function loadStatus() {
      try {
        const status = await fetchSubscriptionStatus(numericId!)
        if (!cancelled) setServerSubscribed(status.subscribed)
      } catch {
        if (!cancelled) setServerSubscribed(false)
      }
    }
    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [numericId])

  // 숫자 경로만 API 프로필을 받는다. slug mock은 쓰지 않는다
  useEffect(() => {
    if (numericId == null) {
      setApiMember(null)
      setLoading(false)
      setLoadError('결제할 프로필을 찾을 수 없습니다.')
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    async function load() {
      try {
        const profile = await fetchMemberProfile(numericId!)
        if (cancelled) return
        const feed = toFeedUser(profile)
        setApiMember(
          toPayMember({
            id: profile.id,
            nickname: feed.name,
            bio: feed.bio,
            avatar: resolveMemberImageUrl(profile.profileImage) || DEFAULT_AVATAR,
          }),
        )
      } catch (caught: unknown) {
        if (cancelled) return
        setApiMember(null)
        setLoadError(caught instanceof Error ? caught.message : '결제 대상을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [numericId])

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
          <main className="my-main" aria-label="결제">
            <section className="pay-card">
              {loading ? (
                <p>결제 정보를 불러오는 중…</p>
              ) : loadError ? (
                <p role="alert">{loadError}</p>
              ) : !member ? (
                <p>결제할 프로필을 찾을 수 없습니다.</p>
              ) : paid ? (
                <>
                  <img src={member.avatar} alt="" />
                  <h2>{member.name} 님을 구독 중입니다</h2>
                  <button
                    type="button"
                    className="pay-submit"
                    disabled={cancelBusy}
                    onClick={() => {
                      setRefundDone(false)
                      setCancelError('')
                      setUnsubscribeOpen(true)
                    }}
                  >
                    구독 취소
                  </button>
                  <Link to={`/member/${member.id}`} className="pay-back">
                    프로필로 돌아가기
                  </Link>
                </>
              ) : (
                <>
                  <img src={member.avatar} alt="" />
                  <h2>{member.name} 님 구독</h2>
                  <p>구독자 전용 글을 보려면 결제가 필요합니다.</p>
                  {quoteLoading ? (
                    <p>구독 금액을 불러오는 중…</p>
                  ) : quote ? (
                    <strong className="pay-done-amount">{quote.amount.toLocaleString('ko-KR')}원</strong>
                  ) : null}
                  {quoteError && (
                    <p className="pay-error" role="alert">
                      {quoteError}
                    </p>
                  )}
                  <PayMethodPicker value={payMethod} disabled={busy || quoteLoading} onChange={setPayMethod} />
                  <button
                    type="button"
                    className="pay-submit"
                    disabled={busy || quoteLoading || quote == null}
                    onClick={() => {
                      if (!quote) return
                      void payPrepared(quote, `${member.name} 님 구독`)
                    }}
                  >
                    {busy ? (phase === 'confirm' ? '결제 확인 중…' : '결제창 여는 중…') : '결제하기'}
                  </button>
                  {error && (
                    <p className="pay-error" role="alert">
                      {error}
                    </p>
                  )}
                  <Link to={`/member/${member.id}`} className="pay-back">
                    취소
                  </Link>
                </>
              )}
            </section>
          </main>
        </div>
      </div>
      {unsubscribeOpen && member && (
        <UnsubscribeRefundDialog
          name={member.name}
          busy={cancelBusy}
          error={cancelError}
          done={refundDone}
          onClose={() => {
            if (cancelBusy) return
            setUnsubscribeOpen(false)
            setCancelError('')
            if (refundDone) navigate(`/member/${member.id}`)
            setRefundDone(false)
          }}
          onConfirm={() => {
            void (async () => {
              setCancelBusy(true)
              setCancelError('')
              try {
                await unsubscribeAndRefund(member.backendId)
                setSubscribed(member.id, false)
                setServerSubscribed(false)
                setRefundDone(true)
              } catch (caught: unknown) {
                setCancelError(caught instanceof Error ? caught.message : '구독 취소에 실패했습니다.')
              } finally {
                setCancelBusy(false)
              }
            })()
          }}
        />
      )}
      {receipt && (
        <PaymentCompleteDialog
          orderName={receipt.orderName}
          amount={receipt.amount}
          paymentId={receipt.paymentId}
          confirmLabel="프로필로 돌아가기"
          onClose={() => {
            reset()
            if (member) navigate(`/member/${member.id}`)
          }}
        />
      )}
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
