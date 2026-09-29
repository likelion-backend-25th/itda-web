import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { resolveMemberImageUrl, toFeedUser } from '@/api/member'
import { resolvePostImageUrl } from '@/api/post'
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
import { formatDateTime, myPageCategories, postPath, type CategoryId } from '@/data/feed'
import { usePublishPost } from '@/hooks/post/usePublishPost'
import { applyAppThemeAsync, getAppliedTheme, resolveAppTheme, subscribeAppTheme } from '@/data/appTheme'
import { syncOwnedThemes } from '@/data/themes'
import { getFollowingIds, setFollowing, subscribeFollows } from '@/data/follows'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { ensureViewerLoaded, setViewerProfile } from '@/data/viewer'
import { useMyFollows } from '@/hooks/member/useMyFollows'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { ApiError } from '@/lib/apiClient'
import type { ThemeResponse } from '@/types/theme'
import {
  likedPosts,
  myPosts,
  pageProfile,
  profileStats,
  scrappedPosts,
  type MyPost,
  type OwnedTheme,
} from '@/data/mypage'

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
  const [posts, setPosts] = useState<MyPost[]>(myPosts)
  const [liked, setLiked] = useState<MyPost[]>(likedPosts)
  const [scraps, setScraps] = useState<MyPost[]>(scrappedPosts)
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
  const followedIds = useSyncExternalStore(subscribeFollows, getFollowingIds)
  const { followers, following } = useMyFollows(loggedIn)
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

  // GET /member/me — 캐시 공유. 있으면 즉시 반영, 없으면 한 번만 조회
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
        const patchMine = (items: MyPost[]) =>
          items.map((post) =>
            post.author === pageProfile.name || post.author === feed.name
              ? { ...post, author: feed.name, avatar }
              : post,
          )
        setPosts((current) => patchMine(current))
        setLiked((current) => patchMine(current))
        setScraps((current) => patchMine(current))
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

  function toggleScrap(post: MyPost) {
    setScraps((current) =>
      current.some((item) => item.id === post.id)
        ? current.filter((item) => item.id !== post.id)
        : [post, ...current],
    )
  }

  function updateList(id: string, updater: (post: MyPost) => MyPost) {
    const apply = (list: MyPost[]) => list.map((post) => (post.id === id ? updater(post) : post))
    if (tab === 'likes') setLiked(apply)
    else if (tab === 'scraps') setScraps(apply)
    else setPosts(apply)
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
                    팔로잉 <b>{following.loading ? '…' : loggedIn ? following.items.length : '-'}</b>
                  </button>
                  <button type="button" className="count-link" onClick={() => setFollowTab('followers')}>
                    팔로워 <b>{followers.loading ? '…' : loggedIn ? followers.items.length : '-'}</b>
                  </button>
                  <span>
                    게시글 <b>{profileStats.posts}</b>
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
                className={tab === 'themes' ? 'my-tab aside active' : 'my-tab aside'}
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
                  {visiblePosts.length === 0 ? (
                    <div className="empty">해당하는 글이 없습니다.</div>
                  ) : (
                    visiblePosts.map((post) => (
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
                          setPosts((current) => current.filter((item) => item.id !== post.id))
                          setMenuId(null)
                        }}
                        onToggleLike={() =>
                          updateList(post.id, (item) => ({
                            ...item,
                            liked: !item.liked,
                            likes: item.likes + (item.liked ? -1 : 1),
                          }))
                        }
                        scrapped={scraps.some((item) => item.id === post.id)}
                        onToggleScrap={tab === 'posts' ? undefined : () => toggleScrap(post)}
                      />
                    ))
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
          followedIds={followedIds}
          onToggle={setFollowing}
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
            const image = resolvePostImageUrl(created.imageUrl)
            const createdAt = new Date(created.createdAt)
            const post: MyPost = {
              id: String(created.id),
              author: viewer.name,
              avatar: viewer.avatar,
              intro: viewer.bio,
              category: draft.category,
              categoryLabel: created.categoryName || draft.categoryLabel,
              title: draft.title,
              body: draft.body,
              images: image ? [{ src: image, alt: '게시글 이미지' }] : [],
              comments: 0,
              likes: created.likeCount,
              liked: created.liked === true,
              views: created.viewCount,
              visibility: created.subscriberOnly ? 'subscribers' : 'public',
              createdAt: Number.isNaN(createdAt.getTime())
                ? formatDateTime(new Date())
                : formatDateTime(createdAt),
              thread: [],
            }
            setPosts((current) => [post, ...current])
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
          onSave={(next) => {
            setPosts((current) =>
              current.map((item) => (item.id === editingPost.id ? { ...item, ...next } : item)),
            )
            setEditingPost(null)
          }}
        />
      )}

    </div>
  )
}
