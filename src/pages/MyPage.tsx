import { useEffect, useMemo, useState } from 'react'
import EditPostModal from '../components/EditPostModal'
import WritePostModal, { type PostDraft } from '../components/WritePostModal'
import Header from '../components/Header'
import MyPostCard from '../components/MyPostCard'
import Sidebar from '../components/Sidebar'
import ThemeDetail from '../components/ThemeDetail'
import ProfileEditModal, { type ProfileForm } from '../components/ProfileEditModal'
import ThemeShot from '../components/ThemeShot'
import { GearIcon, HeadsetIcon } from '../components/icons'
import { myPageCategories, type CategoryId } from '../data/feed'
import {
  likedPosts,
  myPosts,
  ownedThemes,
  pageProfile,
  profileStats,
  scrappedPosts,
  type MyPost,
  type OwnedTheme,
} from '../data/mypage'

type MyTab = 'posts' | 'likes' | 'scraps' | 'themes'

const tabCopy: Record<Exclude<MyTab, 'themes'>, string> = {
  posts: '본인 작성 게시글 목록',
  likes: '좋아요한 게시글 목록',
  scraps: '스크랩한 게시글 목록',
}

export default function MyPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [tab, setTab] = useState<MyTab>('posts')
  const [posts, setPosts] = useState<MyPost[]>(myPosts)
  const [liked, setLiked] = useState<MyPost[]>(likedPosts)
  const [scraps, setScraps] = useState<MyPost[]>(scrappedPosts)
  const [themes, setThemes] = useState<OwnedTheme[]>(ownedThemes)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<MyPost | null>(null)
  const [writing, setWriting] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileForm>({
    name: pageProfile.name,
    bio: '카페 디저트와 여행 사진을 좋아합니다.',
    avatar: pageProfile.avatar,
    interests: ['food', 'travel', 'cooking', 'game'],
  })
  const viewer = {
    name: profile.name,
    handle: pageProfile.handle,
    avatar: profile.avatar,
    bio: `소개글 - ${profile.bio}`,
  }

  useEffect(() => {
    if (!menuId) return
    function closeMenu() {
      setMenuId(null)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [menuId])

  const detailTheme = themes.find((theme) => theme.id === detailId) ?? null
  const source = tab === 'likes' ? liked : tab === 'scraps' ? scraps : posts

  const visiblePosts = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return source.filter((post) => {
      const categoryMatch = category === 'all' || post.category === category
      const keywordMatch =
        keyword.length === 0 ||
        post.title.toLowerCase().includes(keyword) ||
        post.categoryLabel.toLowerCase().includes(keyword) ||
        (post.body ?? '').toLowerCase().includes(keyword)
      return categoryMatch && keywordMatch
    })
  }, [category, query, source])

  function updateList(id: string, updater: (post: MyPost) => MyPost) {
    const apply = (list: MyPost[]) => list.map((post) => (post.id === id ? updater(post) : post))
    if (tab === 'likes') setLiked(apply)
    else if (tab === 'scraps') setScraps(apply)
    else setPosts(apply)
  }

  return (
    <div className="page">
      <div className="shell">
        <Header query={query} user={viewer} onQueryChange={setQuery} />
        <div className="layout">
          <Sidebar
            user={viewer}
            category={category}
            categories={myPageCategories}
            categoriesOpen={categoriesOpen}
            onCategoryChange={setCategory}
            onToggleCategories={() => setCategoriesOpen((open) => !open)}
            onWrite={() => setWriting(true)}
          />
          <main className="my-main" aria-label="마이페이지">
            <section className="my-summary">
              <img src={viewer.avatar} alt="" />
              <div>
                <h2>{viewer.name}</h2>
                <p className="my-intro">{viewer.bio}</p>
                <p className="my-counts">
                  <span>
                    팔로잉 <b>{profileStats.following}</b>
                  </span>
                  <span>
                    팔로워 <b>{profileStats.followers}</b>
                  </span>
                  <span>
                    게시글 <b>{profileStats.posts}</b>
                  </span>
                </p>
              </div>
              <button type="button" className="settings-btn" onClick={() => setSettingsOpen(true)}>
                <GearIcon />
                설정
              </button>
            </section>

            <div className="my-tabs" role="tablist" aria-label="마이페이지 메뉴">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'posts'}
                className={tab === 'posts' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('posts')}
              >
                게시글
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'likes'}
                className={tab === 'likes' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('likes')}
              >
                좋아요
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'scraps'}
                className={tab === 'scraps' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('scraps')}
              >
                스크랩
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'themes'}
                className={tab === 'themes' ? 'my-tab aside active' : 'my-tab aside'}
                onClick={() => setTab('themes')}
              >
                보유테마
              </button>
            </div>

            {tab === 'themes' ? (
              <div className="theme-grid">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={theme.active ? 'theme-card on' : 'theme-card'}
                    aria-pressed={theme.active}
                    onClick={() => setDetailId(theme.id)}
                  >
                    <ThemeShot tone={theme.tone} />
                    <strong>{theme.name}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <h3 className="my-heading">{tabCopy[tab]}</h3>
                <div className="my-feed">
                  {visiblePosts.length === 0 ? (
                    <div className="empty">해당하는 글이 없습니다.</div>
                  ) : (
                    visiblePosts.map((post) => (
                      <MyPostCard
                        key={post.id}
                        post={post}
                        canManage={tab === 'posts'}
                        menuOpen={menuId === post.id}
                        onToggleMenu={() => setMenuId((current) => (current === post.id ? null : post.id))}
                        onEdit={() => {
                          setEditingPost(post)
                          setMenuId(null)
                        }}
                        onDelete={() => {
                          setPosts((current) => current.filter((item) => item.id !== post.id))
                          setMenuId(null)
                        }}
                        onToggleLike={() =>
                          updateList(post.id, (item) => ({
                            ...item,
                            liked: !item.liked,
                            likes: item.likes + (item.liked ? -1 : 1),
                          }))
                        }
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {settingsOpen && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onSaveProfile={(next) => setProfile((current) => ({ ...current, ...next }))}
          onSaveInterests={(interests) => setProfile((current) => ({ ...current, interests }))}
        />
      )}

      {detailTheme && (
        <ThemeDetail
          theme={detailTheme}
          onClose={() => setDetailId(null)}
          onApply={() => {
            setThemes((current) =>
              current.map((item) => ({ ...item, active: item.id === detailTheme.id })),
            )
            setDetailId(null)
          }}
        />
      )}

      {writing && (
        <WritePostModal
          user={viewer}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={(draft: PostDraft) => {
            const post: MyPost = {
              id: `my-${Date.now()}`,
              author: viewer.name,
              avatar: viewer.avatar,
              intro: viewer.bio,
              category: draft.category,
              categoryLabel: draft.categoryLabel,
              title: draft.title,
              body: draft.body,
              images: draft.images,
              comments: 0,
              likes: 0,
              liked: false,
              views: 0,
              visibility: draft.visibility,
            }
            setPosts((current) => [post, ...current])
            setTab('posts')
            setCategory((current) => (current === 'all' || current === draft.category ? current : 'all'))
            setWriting(false)
          }}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={(next) => {
            setPosts((current) =>
              current.map((item) => (item.id === editingPost.id ? { ...item, ...next } : item)),
            )
            setEditingPost(null)
          }}
        />
      )}

      <div className="support">
        <button type="button" className="support-fab" onClick={() => setSupportOpen((open) => !open)}>
          <HeadsetIcon />
          <span>
            고객센터
            <small>환불 문의</small>
          </span>
        </button>
        {supportOpen && <p className="support-note">환불 문의는 고객센터로 남겨 주세요.</p>}
      </div>
    </div>
  )
}
