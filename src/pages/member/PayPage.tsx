import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useParams } from 'react-router'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal from '@/components/feed/WritePostModal'
import { currentUser, myPageCategories, type CategoryId } from '@/data/feed'
import { memberById } from '@/data/members'
import { getSubscribedIds, subscribeMemberships } from '@/data/subscriptions'
import { usePortOneCheckout } from '@/hooks/payment/usePortOneCheckout'

export default function PayPage() {
  const { memberId = '' } = useParams()
  const member = memberById(memberId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [writing, setWriting] = useState(false)
  const subscribedIds = useSyncExternalStore(subscribeMemberships, getSubscribedIds)
  const { startCheckout, busy, error, completedPaymentId, reset } = usePortOneCheckout()
  const paid = member ? subscribedIds.has(member.id) : false
  const checkoutDone = completedPaymentId !== null

  useEffect(() => {
    reset()
  }, [memberId, reset])

  return (
    <div className="page">
      <div className="shell">
        <Header query={query} user={currentUser} onQueryChange={setQuery} />
        <div className="layout">
          <Sidebar
            user={currentUser}
            category={category}
            categories={myPageCategories}
            categoriesOpen={categoriesOpen}
            onCategoryChange={setCategory}
            onToggleCategories={() => setCategoriesOpen((open) => !open)}
            onWrite={() => setWriting(true)}
          />
          <main className="my-main" aria-label="결제">
            <section className="pay-card">
              {!member ? (
                <p>결제할 프로필을 찾을 수 없습니다.</p>
              ) : paid ? (
                <>
                  <h2>결제가 완료되었습니다</h2>
                  <p>{member.name} 님 구독이 시작되었습니다.</p>
                  <Link to={`/member/${member.id}`} className="pay-submit">
                    프로필로 돌아가기
                  </Link>
                </>
              ) : checkoutDone ? (
                <>
                  <h2>결제창이 완료되었습니다</h2>
                  <p>서버에서 결제를 확인하면 {member.name} 님 구독이 반영됩니다.</p>
                  <Link to={`/member/${member.id}`} className="pay-submit">
                    프로필로 돌아가기
                  </Link>
                </>
              ) : (
                <>
                  <img src={member.avatar} alt="" />
                  <h2>{member.name} 님 구독</h2>
                  <p>구독자 전용 글을 보려면 결제가 필요합니다.</p>
                  <button
                    type="button"
                    className="pay-submit"
                    disabled={busy}
                    onClick={() => {
                      void startCheckout({
                        paymentType: 'SUBSCRIPTION',
                        targetId: member.backendId,
                        orderName: `${member.name} 님 구독`,
                      })
                    }}
                  >
                    {busy ? '결제창 여는 중…' : '결제하기'}
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
      {writing && (
        <WritePostModal
          user={currentUser}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={() => setWriting(false)}
        />
      )}
    </div>
  )
}
