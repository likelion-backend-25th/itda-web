import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { resolveMemberImageUrl, toFeedUser } from '@/api/member'
import { fetchMyLikedPosts, fetchMyPosts, fetchMyScrappedPosts, toMyPost } from '@/api/mypage'
import { categoryIdForUpdate, deletePost, togglePostLike, togglePostScrap, updatePost } from '@/api/post'
import { applyTheme, fetchOwnedThemeList } from '@/api/theme'
import EditPostModal from '@/components/feed/EditPostModal'
import FollowList, { type FollowTab } from '@/components/profile/FollowList'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import Header from '@/components/layout/Header'
import MyPostCard from '@/components/feed/MyPostCard'
import Sidebar from '@/components/layout/Sidebar'
import ThemeDetail from '@/components/theme/ThemeDetail'
import ProfileEditModal, { type ProfileForm } from '@/components/profile/ProfileEditModal'
import ThemeShot, { toneFromThemeCode } from '@/components/theme/ThemeShot'
import { GearIcon, HeadsetIcon } from '@/components/icons'
import { myPageCategories, postPath, type CategoryId } from '@/data/feed'
import { usePublishPost } from '@/hooks/post/usePublishPost'
import { applyAppThemeAsync, getAppliedTheme, resolveAppTheme, subscribeAppTheme } from '@/data/appTheme'
import { syncOwnedThemes } from '@/data/themes'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { ensureViewerLoaded, getViewerProfile, setViewerProfile, subscribeViewer } from '@/data/viewer'
import { useFollow } from '@/hooks/member/useFollow'
import { useMyFollows } from '@/hooks/member/useMyFollows'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { ApiError } from '@/lib/apiClient'
import type { ThemeResponse } from '@/types/theme'
import { pageProfile, type MyPost, type OwnedTheme } from '@/data/mypage'

type MyTab = 'posts' | 'likes' | 'scraps' | 'themes'

function ownedFromApi(themes: ThemeResponse[], appliedId: number | null): OwnedTheme[] {
  return themes.map((theme) => {
    const tone = toneFromThemeCode(theme.themeCode)
    return {
      id: resolveAppTheme(theme.themeCode),
      themeId: theme.id,
      name: theme.themeName,
      title: theme.themeName,
      subtitle: theme.themeCode,
      tone,
      thumbnailUrl: theme.thumbnailUrl,
      active: appliedId != null ? theme.id === appliedId : theme.isApplied,
    }
  })
}

const tabCopy: Record<Exclude<MyTab, 'themes'>, string> = {
  posts: '본인 작성 게시글 목록',
  likes: '좋아요한 게시글 목록',
  scraps: '스크랩한 게시글 목록',
}

