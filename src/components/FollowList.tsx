import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { currentUser } from '../data/feed'
import { memberById, profilePath } from '../data/members'

export type FollowTab = 'followers' | 'following'

type FollowListProps = {
  initialTab: FollowTab
  followers: string[]
  following: string[]
  followedIds: Set<string>
  onToggle: (memberId: string, next: boolean) => void
  onClose: () => void
}

export default function FollowList({
  initialTab,
  followers,
  following,
  followedIds,
  onToggle,
  onClose,
}: FollowListProps) {
  const titleId = useId()
  const [tab, setTab] = useState<FollowTab>(initialTab)
  const ids = tab === 'followers' ? followers : following
  const people = ids.flatMap((id) => {
    const member = memberById(id)
    return member ? [member] : []
  })

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
        {people.length === 0 ? (
          <p className="follow-empty">표시할 사용자가 없습니다.</p>
        ) : (
          <ul className="follow-people">
            {people.map((member) => {
              const href = profilePath(member.name)
              const mine = member.name === currentUser.name
              const followed = followedIds.has(member.id)
              return (
                <li key={member.id}>
                  {href ? (
                    <Link to={href} className="follow-person" onClick={onClose}>
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
                    <button type="button" className="follow-toggle" onClick={() => onToggle(member.id, !followed)}>
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
