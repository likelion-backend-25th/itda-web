import { useSyncExternalStore } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import type { FeedUser } from '@/data/feed'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { BellIcon, ChevronDownIcon, LogoutIcon, SearchIcon } from '@/components/icons'

type HeaderProps = {
  query: string
  user: FeedUser
  onQueryChange: (value: string) => void
}

export default function Header({ query, user, onQueryChange }: HeaderProps) {
  const navigate = useNavigate()
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const pathname = useLocation().pathname
  const onMyPage =
    pathname.startsWith('/mypage') ||
    pathname.startsWith('/member') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/theme') ||
    pathname.startsWith('/support')

  return (
    <header className="topbar">
      <div className="brand">
        <Link to="/" className="logo">
          ITDA
        </Link>
        {!onMyPage && (
          <span className="tagline">
            일상을 공유하는
            <br />더 특별한 공간
          </span>
        )}
      </div>

      <label className="search">
        <SearchIcon />
        <input
          type="search"
          value={query}
          placeholder={onMyPage ? '검색창' : loggedIn ? '관심 있는 내용을 검색해보세요!' : '관심 있는 이야기를 검색해보세요.'}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="top-actions">
        {loggedIn ? (
          <>
            <button type="button" className="top-action">
              <BellIcon />
              <span>알림</span>
            </button>
            <Link to="/mypage" className="top-action profile-action">
              <img src={user.avatar} alt="" />
              <span>프로필</span>
              <ChevronDownIcon />
            </Link>
            <button
              type="button"
              className="top-action"
              onClick={() => {
                setLoggedIn(false)
                navigate('/')
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
