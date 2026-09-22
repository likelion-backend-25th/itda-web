import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { fetchMyProfile, toFeedUser } from '@/api/member'
import EditPostModal from '@/components/feed/EditPostModal'
import Header from '@/components/layout/Header'
import PostCard from '@/components/feed/PostCard'
import PostDetail from '@/components/feed/PostDetail'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { categories, currentUser, formatDateTime, initialPosts, type CategoryId, type FeedUser, type Post } from '@/data/feed'
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
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null)
  const [profileError, setProfileError] = useState('')
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
    return posts.filter((post) => {
      const categoryMatch = category === 'all' || post.category === category
      const publicPost = post.visibility !== 'subscribers'
      const keywordMatch =
        keyword.length === 0 ||
        post.author.toLowerCase().includes(keyword) ||
        post.categoryLabel.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword)
      return publicPost && categoryMatch && keywordMatch
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
            {visiblePosts.length === 0 ? (
              <div className="empty">해당하는 글이 없습니다.</div>
            ) : (
              visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canManage={loggedIn && post.author === user.name}
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
