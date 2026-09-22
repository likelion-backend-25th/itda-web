import type { ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { Link, NavLink } from 'react-router'
import { categories, type CategoryId, type FeedUser } from '@/data/feed'
import { getLoggedIn, subscribeSession } from '@/data/session'
import {
  BagIcon,
  BookIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CraftIcon,
  DotsIcon,
  DumbbellIcon,
  FolderIcon,
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
  const compact = categoryItems !== categories
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)

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
      ) : compact ? (
        <div className="profile studio">
          <img src={user.avatar} alt="" />
          <span className="profile-label">프로필</span>
          <button type="button" className="write-btn" onClick={onWrite}>
            <PencilIcon />
            글쓰기
          </button>
        </div>
      ) : (
        <>
          <div className="profile">
            <img src={user.avatar} alt="" />
            <div>
              <strong className="profile-name">{user.name}</strong>
              <p className="profile-handle">{user.handle}</p>
              <p className="profile-bio">{user.bio}</p>
            </div>
          </div>
          <button type="button" className="write-btn" onClick={onWrite}>
            <PencilIcon />
            글쓰기
          </button>
        </>
      )}

      <nav className="side-nav" aria-label="주요 메뉴">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <HomeIcon />
          <span>홈</span>
          {(compact || !loggedIn) && <small className="nav-hint">(SNS 메인페이지)</small>}
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
          to="/subscription/jieun"
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
          {compact ? <FolderIcon /> : categoriesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
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
                  {compact || item.id === 'all' ? (
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
