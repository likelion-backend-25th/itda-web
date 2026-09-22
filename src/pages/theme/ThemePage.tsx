import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import CategoryFeed from '@/components/feed/CategoryFeed'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import ThemeShot from '@/components/theme/ThemeShot'
import WritePostModal from '@/components/feed/WritePostModal'
import { BagIcon, CloseIcon, SearchIcon } from '@/components/icons'
import { currentUser, myPageCategories, type CategoryId } from '@/data/feed'
import {
  formatThemePrice,
  getOwnedThemeIds,
  setThemeOwned,
  shopThemeById,
  shopThemes,
  subscribeOwnedThemes,
  themesPerPage,
} from '@/data/themes'

export default function ThemePage() {
  const { themeId } = useParams()
  const navigate = useNavigate()
  const selected = themeId ? shopThemeById(themeId) : undefined
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('')
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [writing, setWriting] = useState(false)
  const ownedIds = useSyncExternalStore(subscribeOwnedThemes, getOwnedThemeIds)

  const matched = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return shopThemes
    return shopThemes.filter((theme) => theme.name.toLowerCase().includes(text))
  }, [keyword])

  const pageCount = Math.max(1, Math.ceil(matched.length / themesPerPage))
  const currentPage = Math.min(page, pageCount)
  const visible = matched.slice((currentPage - 1) * themesPerPage, currentPage * themesPerPage)

  useEffect(() => {
    if (!themeId) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') navigate('/theme')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, themeId])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setKeyword(draft)
    setPage(1)
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
          <main className="my-main" aria-label="테마 구매">
            {category !== 'all' ? (
              <CategoryFeed category={category} query={query} />
            ) : (
            <>
            <h2 className="shop-title">구매 가능한 테마 목록</h2>
            <p className="shop-lead">다양한 테마로 나만의 특별한 ITDA를 만들어보세요.</p>
            <form className="shop-search" onSubmit={search}>
              <label>
                <SearchIcon />
                <input
                  value={draft}
                  placeholder="테마 이름 검색 창"
                  aria-label="테마 이름 검색 창"
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <button type="submit">검색</button>
            </form>
            {visible.length === 0 ? (
              <div className="empty">검색된 테마가 없습니다.</div>
            ) : (
              <div className="shop-grid">
                {visible.map((theme) => {
                  const owned = ownedIds.has(theme.id)
                  return (
                    <Link key={theme.id} to={`/theme/${theme.id}`} className="shop-card">
                      <ThemeShot tone={theme.tone} />
                      <span className="shop-card-foot">
                        <strong>{theme.name}</strong>
                        <em>{owned ? '보유 중' : formatThemePrice(theme.price)}</em>
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
            <nav className="shop-pages" aria-label="테마 목록 페이지">
              <button
                type="button"
                aria-label="이전 페이지"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => {
                const number = index + 1
                return (
                  <button
                    key={number}
                    type="button"
                    className={number === currentPage ? 'on' : undefined}
                    aria-current={number === currentPage ? 'page' : undefined}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                )
              })}
              <button
                type="button"
                aria-label="다음 페이지"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
              >
                ›
              </button>
            </nav>
            </>
            )}
          </main>
        </div>
      </div>
      {themeId && (
        <div className="detail-backdrop" onClick={() => navigate('/theme')}>
          <div
            className="shop-detail"
            role="dialog"
            aria-modal="true"
            aria-label={selected ? selected.name : '테마'}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="detail-close" aria-label="닫기" onClick={() => navigate('/theme')}>
              <CloseIcon />
            </button>
            {!selected ? (
              <p className="shop-missing">테마를 찾을 수 없습니다.</p>
            ) : (
              <>
                <div className="shop-preview">
                  <ThemeShot tone={selected.tone} />
                  <p className="shop-refund">
                    <span aria-hidden="true">!</span>
                    구매 후 적용 시 환불 불가능 합니다.
                  </p>
                </div>
                <div className="shop-detail-copy">
                  <h2>{selected.name}</h2>
                  <p>{selected.description}</p>
                  <strong className="shop-price">{formatThemePrice(selected.price)}</strong>
                  {ownedIds.has(selected.id) ? (
                    <button type="button" className="shop-purchase" disabled>
                      보유 중
                    </button>
                  ) : (
                    <button type="button" className="shop-purchase" onClick={() => setThemeOwned(selected.id)}>
                      <BagIcon />
                      구매
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
