import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import EditPostModal from './EditPostModal'
import PostCard from './PostCard'
import PostDetail from './PostDetail'
import { categories, currentUser, formatDateTime, initialPosts, type CategoryId, type Post } from '../data/feed'
import { profilePath } from '../data/members'
import type { MyPost } from '../data/mypage'
import { getLoggedIn, subscribeSession } from '../data/session'

type CategoryFeedProps = {
  category: CategoryId
  query: string
}

export default function CategoryFeed({ category, query }: CategoryFeedProps) {
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  function toggleLike(id: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
          : post,
      ),
    )
  }

  function toggleBookmark(id: string) {
    setPosts((current) =>
      current.map((post) => (post.id === id ? { ...post, bookmarked: !post.bookmarked } : post)),
    )
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
    <>
      <div className="feed" aria-label="카테고리 게시글">
        {visiblePosts.length === 0 ? (
          <div className="empty">해당하는 글이 없습니다.</div>
        ) : (
          visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canManage={loggedIn && post.author === currentUser.name}
              menuOpen={menuId === post.id}
              onOpen={setSelectedId}
              onToggleMenu={() => setMenuId((current) => (current === post.id ? null : post.id))}
              onEdit={() => {
                setEditingPost(post)
                setMenuId(null)
              }}
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
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          user={currentUser}
          onClose={closeDetail}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onAddComment={addComment}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
        />
      )}
    </>
  )
}
