import type { MyPost } from '../data/mypage'
import { CommentIcon, DotsIcon, EyeIcon, HeartIcon } from './icons'

type MyPostCardProps = {
  post: MyPost
  menuOpen: boolean
  canManage: boolean
  onToggleMenu: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleLike: () => void
}

export default function MyPostCard({
  post,
  menuOpen,
  canManage,
  onToggleMenu,
  onEdit,
  onDelete,
  onToggleLike,
}: MyPostCardProps) {
  return (
    <article className="my-post">
      <header className="my-post-head">
        <img src={post.avatar} alt="" />
        <div>
          <strong>{post.author}</strong>
          <p>{post.intro}</p>
        </div>
        {canManage && (
          <button
            type="button"
            className="more"
            aria-label="게시글 메뉴"
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation()
              onToggleMenu()
            }}
          >
            <DotsIcon />
          </button>
        )}
      </header>

      <div className="my-post-body">
        <div className="my-post-copy">
          <span className="detail-chip">{post.categoryLabel}</span>
          <h3>{post.title}</h3>
          {post.body && <p>{post.body}</p>}
        </div>
        {post.images.length > 0 && (
          <div className={post.images.length > 1 ? 'my-post-photos' : 'my-post-photos single'}>
            {post.images.map((image) => (
              <img key={image.src} src={image.src} alt={image.alt} />
            ))}
          </div>
        )}
      </div>

      <footer className="post-actions">
        <span className="stat">
          <CommentIcon />
          <span>댓글 {post.comments}</span>
        </span>
        <button
          type="button"
          className={post.liked ? 'stat liked' : 'stat'}
          aria-pressed={post.liked}
          onClick={onToggleLike}
        >
          <HeartIcon filled={post.liked} />
          <span>{post.likes}</span>
        </button>
        <span className="stat">
          <EyeIcon />
          <span>조회수 {post.views}</span>
        </span>
      </footer>

      {menuOpen && (
        <div className="post-menu" onClick={(event) => event.stopPropagation()}>
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
