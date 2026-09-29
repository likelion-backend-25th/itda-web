import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { fetchOwnedThemeList, fetchThemeDetail, fetchThemeList } from '@/api/theme'
import CategoryFeed from '@/components/feed/CategoryFeed'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import ThemeShot, { toneFromThemeCode } from '@/components/theme/ThemeShot'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { BagIcon, CloseIcon, SearchIcon } from '@/components/icons'
import { applyAppTheme, getAppliedTheme, resolveAppTheme, subscribeAppTheme } from '@/data/appTheme'
import { myPageCategories, type CategoryId } from '@/data/feed'
import {
  formatThemePrice,
  setThemeOwned,
  syncOwnedThemes,
} from '@/data/themes'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { usePublishPost } from '@/hooks/post/usePublishPost'
import PayMethodPicker from '@/components/payment/PayMethodPicker'
import PaymentCompleteDialog from '@/components/payment/PaymentCompleteDialog'
import { usePortOneCheckout } from '@/hooks/payment/usePortOneCheckout'
import { ApiError } from '@/lib/apiClient'
import type { PayMethod } from '@/types/payment'
import type { ThemeDetailResponse, ThemeResponse } from '@/types/theme'

const PAGE_SIZE = 6

function presentTheme(
  theme: ThemeResponse,
  appliedId: number | null,
  appliedPalette: string,
): ThemeResponse {
  const palette = resolveAppTheme(theme.themeCode)
  // 보유 여부는 서버 isOwned만 본다. localStorage 팔레트 매칭은 오탐이 난다.
  const isOwned = theme.isOwned
  const isApplied =
    appliedId != null
      ? theme.id === appliedId
      : theme.isApplied === true || (isOwned && palette === appliedPalette && appliedPalette !== 'light')
  return { ...theme, isOwned, isApplied }
}

function presentDetail(
  theme: ThemeDetailResponse,
  appliedId: number | null,
  appliedPalette: string,
): ThemeDetailResponse {
  return {
    ...theme,
    ...presentTheme(theme, appliedId, appliedPalette),
  }
}

