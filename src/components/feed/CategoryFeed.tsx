import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router'
import EditPostModal from './EditPostModal'
import PostCard from './PostCard'
import { categories, currentUser, initialPosts, openPostDetail, type CategoryId, type Post } from '@/data/feed'
import { profilePath } from '@/data/members'
import type { MyPost } from '@/data/mypage'
import { getLoggedIn, subscribeSession } from '@/data/session'

type CategoryFeedProps = {
  category: CategoryId
  query: string
}

export default function CategoryFeed({ category, query }: CategoryFeedProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const openPost = useCallback(
    (id: string) => {
      openPostDetail(navigate, location, id)
    },
    [location, navigate],
  )

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
              onOpen={openPost}
              onToggleMenu={() => setMenuId((current) => (current === post.id ? null : post.id))}
              onEdit={() => {
                setEditingPost(post)
                setMenuId(null)
              }}
              onDelete={() => {
                setPosts((current) => current.filter((item) => item.id !== post.id))
                setMenuId(null)
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
    </>
  )
}
