import { useEffect, useId, useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router'
import { DEFAULT_AVATAR } from '@/api/member'

function fallbackAvatar(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget
  if (img.getAttribute('src') === DEFAULT_AVATAR) return
  img.src = DEFAULT_AVATAR
}

export type FollowTab = 'followers' | 'following'

/** 팔로우 목록 UI용 공통 항목 */
export type FollowListItem = {
  id: string
  name: string
  avatar: string
  href: string | null
}

type FollowListProps = {
  initialTab: FollowTab
  followers: FollowListItem[]
  following: FollowListItem[]
  followedIds: ReadonlySet<string>
  onToggle: (memberId: string, next: boolean) => void
  onClose: () => void
  /** 로그인한 본인 id — 본인 행에는 팔로우 버튼을 숨긴다 */
  viewerId?: string | null
  /** 요청 중인 회원 id — 버튼 비활성화 */
  pendingIds?: ReadonlySet<string>
  /** 팔로우/언팔로우 실패 메시지 */
  actionError?: string | null
  followersLoading?: boolean
  followersError?: string | null
  followingLoading?: boolean
  followingError?: string | null
}

export default function FollowList({
  initialTab,
  followers,
  following,
  followedIds,
  onToggle,
  onClose,
  viewerId = null,
  pendingIds,
  actionError = null,
  followersLoading = false,
  followersError = null,
  followingLoading = false,
  followingError = null,
}: FollowListProps) {
  const titleId = useId()
  const [tab, setTab] = useState<FollowTab>(initialTab)
  const people = tab === 'followers' ? followers : following
  const loading = tab === 'followers' ? followersLoading : followingLoading
  const error = tab === 'followers' ? followersError : followingError

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="detail-backdrop follow-layer" onClick={onClose}>
      <div
        className="follow-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="follow-tabs" role="tablist" id={titleId}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'followers'}
            className={tab === 'followers' ? 'on' : undefined}
            onClick={() => setTab('followers')}
          >
            팔로워
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'following'}
            className={tab === 'following' ? 'on' : undefined}
            onClick={() => setTab('following')}
          >
            팔로잉
          </button>
        </div>
        {actionError && (
          <p className="pay-error" role="alert">
            {actionError}
          </p>
        )}
        {loading ? (
          <p className="follow-empty">불러오는 중…</p>
        ) : error ? (
          <p className="follow-empty">{error}</p>
        ) : people.length === 0 ? (
          <p className="follow-empty">표시할 사용자가 없습니다.</p>
        ) : (
          <ul className="follow-people">
            {people.map((member) => {
              const mine = viewerId != null && member.id === viewerId
              const followed = followedIds.has(member.id)
              const busy = pendingIds?.has(member.id) ?? false
              return (
                <li key={member.id}>
                  {member.href ? (
                    <Link to={member.href} className="follow-person" onClick={onClose}>
                      <img src={member.avatar} alt="" onError={fallbackAvatar} />
                      <strong>{member.name}</strong>
                    </Link>
                  ) : (
                    <span className="follow-person">
                      <img src={member.avatar} alt="" onError={fallbackAvatar} />
                      <strong>{member.name}</strong>
                    </span>
                  )}
                  {!mine && (
                    <button
                      type="button"
                      className="follow-toggle"
                      disabled={busy}
                      aria-busy={busy}
                      onClick={() => onToggle(member.id, !followed)}
                    >
                      {followed ? '언팔로우' : '팔로우'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
