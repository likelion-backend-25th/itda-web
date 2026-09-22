import type { MouseEvent } from 'react'
import { Link } from 'react-router'
import type { Post } from '../data/feed'
import { BookmarkIcon, CommentIcon, DotsIcon, EyeIcon, HeartIcon } from './icons'

type PostCardProps = {
  post: Post
  canManage: boolean
  menuOpen: boolean
  onOpen: (id: string) => void
  onToggleMenu: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleLike: (id: string) => void
  onToggleBookmark: (id: string) => void
  profileHref: string | null
}

function keepOnCard(event: MouseEvent<HTMLElement>) {
  event.stopPropagation()
}

export default function PostCard({
  post,
  canManage,
  menuOpen,
  onOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onToggleLike,
  onToggleBookmark,
  profileHref,
}: PostCardProps) {
  const singleImage = post.images.length === 1
  const galleryClass = post.images.length === 2 ? 'gallery two' : 'gallery'

  return (
    <article className="post" onClick={() => onOpen(post.id)}>
      <header className="post-head">
        {profileHref ? (
          <Link to={profileHref} className="author" onClick={keepOnCard}>
            <img src={post.avatar} alt="" />
            <div>
              <div className="author-name">
                <strong>{post.author}</strong>
                {post.isMe && <span className="me-badge">나</span>}
              </div>
              <p className="post-meta">
                {post.time}
                <span aria-hidden="true"> · </span>
                {post.categoryLabel}
              </p>
            </div>
          </Link>
        ) : (
          <div className="author">
            <img src={post.avatar} alt="" />
            <div>
              <div className="author-name">
                <strong>{post.author}</strong>
                {post.isMe && <span className="me-badge">나</span>}
              </div>
              <p className="post-meta">
                {post.time}
                <span aria-hidden="true"> · </span>
                {post.categoryLabel}
              </p>
            </div>
          </div>
        )}
        {canManage && (
          <button
            type="button"
            className="more"
            aria-label="게시글 메뉴"
            aria-expanded={menuOpen}
            onClick={(event) => {
              keepOnCard(event)
              onToggleMenu()
            }}
          >
            <DotsIcon />
          </button>
        )}
      </header>

      {singleImage ? (
        <div className="post-split">
          <p className="post-text">{post.content}</p>
          <img src={post.images[0].src} alt={post.images[0].alt} />
        </div>
      ) : (
        <>
          <p className="post-text">{post.content}</p>
          {post.images.length > 0 && (
            <div className={galleryClass}>
              {post.images.map((image) => (
                <img key={image.src} src={image.src} alt={image.alt} />
              ))}
            </div>
          )}
        </>
      )}

      <footer className="post-actions">
        <span className="stat">
          <CommentIcon />
          <span>댓글 {post.comments}</span>
        </span>
        <button
          type="button"
          className={post.liked ? 'stat liked' : 'stat'}
          aria-pressed={post.liked}
          onClick={(event) => {
            keepOnCard(event)
            onToggleLike(post.id)
          }}
        >
          <HeartIcon filled={post.liked} />
          <span>{post.likes}</span>
        </button>
        <span className="stat">
          <EyeIcon />
          <span>조회수 {post.views}</span>
        </span>
        <button
          type="button"
          className={post.bookmarked ? 'bookmark on' : 'bookmark'}
          aria-pressed={post.bookmarked}
          aria-label={post.bookmarked ? '북마크 해제' : '북마크'}
          onClick={(event) => {
            keepOnCard(event)
            onToggleBookmark(post.id)
          }}
        >
          <BookmarkIcon filled={post.bookmarked} />
        </button>
      </footer>

      {canManage && menuOpen && (
        <div className="post-menu in-card" onClick={keepOnCard}>
          <button type="button" onClick={onEdit}>
            수정
          </button>
          <button type="button" onClick={onDelete}>
            삭제
          </button>
        </div>
      )}
    </article>
  )
}