export default function ThemePage() {
  const { themeId } = useParams()
  const navigate = useNavigate()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const viewer = useViewerUser()
  const { publish } = usePublishPost()
  const applied = useSyncExternalStore(subscribeAppTheme, getAppliedTheme)
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
  const [payMethod, setPayMethod] = useState<PayMethod>('KAKAOPAY')
  const [detail, setDetail] = useState<ThemeDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const { startCheckout, busy, phase, error, receipt, reset } = usePortOneCheckout()

  // GET /themes — 판매 목록
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

  // GET /themes/owned — 보유 테마로 로컬 owned/적용 상태 동기화
  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false

    async function loadOwned() {
      try {
        const result = await fetchOwnedThemeList(1, 50)
        if (cancelled) return
        // 로컬 캐시를 서버 보유 목록으로 교체 (예전 예시 테마 오탐 제거)
        syncOwnedThemes(result.content.map((theme) => theme.themeCode.trim().toLowerCase()))
        for (const theme of result.content) {
          if (theme.isApplied) applyAppTheme(theme.themeCode, theme.id)
        }
        const ownedById = new Map(result.content.map((theme) => [theme.id, theme]))
        setThemes((current) =>
          current.map((item) => {
            const owned = ownedById.get(item.id)
            if (!owned) return { ...item, isOwned: false, isApplied: false }
            return {
              ...item,
              isOwned: true,
              isApplied: owned.isApplied,
              themeCode: owned.themeCode || item.themeCode,
            }
          }),
        )
      } catch {
        // 보유 목록 실패는 상점 목록을 막지 않는다
      }
    }

    void loadOwned()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  // GET /themes/{themeId} — 상세 모달
  useEffect(() => {
    if (!themeId) {
      setDetail(null)
      setDetailError('')
      setDetailLoading(false)
      return
    }

    const id = Number(themeId)
    if (!Number.isInteger(id) || id <= 0) {
      setDetail(null)
      setDetailError('잘못된 테마입니다.')
      setDetailLoading(false)
      return
    }

    let cancelled = false
    async function loadDetail() {
      setDetailLoading(true)
      setDetailError('')
      try {
        const result = await fetchThemeDetail(id)
        if (cancelled) return
        setDetail(result)
        if (result.isApplied) applyAppTheme(result.themeCode, result.id)
        if (result.isOwned) setThemeOwned(result.themeCode.trim().toLowerCase())
      } catch (caught: unknown) {
        if (cancelled) return
        setDetail(null)
        setDetailError(caught instanceof Error ? caught.message : '테마 상세를 불러오지 못했습니다.')
        if (caught instanceof ApiError && caught.status === 401 && loggedIn) {
          setLoggedIn(false)
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [themeId, loggedIn])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const catalog = useMemo(
    () => themes.map((theme) => presentTheme(theme, applied.themeId, applied.palette)),
    [applied.palette, applied.themeId, themes],
  )

  const matched = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return catalog
    return catalog.filter((theme) => theme.themeName.toLowerCase().includes(text))
  }, [catalog, keyword])

  const visible = matched
  const currentPage = Math.min(page, totalPages)

  const selected = useMemo(() => {
    if (!themeId) return undefined
    if (detail && String(detail.id) === themeId) {
      return presentDetail(detail, applied.themeId, applied.palette)
    }
    return catalog.find((theme) => String(theme.id) === themeId)
  }, [applied.palette, applied.themeId, catalog, detail, themeId])

  useEffect(() => {
    reset()
    setLoginHint('')
  }, [themeId, reset])

  useEffect(() => {
    const serverApplied = themes.find((theme) => theme.isApplied) ?? (detail?.isApplied ? detail : undefined)
    if (serverApplied) applyAppTheme(serverApplied.themeCode, serverApplied.id)
  }, [detail, themes])

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
    setThemeOwned(theme.themeCode.trim().toLowerCase())
    setThemes((current) =>
      current.map((item) => ({
        ...item,
        isOwned: item.id === theme.id ? true : item.isOwned,
        isApplied: item.id === theme.id,
      })),
    )
    setDetail((current) =>
      current
        ? {
            ...current,
            isOwned: current.id === theme.id ? true : current.isOwned,
            isApplied: current.id === theme.id,
          }
        : current,
    )
  }

  async function handlePurchase(theme: ThemeResponse) {
    if (!loggedIn) {
      setLoginHint('로그인이 필요합니다.')
      return
    }
    setLoginHint('')
    const result = await startCheckout({
      paymentType: 'THEME',
      targetId: theme.id,
      orderName: theme.themeName,
      payMethod,
    })
    if (result) grantAndApply(theme)
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
                <div className="shop-catalog">
                  <div className="shop-catalog-body">
                    {loading ? (
                      <div className="empty">테마를 불러오는 중…</div>
                    ) : listError ? (
                      <div className="empty">{listError}</div>
                    ) : visible.length === 0 ? (
                      <div className="empty">검색된 테마가 없습니다.</div>
                    ) : (
                      <div className="shop-grid">
                        {Array.from({ length: PAGE_SIZE }, (_, index) => {
                          const theme = visible[index]
                          if (!theme) {
                            return (
                              <div
                                key={`shop-slot-${index}`}
                                className="shop-card shop-card-slot"
                                aria-hidden="true"
                              >
                                <div className="theme-shot thumb" />
                                <span className="shop-card-foot">
                                  <strong>&nbsp;</strong>
                                  <em>&nbsp;</em>
                                </span>
                              </div>
                            )
                          }
                          return (
                            <Link key={theme.id} to={`/theme/${theme.id}`} className="shop-card">
                              <ThemeShot
                                tone={toneFromThemeCode(theme.themeCode)}
                                thumbnailUrl={theme.thumbnailUrl}
                              />
                              <span className="shop-card-foot">
                                <strong>{theme.themeName}</strong>
                                <em>
                                  {theme.isApplied
                                    ? '적용 중'
                                    : theme.isOwned
                                      ? '보유 중'
                                      : formatThemePrice(theme.price)}
                                </em>
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
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
                </div>
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
            {detailLoading && !selected ? (
              <p className="shop-missing">테마를 불러오는 중…</p>
            ) : !selected ? (
              <p className="shop-missing">{detailError || '테마를 찾을 수 없습니다.'}</p>
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
                  {detail?.id === selected.id && detail.description ? (
                    <p className="shop-detail-desc">{detail.description}</p>
                  ) : null}
                  <p>테마 코드: {selected.themeCode}</p>
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
                      <PayMethodPicker value={payMethod} disabled={busy} onChange={setPayMethod} />
                      <button
                        type="button"
                        className="shop-purchase"
                        disabled={busy}
                        onClick={() => handlePurchase(selected)}
                      >
                        <BagIcon />
                        {busy ? (phase === 'confirm' ? '결제 확인 중…' : '결제창 여는 중…') : '구매'}
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
          user={viewer}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={async (draft: PostDraft) => {
            await publish(draft)
            setWriting(false)
            navigate('/')
          }}
        />
      )}
    </div>
  )
}
