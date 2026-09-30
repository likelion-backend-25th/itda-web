import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { resolveMemberImageUrl } from '@/api/member'
import { categoryIdForFeed, categoryIdForUpdate, deletePost, fetchPosts, searchPosts, toFeedPost, togglePostLike, togglePostScrap, updatePost, type PostFeedQuery } from '@/api/post'
import EditPostModal from '@/components/feed/EditPostModal'
import Header from '@/components/layout/Header'
import PostCard from '@/components/feed/PostCard'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { categories, openPostDetail, type CategoryId, type Post } from '@/data/feed'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { ensureViewerLoaded, getViewerProfile, subscribeViewer } from '@/data/viewer'
import { profilePath } from '@/data/members'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { usePublishPost } from '@/hooks/post/usePublishPost'
import { ApiError } from '@/lib/apiClient'
import type { MyPost } from '@/data/mypage'

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const keyword = (searchParams.get('keyword') ?? '').trim()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const [query, setQuery] = useState(keyword)
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [actionError, setActionError] = useState('')
  const actionLockRef = useRef(new Set<string>())
  const [hasNext, setHasNext] = useState(false)
  const feedCursorRef = useRef<PostFeedQuery>({})
  const searchKeywordRef = useRef('')
  const searchCursorRef = useRef<number | null>(null)
  const hasNextRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const feedGenerationRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [writing, setWriting] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [profileError, setProfileError] = useState('')
  const user = useViewerUser()
  const { publish } = usePublishPost()
  const profile = useSyncExternalStore(subscribeViewer, getViewerProfile)
  const profileRef = useRef(profile)
  profileRef.current = profile

  const openPost = useCallback(
    (id: string) => {
      openPostDetail(navigate, location, id)
    },
    [location, navigate],
  )

  // 로그인 후 내 프로필은 viewer 캐시로 공유 (페이지 이동 시 목 사용자 깜빡임 방지)
  useEffect(() => {
    if (!loggedIn) {
      setProfileError('')
      return
    }

    let cancelled = false
    void ensureViewerLoaded()
      .then((me) => {
        if (cancelled) return
        setProfileError(me ? '' : '프로필을 불러오지 못했습니다.')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.'
        setProfileError(message)
        if (error instanceof ApiError && error.status === 401) {
          setLoggedIn(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [loggedIn])

  // 주소의 keyword 와 검색창을 맞춘다. 다른 페이지에서 검색해 들어와도 입력값이 남는다.
  useEffect(() => {
    setQuery(keyword)
  }, [keyword])

  // 로그인 상태가 바뀌면 구독 글 포함 여부가 달라지므로 목록을 처음부터 다시 받는다.
  // keyword 가 있으면 /posts/search, 없으면 메인 피드를 받는다.
  useEffect(() => {
    let cancelled = false

    async function loadFeed() {
      const generation = ++feedGenerationRef.current
      const categoryId = categoryIdForFeed(category)
      hasNextRef.current = false
      loadingMoreRef.current = false
      searchKeywordRef.current = keyword
      searchCursorRef.current = null
      feedCursorRef.current = { categoryId }
      setFeedLoading(true)
      setFeedError('')
      if (keyword) setPosts([])
      try {
        if (keyword) {
          const result = await searchPosts(keyword)
          if (cancelled || generation !== feedGenerationRef.current) return
          setPosts(result.posts.map((post) => toFeedPost(post, profileRef.current)))
          searchCursorRef.current = result.nextCursor
          hasNextRef.current = result.hasNext
          setHasNext(result.hasNext)
          return
        }
        const result = await fetchPosts({ categoryId })
        if (cancelled || generation !== feedGenerationRef.current) return
        setPosts(result.posts.map((post) => toFeedPost(post, profileRef.current)))
        feedCursorRef.current = {
          publicCursor: result.nextPublicCursor,
          subscribedCursor: result.nextSubscribedCursor,
          categoryId,
        }
        hasNextRef.current = result.hasNext
        setHasNext(result.hasNext)
      } catch (error: unknown) {
        if (cancelled || generation !== feedGenerationRef.current) return
        const message = error instanceof Error ? error.message : '글을 불러오지 못했습니다.'
        setFeedError(message)
        setPosts([])
        setHasNext(false)
        if (error instanceof ApiError && error.status === 401 && loggedIn) {
          setLoggedIn(false)
        }
      } finally {
        if (!cancelled && generation === feedGenerationRef.current) setFeedLoading(false)
      }
    }

    void loadFeed()
    return () => {
      cancelled = true
    }
  }, [category, keyword, loggedIn])

  // 프로필이 늦게 도착해도 내 글 닉네임·아바타를 맞춘다
  useEffect(() => {
    if (!profile) return
    const avatar = resolveMemberImageUrl(profile.profileImage)
    setPosts((current) =>
      current.map((post) =>
        post.memberId === profile.id
          ? {
              ...post,
              author: profile.nickname,
              avatar,
              isMe: true,
            }
          : post,
      ),
    )
  }, [profile])

  const loadMore = useCallback(async () => {
    if (!hasNextRef.current || loadingMoreRef.current) return
    const generation = feedGenerationRef.current
    loadingMoreRef.current = true
    setLoadingMore(true)
    setFeedError('')
    try {
      if (searchKeywordRef.current) {
        const result = await searchPosts(searchKeywordRef.current, searchCursorRef.current)
        if (generation !== feedGenerationRef.current) return
        const incoming = result.posts.map((post) => toFeedPost(post, profileRef.current))
        setPosts((current) => {
          const seen = new Set(current.map((post) => post.id))
          return [...current, ...incoming.filter((post) => !seen.has(post.id))]
        })
        searchCursorRef.current = result.nextCursor
        hasNextRef.current = result.hasNext
        setHasNext(result.hasNext)
        return
      }
      const result = await fetchPosts(feedCursorRef.current)
      if (generation !== feedGenerationRef.current) return
      const incoming = result.posts.map((post) => toFeedPost(post, profileRef.current))
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id))
        return [...current, ...incoming.filter((post) => !seen.has(post.id))]
      })
      feedCursorRef.current = {
        publicCursor: result.nextPublicCursor,
        subscribedCursor: result.nextSubscribedCursor,
        categoryId: feedCursorRef.current.categoryId,
      }
      hasNextRef.current = result.hasNext
      setHasNext(result.hasNext)
    } catch (error: unknown) {
      if (generation !== feedGenerationRef.current) return
      const message = error instanceof Error ? error.message : '글을 더 불러오지 못했습니다.'
      setFeedError(message)
      if (error instanceof ApiError && error.status === 401 && loggedIn) {
        setLoggedIn(false)
      }
    } finally {
      if (generation === feedGenerationRef.current) {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }
    }
  }, [loggedIn])

  // 피드 맨 아래가 보이면 nextPublicCursor / nextSubscribedCursor 로 다음 페이지를 붙인다
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || feedLoading || !hasNext) return

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
  }, [feedLoading, hasNext, loadMore, posts.length])

  useEffect(() => {
    if (!menuId) return
    function closeMenu() {
      setMenuId(null)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [menuId])

  function openEditor(post: Post) {
    setEditingPost(post)
    setMenuId(null)
  }

  async function removePost(postId: string) {
    const id = Number(postId)
    if (!Number.isInteger(id)) return
    setMenuId(null)
    setFeedError('')
    try {
      await deletePost(id)
      setPosts((current) => current.filter((item) => item.id !== postId))
      setEditingPost((current) => (current?.id === postId ? null : current))
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '글을 삭제하지 못했습니다.'
      setFeedError(message)
      if (error instanceof ApiError && error.status === 401 && loggedIn) {
        setLoggedIn(false)
      }
    }
  }

  function toEditable(post: Post): MyPost {
    const [title, ...rest] = post.content.split('\n')
    const body = rest.join('\n').trim()
    return {
      id: post.id,
      author: post.author,
      avatar: post.avatar,
      intro: '',
      category: post.category,
      categoryLabel: post.categoryLabel,
      title,
      body: body || undefined,
      images: post.images,
      comments: post.comments,
      likes: post.likes,
      liked: post.liked,
      views: post.views,
      visibility: post.visibility,
    }
  }

  const visiblePosts = useMemo(() => {
    if (keyword) return posts
    // 카드 이름은 응답 categoryName. 서버 categoryId 조회 결과와 사이드바 한글 이름이 같은 글만 남긴다.
    const selectedLabel = categories.find((item) => item.id === category)?.label
    return posts.filter((post) => category === 'all' || post.categoryLabel === selectedLabel)
  }, [category, keyword, posts])

  async function toggleLike(id: string) {
    if (!loggedIn) {
      setActionError('로그인 후 좋아요할 수 있습니다.')
      return
    }
    const target = posts.find((item) => item.id === id)
    if (target?.isMe || (profile && target?.memberId === profile.id)) return
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`like:${id}`)) return
    actionLockRef.current.add(`like:${id}`)
    setActionError('')
    try {
      const result = await togglePostLike(numericId)
      setPosts((current) =>
        current.map((post) =>
          post.id === id ? { ...post, liked: result.liked, likes: result.likesCount } : post,
        ),
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '좋아요를 반영하지 못했습니다.'
      setActionError(message)
      if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
    } finally {
      actionLockRef.current.delete(`like:${id}`)
    }
  }

  async function toggleBookmark(id: string) {
    if (!loggedIn) {
      setActionError('로그인 후 스크랩할 수 있습니다.')
      return
    }
    const target = posts.find((item) => item.id === id)
    if (target?.isMe || (profile && target?.memberId === profile.id)) return
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`scrap:${id}`)) return
    actionLockRef.current.add(`scrap:${id}`)
    setActionError('')
    try {
      const result = await togglePostScrap(numericId)
      setPosts((current) =>
        current.map((post) =>
          post.id === id ? { ...post, bookmarked: result.scrapped } : post,
        ),
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '스크랩을 반영하지 못했습니다.'
      setActionError(message)
      if (error instanceof ApiError && error.status === 401) setLoggedIn(false)
    } finally {
      actionLockRef.current.delete(`scrap:${id}`)
    }
  }

  async function publishPost(draft: PostDraft) {
    if (!profile) throw new Error('로그인 후 글을 작성할 수 있습니다.')
    const created = await publish(draft)
    const mapped = toFeedPost(created, profile)
    setPosts((current) => [mapped, ...current])
    setCategory((current) => (current === 'all' || current === draft.category ? current : 'all'))
    setWriting(false)
  }

  return (
    <div className="page">
      <div className="shell">
        <Header query={query} user={user} onQueryChange={setQuery} />
        <div className="layout">
          <Sidebar
            user={user}
            category={category}
            categoriesOpen={categoriesOpen}
            onCategoryChange={(next) => {
              setCategory(next)
              if (keyword) navigate('/')
            }}
            onToggleCategories={() => setCategoriesOpen((open) => !open)}
            onWrite={() => setWriting(true)}
          />
          <main className="feed" aria-label={keyword ? '검색 결과' : '피드'}>
            {keyword && <h2 className="my-heading">‘{keyword}’ 검색 결과</h2>}
            {profileError && loggedIn && (
              <div className="empty" role="alert">
                {profileError}
              </div>
            )}
            {feedLoading && posts.length === 0 ? (
              <div className="empty">글을 불러오는 중...</div>
            ) : feedError && posts.length === 0 ? (
              <div className="empty" role="alert">
                {feedError}
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="empty">{keyword ? '검색 결과가 없습니다.' : '해당하는 글이 없습니다.'}</div>
            ) : (
              visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canManage={
                    loggedIn &&
                    (post.memberId != null ? profile?.id === post.memberId : post.author === user.name)
                  }
                  menuOpen={menuId === post.id}
                  onOpen={openPost}
                  onToggleMenu={() => setMenuId((current) => (current === post.id ? null : post.id))}
                  onEdit={() => openEditor(post)}
                  onDelete={() => {
                    void removePost(post.id)
                  }}
                  onToggleLike={toggleLike}
                  onToggleBookmark={toggleBookmark}
                  profileHref={profilePath(post.author)}
                />
              ))
            )}
            {posts.length > 0 && feedError && (
              <div className="empty" role="alert">
                {feedError}
              </div>
            )}
            {actionError && (
              <div className="empty" role="alert">
                {actionError}
              </div>
            )}
            {hasNext && posts.length > 0 && (
              <div ref={sentinelRef} className="feed-more" aria-live="polite">
                {loadingMore ? '글을 불러오는 중...' : ''}
              </div>
            )}
          </main>
        </div>
      </div>
      {editingPost && (
        <EditPostModal
          post={toEditable(editingPost)}
          categories={categories}
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
            const mapped = toFeedPost(updated, profileRef.current)
            setPosts((current) =>
              current.map((item) =>
                item.id === String(updated.id)
                  ? {
                      ...mapped,
                      thread: item.thread,
                    }
                  : item,
              ),
            )
            setEditingPost(null)
          }}
        />
      )}
      {writing && (
        <WritePostModal
          user={user}
          categories={categories}
          onClose={() => setWriting(false)}
          onPublish={publishPost}
        />
      )}
    </div>
  )
}
