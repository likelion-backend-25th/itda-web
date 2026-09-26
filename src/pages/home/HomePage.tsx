import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { fetchMyProfile, toFeedUser } from '@/api/member'
import { fetchPostById, fetchPosts, toFeedPost, type PostFeedQuery } from '@/api/post'
import EditPostModal from '@/components/feed/EditPostModal'
import Header from '@/components/layout/Header'
import PostCard from '@/components/feed/PostCard'
import PostDetail from '@/components/feed/PostDetail'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { categories, currentUser, formatDateTime, type CategoryId, type FeedUser, type Post } from '@/data/feed'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { profilePath } from '@/data/members'
import { ApiError } from '@/lib/apiClient'
import type { MyPost } from '@/data/mypage'
import type { MemberProfileResponse } from '@/types/member'

const guestUser: FeedUser = {
  name: '',
  handle: '',
  bio: '',
  avatar: '',
}

export default function HomePage() {
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [hasNext, setHasNext] = useState(false)
  const feedCursorRef = useRef<PostFeedQuery>({})
  const hasNextRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const feedGenerationRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null)
  const [profileError, setProfileError] = useState('')
  const profileRef = useRef(profile)
  profileRef.current = profile
  const closeDetail = useCallback(() => setSelectedId(null), [])
  const selectedPost = posts.find((post) => post.id === selectedId) ?? null

  // 로그인 후 JWT로 내 프로필(/member/me) 조회
  useEffect(() => {
    if (!loggedIn) {
      setProfile(null)
      setProfileError('')
      return
    }

    let cancelled = false
    async function loadProfile() {
      try {
        const me = await fetchMyProfile()
        if (cancelled) return
        setProfile(me)
        setProfileError('')
      } catch (error: unknown) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.'
        setProfileError(message)
        setProfile(null)
        // 토큰 만료·무효면 로그아웃 처리
        if (error instanceof ApiError && error.status === 401) {
          setLoggedIn(false)
        }
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  const user: FeedUser = profile ? toFeedUser(profile) : loggedIn ? currentUser : guestUser

  // 로그인 상태가 바뀌면 구독 글 포함 여부가 달라지므로 피드를 처음부터 다시 받는다
  useEffect(() => {
    let cancelled = false

    async function loadFeed() {
      const generation = ++feedGenerationRef.current
      hasNextRef.current = false
      feedCursorRef.current = {}
      loadingMoreRef.current = false
      setFeedLoading(true)
      setFeedError('')
      try {
        const result = await fetchPosts()
        if (cancelled || generation !== feedGenerationRef.current) return
        setPosts(result.posts.map((post) => toFeedPost(post, profileRef.current)))
        feedCursorRef.current = {
          publicCursor: result.nextPublicCursor,
          subscribedCursor: result.nextSubscribedCursor,
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
  }, [loggedIn])

  // 프로필이 늦게 도착해도 내 글 닉네임·아바타를 맞춘다
  useEffect(() => {
    if (!profile) return
    const avatar = profile.profileImage?.trim() ? profile.profileImage : undefined
    setPosts((current) =>
      current.map((post) =>
        post.memberId === profile.id
          ? {
              ...post,
              author: profile.nickname,
              avatar: avatar ?? post.avatar,
              isMe: true,
            }
          : post,
      ),
    )
  }, [profile])

  // 카드를 열면 getPostById로 최신 본문·조회수를 받는다
  useEffect(() => {
    if (selectedId == null) return
    const id = Number(selectedId)
    if (!Number.isInteger(id)) return

    let cancelled = false
    async function loadDetail() {
      try {
        const detail = await fetchPostById(id)
        if (cancelled) return
        const next = toFeedPost(detail, profileRef.current)
        setPosts((current) =>
          current.map((post) =>
            post.id === String(detail.id)
              ? {
                  ...next,
                  liked: post.liked,
                  likes: post.liked ? post.likes : next.likes,
                  bookmarked: post.bookmarked,
                  comments: post.comments,
                  thread: post.thread,
                }
              : post,
          ),
        )
      } catch (error: unknown) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401 && loggedIn) {
          setLoggedIn(false)
        }
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [loggedIn, selectedId])

  const loadMore = useCallback(async () => {
    if (!hasNextRef.current || loadingMoreRef.current) return
    const generation = feedGenerationRef.current
    loadingMoreRef.current = true
    setLoadingMore(true)
    setFeedError('')
    try {
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
    const keyword = query.trim().toLowerCase()
    // API 글의 category 는 아직 'etc' 고정이라, 사이드바 한글 이름과 categoryName 을 비교한다.
    const selectedLabel = categories.find((item) => item.id === category)?.label
    return posts.filter((post) => {
      const categoryMatch = category === 'all' || post.categoryLabel === selectedLabel
      const keywordMatch =
        keyword.length === 0 ||
        post.author.toLowerCase().includes(keyword) ||
        post.categoryLabel.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword)
      return categoryMatch && keywordMatch
    })
  }, [category, posts, query])

  function toggleLike(id: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      ),
    )
  }

  function toggleBookmark(id: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, bookmarked: !post.bookmarked } : post,
      ),
    )
  }

  function publishPost(draft: PostDraft) {
    const now = new Date()
    const post: Post = {
      id: `post-${now.getTime()}`,
      author: user.name,
      avatar: user.avatar,
      time: '방금 전',
      category: draft.category,
      categoryLabel: draft.categoryLabel,
      isMe: true,
      content: draft.content,
      images: draft.images,
      createdAt: formatDateTime(now),
      comments: 0,
      likes: 0,
      liked: false,
      views: 0,
      bookmarked: false,
      thread: [],
    }
    setPosts((current) => [post, ...current])
    setCategory((current) => (current === 'all' || current === draft.category ? current : 'all'))
    setWriting(false)
  }

  function updateComment(postId: string, commentId: string, content: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              thread: post.thread.map((comment) =>
                comment.id === commentId ? { ...comment, content } : comment,
              ),
            }
          : post,
      ),
    )
  }

  function deleteComment(postId: string, commentId: string) {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post
        const thread = post.thread.filter((comment) => comment.id !== commentId)
        if (thread.length === post.thread.length) return post
        return { ...post, thread, comments: Math.max(0, post.comments - 1) }
      }),
    )
  }

  function addComment(id: string, content: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              comments: post.comments + 1,
              thread: [
                {
                  id: `comment-${Date.now()}`,
                  author: user.name,
                  avatar: user.avatar,
                  createdAt: formatDateTime(new Date()),
                  content,
                },
                ...post.thread,
              ],
            }
          : post,
      ),
    )
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
            onCategoryChange={setCategory}
            onToggleCategories={() => setCategoriesOpen((open) => !open)}
            onWrite={() => setWriting(true)}
          />
          <main className="feed" aria-label="피드">
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
              <div className="empty">해당하는 글이 없습니다.</div>
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
                  onOpen={setSelectedId}
                  onToggleMenu={() => setMenuId((current) => (current === post.id ? null : post.id))}
                  onEdit={() => openEditor(post)}
                  onDelete={() => {
                    setPosts((current) => current.filter((item) => item.id !== post.id))
                    setMenuId(null)
                    if (selectedId === post.id) setSelectedId(null)
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
          onSave={(next) => {
            setPosts((current) =>
              current.map((item) =>
                item.id === editingPost.id
                  ? {
                      ...item,
                      content: next.body ? `${next.title}\n${next.body}` : next.title,
                      category: next.category,
                      categoryLabel: next.categoryLabel,
                      images: next.images,
                      visibility: next.visibility,
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
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          user={user}
          onClose={closeDetail}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onAddComment={addComment}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
        />
      )}
    </div>
  )
}
