import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import type { FeedUser, Post } from '@/data/feed'
import { profileHrefForMember } from '@/data/members'
import { getViewerProfile, subscribeViewer } from '@/data/viewer'
import { BookmarkIcon, CloseIcon, CommentIcon, DotsIcon, EyeIcon, HeartIcon } from '@/components/icons'

type PostDetailProps = {
  post: Post
  user: FeedUser
  onClose: () => void
  onToggleLike: (id: string) => void
  onToggleBookmark: (id: string) => void
  notice?: string
  /** 로그인한 회원 id. 댓글 memberId 와 같으면 수정·삭제할 수 있다. */
  viewerMemberId?: number
  /** ADMIN 이면 남의 댓글도 삭제할 수 있다. */
  canModerateReplies?: boolean
  onAddComment: (id: string, content: string) => void | Promise<void>
  onUpdateComment: (postId: string, commentId: string, content: string) => void | Promise<void>
  onDeleteComment: (postId: string, commentId: string) => void | Promise<void>
}

export default function PostDetail({
  post,
  user,
  onClose,
  onToggleLike,
  onToggleBookmark,
  notice = '',
  viewerMemberId,
  canModerateReplies = false,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: PostDetailProps) {
  const suspended = useSyncExternalStore(subscribeViewer, getViewerProfile)?.status === 'SUSPENDED'
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // 글 카드 클릭 → 상세 진입 직후, 같은 포인터 이벤트가 백드롭/닫기에 먹으면 바로 홈으로 튕긴다
  const ignoreCloseUntilRef = useRef(0)
  const [draft, setDraft] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [menuCommentId, setMenuCommentId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    ignoreCloseUntilRef.current = Date.now() + 400
    closeRef.current?.focus({ preventScroll: true })
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  function requestClose() {
    if (Date.now() < ignoreCloseUntilRef.current) return
    onCloseRef.current()
  }

  useEffect(() => {
    setDraft('')
    setCommentError('')
    setMenuCommentId(null)
    setEditingId(null)
    setEditDraft('')
  }, [post.id])

  useEffect(() => {
    if (!menuCommentId) return
    function closeMenu() {
      setMenuCommentId(null)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [menuCommentId])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || savingComment || suspended) return
    setSavingComment(true)
    setCommentError('')
    try {
      await onAddComment(post.id, content)
      setDraft('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '댓글을 등록하지 못했습니다.'
      setCommentError(message)
    } finally {
      setSavingComment(false)
    }
  }

  async function saveComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = editDraft.trim()
    if (!editingId || !content || savingComment) return
    setSavingComment(true)
    setCommentError('')
    try {
      await onUpdateComment(post.id, editingId, content)
      setEditingId(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '댓글을 수정하지 못했습니다.'
      setCommentError(message)
    } finally {
      setSavingComment(false)
    }
  }

  async function removeComment(commentId: string) {
    if (savingComment) return
    setSavingComment(true)
    setCommentError('')
    setMenuCommentId(null)
    try {
      await onDeleteComment(post.id, commentId)
      if (editingId === commentId) setEditingId(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '댓글을 삭제하지 못했습니다.'
      setCommentError(message)
    } finally {
      setSavingComment(false)
    }
  }

  return createPortal(
    <div className="detail-backdrop" onClick={requestClose}>
      <div
        className="detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="detail-top">
          <span className="detail-chip" id={titleId}>
            {post.categoryLabel}
          </span>
          <button ref={closeRef} type="button" className="detail-close" aria-label="닫기" onClick={requestClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="detail-body">
          <AuthorIdentity
            href={profileHrefForMember(post.memberId, post.author, viewerMemberId)}
            name={post.author}
            avatar={post.avatar}
            isMe={post.isMe}
            meta={post.visibility === 'subscribers' ? '구독자 전용' : '전체 공개'}
          />
          <p className="post-text">{post.content}</p>
        </div>

        <div className={post.images.length === 1 ? 'detail-photos single' : 'detail-photos'}>
          {post.images.map((image) => (
            <img key={image.src} src={image.src} alt={image.alt} />
          ))}
        </div>

        {notice && (
          <p className="editor-error" role="alert">
            {notice}
          </p>
        )}
        <div className="detail-stats">
          <span className="detail-stat">
            <CommentIcon />
            <span>댓글 {post.comments}</span>
          </span>
          {post.isMe ? (
            <span className={post.liked ? 'detail-stat liked' : 'detail-stat'} aria-label="좋아요">
              <HeartIcon filled={post.liked} />
              <span>좋아요 {post.likes}</span>
            </span>
          ) : (
            <button
              type="button"
              className={post.liked ? 'detail-stat liked' : 'detail-stat'}
              aria-pressed={post.liked}
              onClick={() => onToggleLike(post.id)}
            >
              <HeartIcon filled={post.liked} />
              <span>좋아요 {post.likes}</span>
            </button>
          )}
          <span className="detail-stat">
            <EyeIcon />
            <span>조회수 {post.views}</span>
          </span>
          {post.isMe ? (
            <span className="detail-bookmark" aria-label="스크랩">
              <BookmarkIcon filled={false} />
            </span>
          ) : (
            <button
              type="button"
              className={post.bookmarked ? 'detail-bookmark on' : 'detail-bookmark'}
              aria-pressed={post.bookmarked}
              aria-label={post.bookmarked ? '스크랩 해제' : '스크랩'}
              onClick={() => onToggleBookmark(post.id)}
            >
              <BookmarkIcon filled={post.bookmarked} />
            </button>
          )}
          <p className="detail-date">
            작성 {post.createdAt}
            {post.updatedAt ? ` · 수정 ${post.updatedAt}` : ''}
          </p>
        </div>

        <section className="detail-comments" aria-label="댓글">
          <div className="composer">
            <img src={user.avatar} alt="" />
            <div>
              <strong>{user.name}</strong>
              {suspended ? (
                <p className="write-blocked">활동 정지 상태에서는 댓글을 작성할 수 없습니다.</p>
              ) : (
                <form onSubmit={(event) => void submitComment(event)}>
                  <input
                    value={draft}
                    placeholder="댓글을 남겨주세요 :)"
                    disabled={savingComment}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <button type="submit" disabled={savingComment || draft.trim().length === 0}>
                    {savingComment ? '작성 중...' : '작성'}
                  </button>
                </form>
              )}
              {commentError && (
                <p className="editor-error" role="alert">
                  {commentError}
                </p>
              )}
            </div>
          </div>

          {post.thread.map((comment) => {
            const isAuthor =
              comment.memberId != null
                ? viewerMemberId != null && comment.memberId === viewerMemberId
                : comment.author === user.name
            const canEdit = isAuthor
            const canDelete = isAuthor || (canModerateReplies && comment.memberId != null)
            const editing = editingId === comment.id
            const href = profileHrefForMember(comment.memberId, comment.author, viewerMemberId)
            return (
              <article key={comment.id} className="comment">
                {href ? (
                  <Link to={href} className="comment-avatar" aria-label={`${comment.author} 프로필`}>
                    <img src={comment.avatar} alt="" />
                  </Link>
                ) : (
                  <img src={comment.avatar} alt="" />
                )}
                <div>
                  <div className="comment-top">
                    {href ? (
                      <Link to={href} className="comment-author">
                        {comment.author}
                      </Link>
                    ) : (
                      <strong>{comment.author}</strong>
                    )}
                    <time dateTime={comment.createdAt}>{comment.createdAt}</time>
                    {(canEdit || canDelete) && (
                      <button
                        type="button"
                        className="more"
                        aria-label="댓글 메뉴"
                        aria-expanded={menuCommentId === comment.id}
                        onClick={(event) => {
                          event.stopPropagation()
                          setMenuCommentId((current) => (current === comment.id ? null : comment.id))
                        }}
                      >
                        <DotsIcon />
                      </button>
                    )}
                  </div>
                  {editing ? (
                    <form className="comment-edit" onSubmit={(event) => void saveComment(event)}>
                      <input
                        value={editDraft}
                        aria-label="댓글 수정"
                        onChange={(event) => setEditDraft(event.target.value)}
                      />
                      <button type="submit" disabled={savingComment || editDraft.trim().length === 0}>
                        {savingComment ? '저장 중...' : '저장'}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                    </form>
                  ) : (
                    <p>{comment.content}</p>
                  )}
                </div>
                {(canEdit || canDelete) && menuCommentId === comment.id && (
                  <div className="post-menu in-comment" onClick={(event) => event.stopPropagation()}>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(comment.id)
                          setEditDraft(comment.content)
                          setMenuCommentId(null)
                        }}
                      >
                        수정
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={() => void removeComment(comment.id)}>
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </div>
    </div>,
    document.body,
  )
}

function AuthorIdentity({
  href,
  name,
  avatar,
  isMe,
  meta,
}: {
  href: string | null
  name: string
  avatar: string
  isMe?: boolean
  meta: string
}) {
  const body = (
    <>
      <img src={avatar} alt="" />
      <div>
        <div className="author-name">
          <strong>{name}</strong>
          {isMe && <span className="me-badge">나</span>}
        </div>
        <p className="post-meta">{meta}</p>
      </div>
    </>
  )
  if (!href) return <div className="author">{body}</div>
  return (
    <Link to={href} className="author" aria-label={`${name} 프로필`}>
      {body}
    </Link>
  )
}
