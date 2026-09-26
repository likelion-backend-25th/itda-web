import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { fetchThemeList } from '@/api/theme'
import CategoryFeed from '@/components/feed/CategoryFeed'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import ThemeShot, { toneFromThemeCode } from '@/components/theme/ThemeShot'
import WritePostModal from '@/components/feed/WritePostModal'
import { BagIcon, CloseIcon, SearchIcon } from '@/components/icons'
import { applyAppTheme, getAppliedTheme, resolveAppTheme, subscribeAppTheme } from '@/data/appTheme'
import { currentUser, myPageCategories, type CategoryId } from '@/data/feed'
import {
  exampleThemes,
  formatThemePrice,
  getOwnedThemeIds,
  isExampleThemeId,
  setThemeOwned,
  subscribeOwnedThemes,
} from '@/data/themes'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import PaymentCompleteDialog from '@/components/payment/PaymentCompleteDialog'
import { usePortOneCheckout } from '@/hooks/payment/usePortOneCheckout'
import { ApiError } from '@/lib/apiClient'
import type { ThemeResponse } from '@/types/theme'

const PAGE_SIZE = 6

function presentTheme(
  theme: ThemeResponse,
  ownedIds: ReadonlySet<string>,
  appliedId: number | null,
  appliedPalette: string,
): ThemeResponse {
  const palette = resolveAppTheme(theme.themeCode)
  const isOwned = theme.isOwned || ownedIds.has(palette) || ownedIds.has(theme.themeCode)
  const isApplied =
    appliedId != null
      ? theme.id === appliedId
      : isOwned && palette === appliedPalette && appliedPalette !== 'light'
  return { ...theme, isOwned, isApplied }
}

