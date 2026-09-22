import { useCallback, useEffect, useMemo, useState } from 'react'
import EditPostModal from '../components/EditPostModal'
import Header from '../components/Header'
import PostCard from '../components/PostCard'
import PostDetail from '../components/PostDetail'
import Sidebar from '../components/Sidebar'
import WritePostModal, { type PostDraft } from '../components/WritePostModal'
import { categories, currentUser, formatDateTime, initialPosts, type CategoryId, type Post } from '../data/feed'
import type { MyPost } from '../data/mypage'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const closeDetail = useCallback(() => setSelectedId(null), [])
  const selectedPost = posts.find((post) => post.id === selectedId) ?? null

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
      author: currentUser.name,
      avatar: currentUser.avatar,
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
                  author: currentUser.name,
                  avatar: currentUser.avatar,
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
        <Header query={query} user={currentUser} onQueryChange={setQuery} />
        <div className="layout">
          <Sidebar
            user={currentUser}
            category={category}
            categoriesOpen={categoriesOpen}
            onCategoryChange={setCategory}
            onToggleCategories={() => setCategoriesOpen((open) => !open)}
            onWrite={() => setWriting(true)}
          />
          <main className="feed" aria-label="피드">
            {visiblePosts.length === 0 ? (
              <div className="empty">해당하는 글이 없습니다.</div>
            ) : (
              visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
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
          user={currentUser}
          categories={categories}
          onClose={() => setWriting(false)}
          onPublish={publishPost}
        />
      )}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          user={currentUser}
          onClose={closeDetail}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onAddComment={addComment}
        />
      )}
    </div>
  )
}
