import { BookmarkIcon, CommentIcon, DotsIcon, EyeIcon, HeartIcon } from '@/components/icons'
import SubOnlyBadge from '@/components/feed/SubOnlyBadge'
import type { MyPost } from '@/data/mypage'

type MyPostCardProps = {
  post: MyPost
  menuOpen: boolean
  canManage: boolean
  onOpen: () => void
  onToggleMenu: () => void
  onEdit: () => void
  onDelete: () => void
  /** 없으면 좋아요 수만 보여 준다. 본인 글은 백엔드가 좋아요를 거절한다 */
  onToggleLike?: () => void
  scrapped?: boolean
  onToggleScrap?: () => void
}

export default function MyPostCard({
  post,
  menuOpen,
  canManage,
  onOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onToggleLike,
  scrapped = false,
  onToggleScrap,
}: MyPostCardProps) {
  const content = [post.title, post.body].filter((line) => line && line.trim().length > 0).join('\n')
  const timeLabel = post.time || post.createdAt || ''
  const singleImage = post.images.length === 1
  const galleryClass = post.images.length === 2 ? 'gallery two' : 'gallery'

  return (
    <article className="post" onClick={onOpen}>
      <header className="post-head">
        <div className="author">
          <img src={post.avatar} alt="" />
          <div>
            <div className="author-name">
              <strong>{post.author}</strong>
              {post.visibility === 'subscribers' && <SubOnlyBadge />}
            </div>
            <p className="post-meta">
              {timeLabel}
              {post.categoryLabel ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {post.categoryLabel}
                </>
              ) : null}
            </p>
          </div>
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

      {singleImage ? (
        <div className="post-split">
          <p className="post-text">{content}</p>
          <img src={post.images[0].src} alt={post.images[0].alt} />
        </div>
      ) : (
        <>
          <p className="post-text">{content}</p>
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
        {onToggleLike ? (
          <button
            type="button"
            className={post.liked ? 'stat liked' : 'stat'}
            aria-pressed={post.liked}
            onClick={(event) => {
              event.stopPropagation()
              onToggleLike()
            }}
          >
            <HeartIcon filled={post.liked} />
            <span>{post.likes}</span>
          </button>
        ) : (
          <span className={post.liked ? 'stat liked' : 'stat'} aria-label="좋아요">
            <HeartIcon filled={post.liked} />
            <span>{post.likes}</span>
          </span>
        )}
        <span className="stat">
          <EyeIcon />
          <span>조회수 {post.views}</span>
        </span>
        {onToggleScrap ? (
          <button
            type="button"
            className={scrapped ? 'bookmark on' : 'bookmark'}
            aria-pressed={scrapped}
            aria-label={scrapped ? '스크랩 해제' : '스크랩'}
            onClick={(event) => {
              event.stopPropagation()
              onToggleScrap()
            }}
          >
            <BookmarkIcon filled={scrapped} />
          </button>
        ) : (
          <span className="bookmark" aria-label="스크랩">
            <BookmarkIcon filled={false} />
          </span>
        )}
      </footer>

      {menuOpen && (
        <div className="post-menu in-card" onClick={(event) => event.stopPropagation()}>
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
