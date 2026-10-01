import { useSyncExternalStore, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { logout } from '@/api/auth'
import { DEFAULT_AVATAR } from '@/api/member'
import type { FeedUser } from '@/data/feed'
import { getLoggedIn, subscribeSession } from '@/data/session'
import { ChevronDownIcon, LogoutIcon, SearchIcon } from '@/components/icons'

type HeaderProps = {
  query: string
  user: FeedUser
  onQueryChange: (value: string) => void
}

export default function Header({ query, user, onQueryChange }: HeaderProps) {
  const navigate = useNavigate()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const keyword = query.trim()
    if (!keyword) {
      navigate('/')
      return
    }
    navigate(`/?keyword=${encodeURIComponent(keyword)}`)
  }

  return (
    <header className="topbar">
      <div className="brand">
        <Link to="/" className="logo">
          ITDA
        </Link>
        <span className="tagline">
          일상을 공유하는
          <br />더 특별한 공간
        </span>
      </div>

      <form className="search" role="search" onSubmit={submitSearch}>
        <SearchIcon />
        <input
          type="search"
          value={query}
          placeholder="관심 있는 내용을 검색해보세요!"
          aria-label="관심 있는 내용을 검색해보세요!"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </form>

      <div className="top-actions">
        {loggedIn ? (
          <>
            {/* 알림은 미구현
            <button type="button" className="top-action">
              <BellIcon />
              <span>알림</span>
            </button>
            */}
            <Link to="/mypage" className="top-action profile-action">
              <img
                src={user.avatar}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_AVATAR
                }}
              />
              <span>프로필</span>
              <ChevronDownIcon />
            </Link>
            <button
              type="button"
              className="top-action"
              onClick={() => {
                void logout().then(() => navigate('/'))
              }}
            >
              <LogoutIcon />
              <span>로그아웃</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="guest-auth">
              로그인
            </Link>
            <Link to="/register" className="guest-auth">
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
