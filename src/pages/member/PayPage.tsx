import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { DEFAULT_AVATAR, fetchMemberProfile, resolveMemberImageUrl, toFeedUser } from '@/api/member'
import Header from '@/components/layout/Header'
import PayMethodPicker from '@/components/payment/PayMethodPicker'
import PaymentCompleteDialog from '@/components/payment/PaymentCompleteDialog'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { myPageCategories, type CategoryId } from '@/data/feed'
import { memberById, type MemberProfile } from '@/data/members'
import { getSubscribedIds, subscribeMemberships } from '@/data/subscriptions'
import { usePortOneCheckout } from '@/hooks/payment/usePortOneCheckout'
import type { PayMethod } from '@/types/payment'
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
  const mockMember = numericId == null ? memberById(memberId) : undefined
  const [apiMember, setApiMember] = useState<MemberProfile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(numericId != null)
  const member = apiMember ?? mockMember ?? null
  const viewer = useViewerUser()
  const { publish } = usePublishPost()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [writing, setWriting] = useState(false)
  const [payMethod, setPayMethod] = useState<PayMethod>('KAKAOPAY')
  const subscribedIds = useSyncExternalStore(subscribeMemberships, getSubscribedIds)
  const { startCheckout, busy, phase, error, receipt, reset } = usePortOneCheckout()
  const paid = member ? subscribedIds.has(member.id) : false

  useEffect(() => {
    reset()
  }, [memberId, reset])

  // 숫자 경로면 GET /member/{id} 로 결제 대상 프로필을 받는다
  useEffect(() => {
    if (numericId == null) {
      setApiMember(null)
      setLoading(false)
      setLoadError(null)
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
                  <h2>결제가 완료되었습니다</h2>
                  <p>{member.name} 님 구독이 시작되었습니다.</p>
                  <Link to={`/member/${member.id}`} className="pay-submit">
                    프로필로 돌아가기
                  </Link>
                </>
              ) : (
                <>
                  <img src={member.avatar} alt="" />
                  <h2>{member.name} 님 구독</h2>
                  <p>구독자 전용 글을 보려면 결제가 필요합니다.</p>
                  <PayMethodPicker value={payMethod} disabled={busy} onChange={setPayMethod} />
                  <button
                    type="button"
                    className="pay-submit"
                    disabled={busy}
                    onClick={() => {
                      void startCheckout({
                        paymentType: 'SUBSCRIPTION',
                        targetId: member.backendId,
                        orderName: `${member.name} 님 구독`,
                        payMethod,
                      })
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