export default function ThemePage() {
  const { themeId } = useParams()
  const navigate = useNavigate()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const applied = useSyncExternalStore(subscribeAppTheme, getAppliedTheme)
  const ownedIds = useSyncExternalStore(subscribeOwnedThemes, getOwnedThemeIds)
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('')
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [writing, setWriting] = useState(false)
  const [themes, setThemes] = useState<ThemeResponse[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [loginHint, setLoginHint] = useState('')
  const { startCheckout, busy, error, receipt, reset } = usePortOneCheckout()

  // 페이지별 로드한 테마를 모아 상세(/theme/:id)에서 찾는다
  const [themeCache, setThemeCache] = useState<Record<string, ThemeResponse>>({})

  // 로그인/로그아웃 시 보유·적용 플래그가 바뀌므로 캐시 초기화
  useEffect(() => {
    setThemeCache({})
  }, [loggedIn])

  // 로그인 여부가 바뀌면 보유/적용 플래그가 달라지므로 목록을 다시 받는다
  useEffect(() => {
    let cancelled = false
    async function loadThemes() {
      setLoading(true)
      setListError('')
      try {
        const result = await fetchThemeList(page, PAGE_SIZE)
        if (cancelled) return
        setThemes(result.content)
        setTotalPages(Math.max(1, result.totalPages))
        setThemeCache((prev) => {
          const next = { ...prev }
          for (const theme of result.content) {
            next[String(theme.id)] = theme
          }
          return next
        })
      } catch (caught: unknown) {
        if (cancelled) return
        const message = caught instanceof Error ? caught.message : '테마 목록을 불러오지 못했습니다.'
        setListError(message)
        setThemes([])
        if (caught instanceof ApiError && caught.status === 401 && loggedIn) {
          setLoggedIn(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadThemes()
    return () => {
      cancelled = true
    }
  }, [loggedIn, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // 서버에 같은 코드가 없으면 예시 3종을 앞에 붙인다. 목록이 비면 예시만 보여 준다
  const usingExamples = !loading && themes.length === 0
  const catalog = useMemo(() => {
    const extras =
      loading || page !== 1
        ? []
        : exampleThemes.filter(
            (example) =>
              !themes.some((theme) => theme.themeCode.trim().toLowerCase() === example.themeCode),
          )
    const source = loading ? themes : [...extras, ...themes]
    return source.map((theme) => presentTheme(theme, ownedIds, applied.themeId, applied.palette))
  }, [applied.palette, applied.themeId, loading, ownedIds, page, themes])

  const matched = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return catalog
    return catalog.filter((theme) => theme.themeName.toLowerCase().includes(text))
  }, [catalog, keyword])

  // 검색은 현재 페이지 content만 필터 (서버 검색 API 없음)
  const visible = matched
  const currentPage = Math.min(page, totalPages)
  const cached = themeId ? themeCache[themeId] : undefined
  const selected = themeId
    ? (catalog.find((theme) => String(theme.id) === themeId) ??
      (cached ? presentTheme(cached, ownedIds, applied.themeId, applied.palette) : undefined))
    : undefined

  useEffect(() => {
    reset()
    setLoginHint('')
  }, [themeId, reset])

  // 서버가 이미 적용 중이라고 알려 주면 화면 팔레트도 맞춘다
  useEffect(() => {
    const serverApplied = themes.find((theme) => theme.isApplied)
    if (serverApplied) applyAppTheme(serverApplied.themeCode, serverApplied.id)
  }, [themes])

  useEffect(() => {
    if (!themeId || receipt) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') navigate('/theme')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, receipt, themeId])

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setKeyword(draft)
  }

  function grantAndApply(theme: ThemeResponse) {
    applyAppTheme(theme.themeCode, theme.id)
    setThemeOwned(resolveAppTheme(theme.themeCode))
    setThemes((current) =>
      current.map((item) => ({
        ...item,
        isOwned: item.id === theme.id ? true : item.isOwned,
        isApplied: item.id === theme.id,
      })),
    )
    setThemeCache((prev) => {
      const next: Record<string, ThemeResponse> = {}
      for (const [key, item] of Object.entries(prev)) {
        next[key] = {
          ...item,
          isOwned: item.id === theme.id ? true : item.isOwned,
          isApplied: item.id === theme.id,
        }
      }
      next[String(theme.id)] = { ...theme, isOwned: true, isApplied: true }
      return next
    })
  }

  async function handlePurchase(theme: ThemeResponse) {
    // 예시 테마는 결제 없이 바로 입힌다. 상점 테마는 결제 성공 뒤에 입힌다
    if (isExampleThemeId(theme.id)) {
      grantAndApply(theme)
      return
    }
    if (!loggedIn) {
      setLoginHint('로그인이 필요합니다.')
      return
    }
    setLoginHint('')
    const result = await startCheckout({
      paymentType: 'THEME',
      targetId: theme.id,
      orderName: theme.themeName,
    })
    if (result) grantAndApply(theme)
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
                <p className="shop-lead">
                  {usingExamples
                    ? '예시 테마 3종입니다. 구매하면 화면 색이 바로 바뀝니다.'
                    : '다양한 테마로 나만의 특별한 ITDA를 만들어보세요.'}
                </p>
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
                {usingExamples && listError && (
                  <p className="shop-lead">{listError} 예시 테마로 적용을 확인할 수 있습니다.</p>
                )}
                {loading ? (
                  <div className="empty">테마를 불러오는 중…</div>
                ) : !usingExamples && listError ? (
                  <div className="empty">{listError}</div>
                ) : visible.length === 0 ? (
                  <div className="empty">검색된 테마가 없습니다.</div>
                ) : (
                  <div className="shop-grid">
                    {visible.map((theme) => (
                      <Link key={theme.id} to={`/theme/${theme.id}`} className="shop-card">
                        <ThemeShot
                          tone={toneFromThemeCode(theme.themeCode)}
                          thumbnailUrl={theme.thumbnailUrl}
                        />
                        <span className="shop-card-foot">
                          <strong>{theme.themeName}</strong>
                          <em>{theme.isApplied ? '적용 중' : theme.isOwned ? '보유 중' : formatThemePrice(theme.price)}</em>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {!usingExamples && (
                <nav className="shop-pages" aria-label="테마 목록 페이지">
                  <button
                    type="button"
                    aria-label="이전 페이지"
                    disabled={currentPage === 1 || loading}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => {
                    const number = index + 1
                    return (
                      <button
                        key={number}
                        type="button"
                        className={number === currentPage ? 'on' : undefined}
                        aria-current={number === currentPage ? 'page' : undefined}
                        disabled={loading}
                        onClick={() => setPage(number)}
                      >
                        {number}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={currentPage === totalPages || loading}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    ›
                  </button>
                </nav>
                )}
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
            aria-label={selected ? selected.themeName : '테마'}
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
                  <ThemeShot
                    tone={toneFromThemeCode(selected.themeCode)}
                    thumbnailUrl={selected.thumbnailUrl}
                  />
                  <p className="shop-refund">
                    <span aria-hidden="true">!</span>
                    구매 후 적용 시 환불 불가능 합니다.
                  </p>
                </div>
                <div className="shop-detail-copy">
                  <h2>{selected.themeName}</h2>
                  <p>테마 코드: {selected.themeCode}</p>
                  {isExampleThemeId(selected.id) && <p>예시 테마는 결제 없이 바로 적용됩니다.</p>}
                  {selected.isApplied && <p className="shop-applied">현재 적용 중인 테마입니다.</p>}
                  <strong className="shop-price">{formatThemePrice(selected.price)}</strong>
                  {selected.isApplied ? (
                    <button type="button" className="shop-purchase" disabled>
                      적용 중
                    </button>
                  ) : selected.isOwned ? (
                    <button type="button" className="shop-purchase" onClick={() => grantAndApply(selected)}>
                      적용
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="shop-purchase"
                        disabled={busy}
                        onClick={() => handlePurchase(selected)}
                      >
                        <BagIcon />
                        {busy ? '결제창 여는 중…' : '구매'}
                      </button>
                      {(loginHint || error) && (
                        <p className="shop-pay-error" role="alert">
                          {loginHint || error}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {receipt && (
        <PaymentCompleteDialog
          orderName={receipt.orderName}
          amount={receipt.amount}
          paymentId={receipt.paymentId}
          onClose={reset}
        />
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
