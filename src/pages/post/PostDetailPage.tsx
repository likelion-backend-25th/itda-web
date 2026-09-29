import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { fetchPostById, toFeedPost, togglePostLike, togglePostScrap } from '@/api/post'
import { createReply, deleteReply, fetchReplies, toFeedComment, updateReply } from '@/api/reply'
import { resolveMemberImageUrl } from '@/api/member'
import Header from '@/components/layout/Header'
import PostDetail from '@/components/feed/PostDetail'
import type { Post } from '@/data/feed'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { ensureViewerLoaded, getViewerProfile, subscribeViewer } from '@/data/viewer'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { ApiError } from '@/lib/apiClient'
import { hasAdminRole } from '@/lib/authToken'

type LocationState = {
  from?: string
}

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const profile = useSyncExternalStore(subscribeViewer, getViewerProfile)
  const user = useViewerUser()
  const [query, setQuery] = useState('')
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const actionLockRef = useRef(new Set<string>())
  const profileRef = useRef(profile)
  profileRef.current = profile

  const closeDetail = useCallback(() => {
    const from = (location.state as LocationState | null)?.from
    if (from) {
      navigate(from)
      return
    }
    // 앱 안에서 들어온 경우 뒤로, 공유 링크로 바로 온 경우 홈
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate('/')
  }, [location.state, navigate])

  useEffect(() => {
    if (!loggedIn) return
    void ensureViewerLoaded().catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 401) setLoggedIn(false)
    })
  }, [loggedIn])

  useEffect(() => {
    const id = Number(postId)
    if (!Number.isInteger(id) || id <= 0) {
      setPost(null)
      setLoading(false)
      setError('잘못된 게시글 주소입니다.')
      return
    }

    let cancelled = false
    async function loadDetail() {
      setLoading(true)
      setError('')
      setActionError('')
      try {
        const [detail, replies] = await Promise.all([fetchPostById(id), fetchReplies(id)])
        if (cancelled) return
        setPost({
          ...toFeedPost(detail, profileRef.current),
          thread: replies.map(toFeedComment),
        })
      } catch (err: unknown) {
        if (cancelled) return
        setPost(null)
        setError(err instanceof Error ? err.message : '게시글을 불러오지 못했습니다.')
        if (err instanceof ApiError && err.status === 401 && loggedIn) setLoggedIn(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [loggedIn, postId])

  // 프로필이 늦게 오면 내 글 닉네임·아바타만 보강
  useEffect(() => {
    if (!profile || !post) return
    if (post.memberId !== profile.id) return
    const avatar = resolveMemberImageUrl(profile.profileImage)
    setPost((current) =>
      current
        ? {
            ...current,
            author: profile.nickname,
            avatar,
            isMe: true,
          }
        : current,
    )
  }, [profile, post?.id, post?.memberId])

  async function toggleLike(id: string) {
    if (!loggedIn) {
      setActionError('로그인 후 좋아요할 수 있습니다.')
      return
    }
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`like:${id}`)) return
    actionLockRef.current.add(`like:${id}`)
    setActionError('')
    try {
      const result = await togglePostLike(numericId)
      setPost((current) =>
        current && current.id === id
          ? { ...current, liked: result.liked, likes: result.likesCount }
          : current,
      )
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : '좋아요를 반영하지 못했습니다.')
      if (err instanceof ApiError && err.status === 401) setLoggedIn(false)
    } finally {
      actionLockRef.current.delete(`like:${id}`)
    }
  }

  async function toggleBookmark(id: string) {
    if (!loggedIn) {
      setActionError('로그인 후 스크랩할 수 있습니다.')
      return
    }
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`scrap:${id}`)) return
    actionLockRef.current.add(`scrap:${id}`)
    setActionError('')
    try {
      const result = await togglePostScrap(numericId)
      setPost((current) =>
        current && current.id === id ? { ...current, bookmarked: result.scrapped } : current,
      )
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : '스크랩을 반영하지 못했습니다.')
      if (err instanceof ApiError && err.status === 401) setLoggedIn(false)
    } finally {
      actionLockRef.current.delete(`scrap:${id}`)
    }
  }

  async function addComment(id: string, content: string) {
    if (!loggedIn) throw new Error('로그인 후 댓글을 작성할 수 있습니다.')
    const numericId = Number(id)
    if (!Number.isInteger(numericId)) throw new Error('댓글을 작성할 수 없는 글입니다.')
    try {
      const created = await createReply(numericId, { content })
      const comment = toFeedComment(created)
      setPost((current) =>
        current && current.id === id
          ? {
              ...current,
              comments: current.comments + 1,
              thread: [...current.thread, comment],
            }
          : current,
      )
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) setLoggedIn(false)
      throw err instanceof Error ? err : new Error('댓글을 등록하지 못했습니다.')
    }
  }

  async function updateComment(targetPostId: string, commentId: string, content: string) {
    const numericPostId = Number(targetPostId)
    const replyId = Number(commentId)
    if (!Number.isInteger(numericPostId) || !Number.isInteger(replyId)) {
      throw new Error('수정할 수 없는 댓글입니다.')
    }
    try {
      const updated = await updateReply(numericPostId, replyId, { content })
      const comment = toFeedComment(updated)
      setPost((current) =>
        current && current.id === targetPostId
          ? {
              ...current,
              thread: current.thread.map((item) => (item.id === commentId ? comment : item)),
            }
          : current,
      )
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) setLoggedIn(false)
      throw err instanceof Error ? err : new Error('댓글을 수정하지 못했습니다.')
    }
  }

  async function deleteComment(targetPostId: string, commentId: string) {
    const numericPostId = Number(targetPostId)
    const replyId = Number(commentId)
    if (!Number.isInteger(numericPostId) || !Number.isInteger(replyId)) {
      throw new Error('삭제할 수 없는 댓글입니다.')
    }
    try {
      await deleteReply(numericPostId, replyId)
      setPost((current) => {
        if (!current || current.id !== targetPostId) return current
        const thread = current.thread.filter((item) => item.id !== commentId)
        if (thread.length === current.thread.length) return current
        return { ...current, thread, comments: Math.max(0, current.comments - 1) }
      })
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) setLoggedIn(false)
      throw err instanceof Error ? err : new Error('댓글을 삭제하지 못했습니다.')
    }
  }

  return (
    <div className="page">
      <div className="shell">
        <Header query={query} user={user} onQueryChange={setQuery} />
        <main className="feed" aria-label="게시글 상세">
          {loading ? (
            <div className="empty">글을 불러오는 중...</div>
          ) : error ? (
            <div className="empty" role="alert">
              <p>{error}</p>
              <p>
                <Link to="/">홈으로 돌아가기</Link>
              </p>
            </div>
          ) : null}
        </main>
      </div>
      {post && (
        <PostDetail
          post={post}
          user={user}
          onClose={closeDetail}
          onToggleLike={(id) => {
            void toggleLike(id)
          }}
          onToggleBookmark={(id) => {
            void toggleBookmark(id)
          }}
          notice={actionError}
          viewerMemberId={profile?.id}
          canModerateReplies={
            profile?.role === 'ADMIN' || profile?.role === 'ROLE_ADMIN' || hasAdminRole()
          }
          onAddComment={addComment}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
        />
      )}
    </div>
  )
}
