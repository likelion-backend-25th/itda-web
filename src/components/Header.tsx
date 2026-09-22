import { Link, useLocation } from 'react-router'
import type { FeedUser } from '../data/feed'
import { BellIcon, ChevronDownIcon, MailIcon, SearchIcon } from './icons'

type HeaderProps = {
  query: string
  user: FeedUser
  onQueryChange: (value: string) => void
}

export default function Header({ query, user, onQueryChange }: HeaderProps) {
  const onMyPage = useLocation().pathname.startsWith('/mypage')

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
          placeholder={onMyPage ? '검색창' : '관심 있는 내용을 검색해보세요!'}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="top-actions">
        <button type="button" className="top-action">
          <BellIcon />
          <span>알림</span>
        </button>
        <button type="button" className="top-action">
          <MailIcon />
          <span>메시지</span>
        </button>
        <Link to="/mypage" className="top-action profile-action">
          <img src={user.avatar} alt="" />
          <span>프로필</span>
          <ChevronDownIcon />
        </Link>
      </div>
    </header>
  )
}