export default function MyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [tab, setTab] = useState<MyTab>('posts')
  const [posts, setPosts] = useState<MyPost[]>([])
  const [liked, setLiked] = useState<MyPost[]>([])
  const [scraps, setScraps] = useState<MyPost[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [listError, setListError] = useState('')
  const [actionError, setActionError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const cursorRef = useRef<number | null>(null)
  const hasMoreRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const listGenRef = useRef(0)
  const actionLockRef = useRef(new Set<string>())
  const applied = useSyncExternalStore(subscribeAppTheme, getAppliedTheme)
  const [themes, setThemes] = useState<OwnedTheme[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<MyPost | null>(null)
  const { publish } = usePublishPost()
  const [writing, setWriting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [followTab, setFollowTab] = useState<FollowTab | null>(null)
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const follow = useFollow(loggedIn)
  const { followers, following } = useMyFollows(loggedIn, follow.version)
  const viewerProfile = useSyncExternalStore(subscribeViewer, getViewerProfile)
  // GET /members/me 의 followerCount·followingCount·postCount
  const profileCount = (count: number | undefined) => (!loggedIn ? '-' : (count ?? '…'))
  const cachedViewer = useViewerUser()
  const [profile, setProfile] = useState<ProfileForm>(() => ({
    name: cachedViewer.name || '',
    bio: cachedViewer.bio || '',
    avatar: cachedViewer.avatar || '',
    interests: ['food', 'travel', 'cooking', 'game'],
  }))
  const viewer = {
    name: profile.name || cachedViewer.name,
    handle: cachedViewer.handle || pageProfile.handle,
    avatar: profile.avatar || cachedViewer.avatar,
    bio: profile.bio ? `소개글 - ${profile.bio}` : cachedViewer.bio,
  }

  const openPost = useCallback(
    (id: string) => {
      navigate(postPath(id), { state: { from: `${location.pathname}${location.search}` } })
    },
    [location.pathname, location.search, navigate],
  )

  // GET /members/me — 캐시 공유. 있으면 즉시 반영, 없으면 한 번만 조회
  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false

    async function loadMe() {
      try {
        const me = await ensureViewerLoaded()
        if (cancelled || !me) return
        setViewerProfile(me)
        const feed = toFeedUser(me)
        const avatar = resolveMemberImageUrl(me.profileImage)
        setProfile((current) => ({
          ...current,
          name: feed.name,
          bio: feed.bio || current.bio,
          avatar,
        }))
      } catch (error: unknown) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
      }
    }

    void loadMe()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  // GET /themes/owned — 마이페이지 보유 테마 (로그인 시에만, 적용 직후 재덮어쓰기 방지)
  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false
    async function loadOwned() {
      try {
        const result = await fetchOwnedThemeList(1, 50)
        if (cancelled) return
        syncOwnedThemes(result.content.map((theme) => theme.themeCode.trim().toLowerCase()))
        const serverApplied = result.content.find((theme) => theme.isApplied)
        const local = getAppliedTheme()
        // 서버에 저장된 적용 테마와 로컬이 다를 때만 CSS 동기화
        if (
          serverApplied &&
          (local.themeId == null || serverApplied.id !== local.themeId)
        ) {
          void applyAppThemeAsync(serverApplied.themeCode, serverApplied.id)
        }
        setThemes(ownedFromApi(result.content, serverApplied?.id ?? local.themeId))
      } catch {
        // 보유 목록 실패 시 빈 목록 유지
      }
    }
    void loadOwned()
    return () => {
      cancelled = true
    }
    // applied.themeId 를 deps에 넣으면 적용 직후 서버 구버전으로 덮어쓴다
  }, [loggedIn])

  // 게시글 / 좋아요 / 스크랩 탭은 로그인 회원 기준으로 다시 받는다
  useEffect(() => {
    if (!loggedIn || tab === 'themes') return
    const generation = ++listGenRef.current
    cursorRef.current = null
    hasMoreRef.current = false
    loadingMoreRef.current = false
    setListLoading(true)
    setListError('')
    setActionError('')
    setHasMore(false)
    setLoadingMore(false)

    const request =
      tab === 'likes' ? fetchMyLikedPosts() : tab === 'scraps' ? fetchMyScrappedPosts() : fetchMyPosts()

    void request
      .then((result) => {
        if (generation !== listGenRef.current) return
        const mapped = result.posts.map((item) => toMyPost(item, getViewerProfile()))
        if (tab === 'likes') setLiked(mapped)
        else if (tab === 'scraps') setScraps(mapped)
        else setPosts(mapped)
        cursorRef.current = result.nextCursor
        hasMoreRef.current = result.hadNext
        setHasMore(result.hadNext)
      })
      .catch((error: unknown) => {
        if (generation !== listGenRef.current) return
        setListError(error instanceof Error ? error.message : '글을 불러오지 못했습니다.')
        if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
      })
      .finally(() => {
        if (generation === listGenRef.current) setListLoading(false)
      })
  }, [loggedIn, tab])

  const loadMore = useCallback(async () => {
    if (!loggedIn || tab === 'themes' || !hasMoreRef.current || loadingMoreRef.current) return
    const generation = listGenRef.current
    loadingMoreRef.current = true
    setLoadingMore(true)
    setListError('')
    try {
      const cursor = cursorRef.current
      const result =
        tab === 'likes'
          ? await fetchMyLikedPosts(cursor)
          : tab === 'scraps'
            ? await fetchMyScrappedPosts(cursor)
            : await fetchMyPosts(cursor)
      if (generation !== listGenRef.current) return
      const mapped = result.posts.map((item) => toMyPost(item, getViewerProfile()))
      const append = (current: MyPost[]) => {
        const seen = new Set(current.map((item) => item.id))
        return [...current, ...mapped.filter((item) => !seen.has(item.id))]
      }
      if (tab === 'likes') setLiked(append)
      else if (tab === 'scraps') setScraps(append)
      else setPosts(append)
      cursorRef.current = result.nextCursor
      hasMoreRef.current = result.hadNext
      setHasMore(result.hadNext)
    } catch (error: unknown) {
      if (generation !== listGenRef.current) return
      setListError(error instanceof Error ? error.message : '글을 더 불러오지 못했습니다.')
      if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
    } finally {
      if (generation === listGenRef.current) {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }
  }, [loggedIn, tab])

  // 글 카드 맨 아래가 보이면 nextCursor 로 다음 페이지를 붙인다
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || tab === 'themes' || listLoading || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore()
        }
      },
      { rootMargin: '240px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, listLoading, loadMore, tab, posts.length, liked.length, scraps.length])

  useEffect(() => {
    if (!menuId) return
    function closeMenu() {
      setMenuId(null)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [menuId])

  const visibleThemes = themes.map((theme) => ({
    ...theme,
    active:
      theme.themeId != null && applied.themeId != null
        ? theme.themeId === applied.themeId
        : resolveAppTheme(theme.tone) === applied.palette,
  }))
  const detailTheme = visibleThemes.find((theme) => theme.id === detailId) ?? null
  const source = tab === 'likes' ? liked : tab === 'scraps' ? scraps : posts

  const visiblePosts = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return source.filter((post) => {
      const categoryMatch = category === 'all' || post.category === category
      const keywordMatch =
        keyword.length === 0 ||
        post.title.toLowerCase().includes(keyword) ||
        post.categoryLabel.toLowerCase().includes(keyword) ||
        (post.body ?? '').toLowerCase().includes(keyword)
      return categoryMatch && keywordMatch
    })
  }, [category, query, source])

  function isOwnPost(post: MyPost) {
    return tab === 'posts' || (viewerProfile != null && post.memberId === viewerProfile.id)
  }

  function patchPost(id: string, updater: (post: MyPost) => MyPost) {
    const apply = (list: MyPost[]) => list.map((item) => (item.id === id ? updater(item) : item))
    setPosts(apply)
    setLiked(apply)
    setScraps(apply)
  }

  async function toggleLike(post: MyPost) {
    if (!loggedIn || isOwnPost(post)) return
    const numericId = Number(post.id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`like:${post.id}`)) return
    actionLockRef.current.add(`like:${post.id}`)
    setActionError('')
    try {
      const result = await togglePostLike(numericId)
      patchPost(post.id, (item) => ({ ...item, liked: result.liked, likes: result.likesCount }))
      if (tab === 'likes' && !result.liked) {
        setLiked((current) => current.filter((item) => item.id !== post.id))
      }
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : '좋아요를 반영하지 못했습니다.')
      if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
    } finally {
      actionLockRef.current.delete(`like:${post.id}`)
    }
  }

  async function toggleScrap(post: MyPost) {
    if (!loggedIn || isOwnPost(post)) return
    const numericId = Number(post.id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`scrap:${post.id}`)) return
    actionLockRef.current.add(`scrap:${post.id}`)
    setActionError('')
    try {
      const result = await togglePostScrap(numericId)
      patchPost(post.id, (item) => ({ ...item, scrapped: result.scrapped }))
      if (tab === 'scraps' && !result.scrapped) {
        setScraps((current) => current.filter((item) => item.id !== post.id))
      }
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : '스크랩을 반영하지 못했습니다.')
      if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
    } finally {
      actionLockRef.current.delete(`scrap:${post.id}`)
    }
  }

  async function removePost(postId: string) {
    const id = Number(postId)
    if (!Number.isInteger(id)) return
    setMenuId(null)
    setActionError('')
    try {
      await deletePost(id)
      setPosts((current) => current.filter((item) => item.id !== postId))
      setLiked((current) => current.filter((item) => item.id !== postId))
      setScraps((current) => current.filter((item) => item.id !== postId))
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : '글을 삭제하지 못했습니다.')
      if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
    }
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
          <main className="my-main my-board" aria-label="마이페이지">
            <section className="my-summary">
              <img src={viewer.avatar} alt="" />
              <div>
                <h2>{viewer.name}</h2>
                <p className="my-intro">{viewer.bio}</p>
                <p className="my-counts">
                  <button type="button" className="count-link" onClick={() => setFollowTab('following')}>
                    팔로잉 <b>{profileCount(viewerProfile?.followingCount)}</b>
                  </button>
                  <button type="button" className="count-link" onClick={() => setFollowTab('followers')}>
                    팔로워 <b>{profileCount(viewerProfile?.followerCount)}</b>
                  </button>
                  <span>
                    게시글 <b>{profileCount(viewerProfile?.postCount)}</b>
                  </span>
                </p>
              </div>
              <button type="button" className="settings-btn" onClick={() => setSettingsOpen(true)}>
                <GearIcon />
                설정
              </button>
            </section>

            <div className="my-tabs" role="tablist" aria-label="마이페이지 메뉴">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'posts'}
                className={tab === 'posts' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('posts')}
              >
                게시글
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'likes'}
                className={tab === 'likes' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('likes')}
              >
                좋아요
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'scraps'}
                className={tab === 'scraps' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('scraps')}
              >
                스크랩
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'themes'}
                className={tab === 'themes' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('themes')}
              >
                보유테마
              </button>
            </div>

            {tab === 'themes' ? (
              visibleThemes.length === 0 ? (
                <div className="empty">구매한 테마가 없습니다.</div>
              ) : (
              <div className="theme-grid">
                {visibleThemes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={theme.active ? 'theme-card on' : 'theme-card'}
                    aria-pressed={theme.active}
                    onClick={() => setDetailId(theme.id)}
                  >
                    <ThemeShot tone={theme.tone} thumbnailUrl={theme.thumbnailUrl} />
                    <strong>{theme.name}</strong>
                  </button>
                ))}
              </div>
              )
            ) : (
              <>
                <h3 className="my-heading">{tabCopy[tab]}</h3>
                <div className="my-feed">
                  {!loggedIn ? (
                    <div className="empty">로그인 후 확인할 수 있습니다.</div>
                  ) : listLoading && source.length === 0 ? (
                    <div className="empty">글을 불러오는 중...</div>
                  ) : listError && source.length === 0 ? (
                    <div className="empty" role="alert">
                      {listError}
                    </div>
                  ) : visiblePosts.length === 0 ? (
                    <div className="empty">해당하는 글이 없습니다.</div>
                  ) : (
                    visiblePosts.map((post) => {
                      const own = isOwnPost(post)
                      return (
                        <MyPostCard
                          key={post.id}
                          post={post}
                          canManage={tab === 'posts'}
                          menuOpen={menuId === post.id}
                          onOpen={() => openPost(post.id)}
                          onToggleMenu={() => setMenuId((current) => (current === post.id ? null : post.id))}
                          onEdit={() => {
                            setEditingPost(post)
                            setMenuId(null)
                          }}
                          onDelete={() => {
                            void removePost(post.id)
                          }}
                          onToggleLike={own ? undefined : () => void toggleLike(post)}
                          scrapped={post.scrapped === true}
                          onToggleScrap={own ? undefined : () => void toggleScrap(post)}
                        />
                      )
                    })
                  )}
                  {loggedIn && hasMore && source.length > 0 && (
                    <div ref={sentinelRef} className="feed-more" aria-live="polite">
                      {loadingMore ? '글을 불러오는 중...' : ''}
                    </div>
                  )}
                  {listError && source.length > 0 && (
                    <div className="empty" role="alert">
                      {listError}
                    </div>
                  )}
                  {actionError && (
                    <div className="empty" role="alert">
                      {actionError}
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="support">
              <Link to="/support" className="support-fab">
                <HeadsetIcon />
                <span>
                  고객센터
                  <small>환불 신청</small>
                </span>
              </Link>
            </div>
          </main>
        </div>
      </div>

      {followTab && (
        <FollowList
          initialTab={followTab}
          followers={followers.items}
          following={following.items}
          followedIds={follow.followedIds}
          pendingIds={follow.pendingIds}
          actionError={follow.error}
          viewerId={viewerProfile ? String(viewerProfile.id) : null}
          onToggle={(memberId, next) => void follow.toggle(memberId, next)}
          onClose={() => setFollowTab(null)}
          followersLoading={followers.loading}
          followersError={followers.error}
          followingLoading={following.loading}
          followingError={following.error}
        />
      )}

      {settingsOpen && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onSaveProfile={(next) => setProfile((current) => ({ ...current, ...next }))}
          onSaveInterests={(interests) => setProfile((current) => ({ ...current, interests }))}
        />
      )}

      {detailTheme && (
        <ThemeDetail
          theme={detailTheme}
          onClose={() => setDetailId(null)}
          onApply={() => {
            const id = detailTheme.themeId
            if (id == null) {
              setDetailId(null)
              return
            }
            void (async () => {
              try {
                await applyTheme(id)
                await applyAppThemeAsync(detailTheme.subtitle || detailTheme.tone, id)
                setThemes((current) =>
                  current.map((item) => ({
                    ...item,
                    active: item.themeId === id,
                  })),
                )
              } catch {
                // 폴백은 applyAppThemeAsync 내부
              } finally {
                setDetailId(null)
              }
            })()
          }}
        />
      )}

      {writing && (
        <WritePostModal
          user={viewer}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={async (draft: PostDraft) => {
            const created = await publish(draft)
            const post = toMyPost(created, getViewerProfile())
            setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)])
            setTab('posts')
            setCategory((current) => (current === 'all' || current === draft.category ? current : 'all'))
            setWriting(false)
          }}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={async (next) => {
            const id = Number(editingPost.id)
            if (!Number.isInteger(id) || editingPost.categoryId == null) {
              throw new Error('수정할 수 없는 글입니다.')
            }
            const content = next.body ? `${next.title}\n${next.body}` : next.title
            const updated = await updatePost(id, {
              request: {
                categoryId: categoryIdForUpdate(
                  next.categoryLabel,
                  editingPost.categoryId,
                  editingPost.categoryLabel,
                ),
                content,
                subscriberOnly: next.visibility === 'subscribers',
              },
              image: next.imageFile ?? null,
            })
            const mapped = toMyPost(updated, getViewerProfile())
            setPosts((current) => current.map((item) => (item.id === mapped.id ? mapped : item)))
            setEditingPost(null)
          }}
        />
      )}

    </div>
  )
}
