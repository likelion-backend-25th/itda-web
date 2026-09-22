import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { FeedUser, Post } from '../data/feed'
import { BookmarkIcon, CloseIcon, CommentIcon, DotsIcon, EyeIcon, HeartIcon } from './icons'

type PostDetailProps = {
  post: Post
  user: FeedUser
  onClose: () => void
  onToggleLike: (id: string) => void
  onToggleBookmark: (id: string) => void
  onAddComment: (id: string, content: string) => void
}

export default function PostDetail({
  post,
  user,
  onClose,
  onToggleLike,
  onToggleBookmark,
  onAddComment,
}: PostDetailProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [draft, setDraft] = useState('')

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
  }, [post.id])

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    onAddComment(post.id, content)
    setDraft('')
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

          {post.thread.map((comment) => (
            <article key={comment.id} className="comment">
              <img src={comment.avatar} alt="" />
              <div>
                <div className="comment-top">
                  <strong>{comment.author}</strong>
                  <time dateTime={comment.createdAt}>{comment.createdAt}</time>
                  <button type="button" className="more" aria-label="댓글 메뉴">
                    <DotsIcon />
                  </button>
                </div>
                <p>{comment.content}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>,
    document.body,
  )
}
