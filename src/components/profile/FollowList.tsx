import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { currentUser } from '@/data/feed'

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
  followedIds: Set<string>
  onToggle: (memberId: string, next: boolean) => void
  onClose: () => void
  loading?: boolean
  error?: string | null
}

export default function FollowList({
  initialTab,
  followers,
  following,
  followedIds,
  onToggle,
  onClose,
  loading = false,
  error = null,
}: FollowListProps) {
  const titleId = useId()
  const [tab, setTab] = useState<FollowTab>(initialTab)
  const people = tab === 'followers' ? followers : following

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
        {loading ? (
          <p className="follow-empty">불러오는 중…</p>
        ) : error ? (
          <p className="follow-empty">{error}</p>
        ) : people.length === 0 ? (
          <p className="follow-empty">표시할 사용자가 없습니다.</p>
        ) : (
          <ul className="follow-people">
            {people.map((member) => {
              const mine = member.name === currentUser.name
              const followed = followedIds.has(member.id)
              return (
                <li key={member.id}>
                  {member.href ? (
                    <Link to={member.href} className="follow-person" onClick={onClose}>
                      <img src={member.avatar} alt="" />
                      <strong>{member.name}</strong>
                    </Link>
                  ) : (
                    <span className="follow-person">
                      <img src={member.avatar} alt="" />
                      <strong>{member.name}</strong>
                    </span>
                  )}
                  {!mine && (
                    <button
                      type="button"
                      className="follow-toggle"
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
