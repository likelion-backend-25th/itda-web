import { useState } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import WritePostModal from '../components/WritePostModal'
import { currentUser, myPageCategories, type CategoryId } from '../data/feed'
import { refundPurchases } from '../data/refunds'

export default function SupportPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [writing, setWriting] = useState(false)
  const [requested, setRequested] = useState<string[]>([])

  function requestRefund(id: string) {
    setRequested((current) => (current.includes(id) ? current : [...current, id]))
  }

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
          <main className="my-main" aria-label="고객센터">
            <h2 className="shop-title">환불 정책</h2>
            <div className="refund-policy">
              <p>2시간 이내: 전액 환불</p>
              <p>7일 이내: 50%</p>
            </div>
            <div className="refund-list">
              {refundPurchases.map((purchase) => {
                const done = requested.includes(purchase.id)
                return (
                  <article key={purchase.id} className="refund-row">
                    <p>
                      {purchase.orderNo}, {purchase.themeName}, {purchase.kind}, {purchase.purchasedAt}
                    </p>
                    <button
                      type="button"
                      className="refund-apply"
                      disabled={done}
                      onClick={() => requestRefund(purchase.id)}
                    >
                      {done ? '신청 완료' : '환불 신청'}
                    </button>
                  </article>
                )
              })}
            </div>
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
