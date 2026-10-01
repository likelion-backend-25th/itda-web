import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams } from 'react-router'
import { fetchPostById, toFeedPost, togglePostLike, togglePostScrap } from '@/api/post'
import { createReply, deleteReply, fetchReplies, toFeedComment, updateReply } from '@/api/reply'
import { resolveMemberImageUrl } from '@/api/member'
import PostDetail from '@/components/feed/PostDetail'
import type { Post } from '@/data/feed'
import type { PostModalState } from '@/data/feed'
import { publishPostComments, publishPostViews } from '@/data/postViewSync'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { ensureViewerLoaded, getViewerProfile, subscribeViewer } from '@/data/viewer'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { ApiError } from '@/lib/apiClient'
import { hasAdminRole } from '@/lib/authToken'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const profile = useSyncExternalStore(subscribeViewer, getViewerProfile)
  const user = useViewerUser()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const actionLockRef = useRef(new Set<string>())
  const profileRef = useRef(profile)
  profileRef.current = profile
  const background = (location.state as PostModalState | null)?.backgroundLocation

  const closeDetail = useCallback(() => {
    // 피드 위 모달로 연 경우: 히스토리 뒤로 → URL·배경 화면 복구
    if (background) {
      navigate(-1)
      return
    }
    // 공유 링크 직접 진입: 홈으로
    navigate('/', { replace: true })
  }, [background, navigate])

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
        const mapped = {
          ...toFeedPost(detail, profileRef.current),
          thread: replies.map(toFeedComment),
        }
        setPost(mapped)
        // 목록 카드 조회수를 상세 응답 기준으로 맞춤
        publishPostViews(mapped.id, mapped.views)
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
    if (post?.isMe || (profile && post?.memberId === profile.id)) return
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`like:${id}`)) return
    actionLockRef.current.add(`like:${id}`)
    setActionError('')
    const previous = { liked: post?.liked === true, likes: post?.likes ?? 0 }
    setPost((current) =>
      current && current.id === id
        ? {
            ...current,
            liked: !previous.liked,
            likes: Math.max(0, current.likes + (previous.liked ? -1 : 1)),
          }
        : current,
    )
    try {
      const result = await togglePostLike(numericId)
      setPost((current) =>
        current && current.id === id
          ? { ...current, liked: result.liked, likes: result.likesCount }
          : current,
      )
    } catch (err: unknown) {
      setPost((current) =>
        current && current.id === id
          ? { ...current, liked: previous.liked, likes: previous.likes }
          : current,
      )
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
    if (post?.isMe || (profile && post?.memberId === profile.id)) return
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || actionLockRef.current.has(`scrap:${id}`)) return
    actionLockRef.current.add(`scrap:${id}`)
    setActionError('')
    const previous = post?.bookmarked === true
    setPost((current) =>
      current && current.id === id ? { ...current, bookmarked: !previous } : current,
    )
    try {
      const result = await togglePostScrap(numericId)
      setPost((current) =>
        current && current.id === id ? { ...current, bookmarked: result.scrapped } : current,
      )
    } catch (err: unknown) {
      setPost((current) =>
        current && current.id === id ? { ...current, bookmarked: previous } : current,
      )
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
      setPost((current) => {
        if (!current || current.id !== id) return current
        const next = {
          ...current,
          comments: current.comments + 1,
          thread: [...current.thread, comment],
        }
        publishPostComments(id, next.comments)
        return next
      })
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
        const next = { ...current, thread, comments: Math.max(0, current.comments - 1) }
        publishPostComments(targetPostId, next.comments)
        return next
      })
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) setLoggedIn(false)
      throw err instanceof Error ? err : new Error('댓글을 삭제하지 못했습니다.')
    }
  }

  if (loading || error) {
    return createPortal(
      <div className="detail-backdrop" onClick={closeDetail}>
        <div
          className="detail-dialog"
          role="dialog"
          aria-modal="true"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="empty" role={error ? 'alert' : undefined}>
            {loading ? '글을 불러오는 중...' : error}
            {error ? (
              <p>
                <button type="button" className="leave-link" onClick={closeDetail}>
                  닫기
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  if (!post) return null

  return (
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
  )
}
