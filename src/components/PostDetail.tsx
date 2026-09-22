import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import type { FeedUser, Post } from '../data/feed'
import { profilePath } from '../data/members'
import { BookmarkIcon, CloseIcon, CommentIcon, DotsIcon, EyeIcon, HeartIcon } from './icons'

type PostDetailProps = {
  post: Post
  user: FeedUser
  onClose: () => void
  onToggleLike: (id: string) => void
  onToggleBookmark: (id: string) => void
  onAddComment: (id: string, content: string) => void
  onUpdateComment: (postId: string, commentId: string, content: string) => void
  onDeleteComment: (postId: string, commentId: string) => void
}

export default function PostDetail({
  post,
  user,
  onClose,
  onToggleLike,
  onToggleBookmark,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: PostDetailProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [draft, setDraft] = useState('')
  const [menuCommentId, setMenuCommentId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  useEffect(() => {
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    setDraft('')
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

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    onAddComment(post.id, content)
    setDraft('')
  }

  function saveComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = editDraft.trim()
    if (!editingId || !content) return
    onUpdateComment(post.id, editingId, content)
    setEditingId(null)
  }

  return createPortal(
    <div className="detail-backdrop" onClick={onClose}>
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
          <button ref={closeRef} type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className={post.images.length === 1 ? 'detail-photos single' : 'detail-photos'}>
          {post.images.map((image) => (
            <img key={image.src} src={image.src} alt={image.alt} />
          ))}
        </div>

        <div className="detail-stats">
          <span className="detail-stat">
            <CommentIcon />
            <span>댓글 {post.comments}</span>
          </span>
          <button
            type="button"
            className={post.liked ? 'detail-stat liked' : 'detail-stat'}
            aria-pressed={post.liked}
            onClick={() => onToggleLike(post.id)}
          >
            <HeartIcon filled={post.liked} />
            <span>좋아요 {post.likes}</span>
          </button>
          <span className="detail-stat">
            <EyeIcon />
            <span>조회수 {post.views}</span>
          </span>
          <button
            type="button"
            className={post.bookmarked ? 'detail-bookmark on' : 'detail-bookmark'}
            aria-pressed={post.bookmarked}
            aria-label={post.bookmarked ? '북마크 해제' : '북마크'}
            onClick={() => onToggleBookmark(post.id)}
          >
            <BookmarkIcon filled={post.bookmarked} />
          </button>
          <p className="detail-date">작성일 {post.createdAt}</p>
        </div>

        <section className="detail-comments" aria-label="댓글">
          <div className="composer">
            <img src={user.avatar} alt="" />
            <div>
              <strong>{user.name}</strong>
              <form onSubmit={submitComment}>
                <input
                  value={draft}
                  placeholder="댓글을 남겨주세요 :)"
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" disabled={draft.trim().length === 0}>
                  작성
                </button>
              </form>
            </div>
          </div>

          {post.thread.map((comment) => {
            const mine = comment.author === user.name
            const editing = editingId === comment.id
            const href = profilePath(comment.author)
            return (
              <article key={comment.id} className="comment">
                <img src={comment.avatar} alt="" />
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
                    {mine && (
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
                    <form className="comment-edit" onSubmit={saveComment}>
                      <input
                        value={editDraft}
                        aria-label="댓글 수정"
                        onChange={(event) => setEditDraft(event.target.value)}
                      />
                      <button type="submit" disabled={editDraft.trim().length === 0}>
                        저장
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                    </form>
                  ) : (
                    <p>{comment.content}</p>
                  )}
                </div>
                {mine && menuCommentId === comment.id && (
                  <div className="post-menu in-comment" onClick={(event) => event.stopPropagation()}>
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
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteComment(post.id, comment.id)
                        setMenuCommentId(null)
                        if (editingId === comment.id) setEditingId(null)
                      }}
                    >
                      삭제
                    </button>
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
