import type { ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { Link, NavLink } from 'react-router'
import { DEFAULT_AVATAR } from '@/api/member'
import { categories, type CategoryId, type FeedUser } from '@/data/feed'
import { getLoggedIn, subscribeSession } from '@/data/session'
import { getViewerProfile, subscribeViewer } from '@/data/viewer'
import {
  BagIcon,
  BookIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CraftIcon,
  DotsIcon,
  DumbbellIcon,
  GameIcon,
  HomeIcon,
  LoginIcon,
  MusicIcon,
  PaletteIcon,
  PencilIcon,
  PlaneIcon,
  PotIcon,
  SubscribeIcon,
  UserIcon,
  UtensilsIcon,
} from '@/components/icons'

type SidebarProps = {
  user: FeedUser
  category: CategoryId
  categoriesOpen: boolean
  categories?: { id: CategoryId; label: string }[]
  onCategoryChange: (category: CategoryId) => void
  onToggleCategories: () => void
  onWrite: () => void
}

const categoryIcons: Record<Exclude<CategoryId, 'all'>, ReactNode> = {
  food: <UtensilsIcon />,
  travel: <PlaneIcon />,
  workout: <DumbbellIcon />,
  reading: <BookIcon />,
  cooking: <PotIcon />,
  music: <MusicIcon />,
  craft: <CraftIcon />,
  drawing: <PaletteIcon />,
  game: <GameIcon />,
  etc: <DotsIcon />,
}

export default function Sidebar({
  user,
  category,
  categoriesOpen,
  categories: categoryItems = categories,
  onCategoryChange,
  onToggleCategories,
  onWrite,
}: SidebarProps) {
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const suspended = useSyncExternalStore(subscribeViewer, getViewerProfile)?.status === 'SUSPENDED'

  return (
    <aside className="sidebar">
      {!loggedIn ? (
        <div className="guest-side">
          <Link to="/login" className="guest-side-login">
            <LoginIcon />
            로그인
          </Link>
          <Link to="/register" className="guest-side-join">
            <UserIcon />
            회원가입
          </Link>
        </div>
      ) : (
        <div className="profile studio">
          <img
            src={user.avatar}
            alt=""
            onError={(event) => {
              event.currentTarget.src = DEFAULT_AVATAR
            }}
          />
          <div className="profile-copy">
            <strong className="profile-name">{user.name || '프로필'}</strong>
            {user.handle ? <p className="profile-handle">{user.handle}</p> : null}
          </div>
          <button type="button" className="write-btn" disabled={suspended} onClick={onWrite}>
            <PencilIcon />
            글쓰기
          </button>
          {suspended && <p className="write-blocked">활동 정지 상태에서는 글을 작성할 수 없습니다.</p>}
        </div>
      )}

      <nav className="side-nav" aria-label="주요 메뉴">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <HomeIcon />
          <span>홈</span>
        </NavLink>
        <NavLink to="/mypage" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <UserIcon />
          <span>마이페이지</span>
        </NavLink>
        <NavLink to="/theme" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <BagIcon />
          <span>테마 구매</span>
        </NavLink>
        <NavLink
          to="/subscription/me"
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          <SubscribeIcon />
          <span>구독</span>
        </NavLink>
      </nav>

      <section className="category-block">
        <button
          type="button"
          className="category-toggle"
          aria-expanded={categoriesOpen}
          onClick={onToggleCategories}
        >
          <span>카테고리</span>
          {categoriesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>

        {categoriesOpen && (
          <div className="category-list" role="listbox" aria-label="카테고리">
            {categoryItems.map((item) => {
              const selected = item.id === category
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? 'category-item active' : 'category-item'}
                  onClick={() => onCategoryChange(item.id)}
                >
                  {item.id === 'all' ? (
                    <span className={selected ? 'category-dot on' : 'category-dot'} />
                  ) : (
                    categoryIcons[item.id]
                  )}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </aside>
  )
}
