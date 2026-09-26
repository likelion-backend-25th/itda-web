import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { fetchMyFollowers, resolveMemberImageUrl } from '@/api/member'
import EditPostModal from '@/components/feed/EditPostModal'
import FollowList, { type FollowListItem, type FollowTab } from '@/components/profile/FollowList'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import Header from '@/components/layout/Header'
import MyPostCard from '@/components/feed/MyPostCard'
import PostDetail from '@/components/feed/PostDetail'
import Sidebar from '@/components/layout/Sidebar'
import ThemeDetail from '@/components/theme/ThemeDetail'
import ProfileEditModal, { type ProfileForm } from '@/components/profile/ProfileEditModal'
import ThemeShot from '@/components/theme/ThemeShot'
import { GearIcon, HeadsetIcon } from '@/components/icons'
import { formatDateTime, myPageCategories, type CategoryId, type Post } from '@/data/feed'
import { getOwnedThemeIds, shopThemes, subscribeOwnedThemes } from '@/data/themes'
import { getFollowingIds, setFollowing, subscribeFollows } from '@/data/follows'
import { followListItemsFromIds } from '@/data/members'
import { getLoggedIn, subscribeSession } from '@/data/session'
import { ApiError } from '@/lib/apiClient'
import type { FollowerResponse } from '@/types/member'
import {
  likedPosts,
  myPosts,
  pageProfile,
  profileStats,
  scrappedPosts,
  type MyPost,
  type OwnedTheme,
} from '@/data/mypage'

function toFollowerListItem(follower: FollowerResponse): FollowListItem {
  return {
    id: String(follower.id),
    name: follower.nickname,
    avatar: resolveMemberImageUrl(follower.profileImage),
    href: null,
  }
}

type MyTab = 'posts' | 'likes' | 'scraps' | 'themes'

function purchasedThemes(ids: ReadonlySet<string>): OwnedTheme[] {
  return shopThemes
    .filter((theme) => ids.has(theme.id))
    .map((theme) => ({
      id: theme.id,
      name: theme.name,
      title: theme.name,
      subtitle: theme.description,
      tone: theme.tone,
      active: theme.id === 'light',
    }))
}

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
  const ownedIds = useSyncExternalStore(subscribeOwnedThemes, getOwnedThemeIds)
  const [themes, setThemes] = useState<OwnedTheme[]>(() => purchasedThemes(getOwnedThemeIds()))
  const [detailId, setDetailId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<MyPost | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const closeDetail = useCallback(() => setSelectedId(null), [])
  const [writing, setWriting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [followTab, setFollowTab] = useState<FollowTab | null>(null)
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const followedIds = useSyncExternalStore(subscribeFollows, getFollowingIds)
  const [followers, setFollowers] = useState<FollowListItem[]>([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followersError, setFollowersError] = useState<string | null>(null)
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

  // GET /api/v1/member/followers — 나를 팔로우하는 사람
  useEffect(() => {
    if (!loggedIn) {
      setFollowers([])
      setFollowersError(null)
      setFollowersLoading(false)
      return
    }

    let cancelled = false
    async function loadFollowers() {
      setFollowersLoading(true)
      setFollowersError(null)
      try {
        const list = await fetchMyFollowers()
        if (cancelled) return
        setFollowers(list.map(toFollowerListItem))
      } catch (error: unknown) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : '팔로워 목록을 불러오지 못했습니다.'
        setFollowersError(message)
        setFollowers([])
        if (error instanceof ApiError && error.status === 401) {
          // apiClient가 세션 정리 — 목록만 비움
        }
      } finally {
        if (!cancelled) setFollowersLoading(false)
      }
    }

    void loadFollowers()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  useEffect(() => {
    setThemes((current) => {
      const known = new Set(current.map((theme) => theme.id))
      const added = purchasedThemes(ownedIds).filter((theme) => !known.has(theme.id))
      return added.length === 0 ? current : [...current, ...added]
    })
  }, [ownedIds])

  useEffect(() => {
    if (!menuId) return
    function closeMenu() {
      setMenuId(null)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [menuId])

  const detailTheme = themes.find((theme) => theme.id === detailId) ?? null
  const selectedPost = [...posts, ...liked, ...scraps].find((post) => post.id === selectedId) ?? null

  function toDetailPost(post: MyPost): Post {
    return {
      id: post.id,
      author: post.author,
      avatar: post.avatar,
      time: '',
      category: post.category,
      categoryLabel: post.categoryLabel,
      content: post.body ? `${post.title}\n${post.body}` : post.title,
      images: post.images,
      createdAt: post.createdAt ?? '',
      comments: post.comments,
      likes: post.likes,
      liked: post.liked,
      views: post.views,
      bookmarked: scraps.some((item) => item.id === post.id),
      visibility: post.visibility,
      thread: post.thread ?? [],
    }
  }
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

  function toggleScrap(post: MyPost) {
    setScraps((current) =>
      current.some((item) => item.id === post.id)
        ? current.filter((item) => item.id !== post.id)
        : [post, ...current],
    )
  }

  function patchPost(id: string, updater: (post: MyPost) => MyPost) {
    const apply = (list: MyPost[]) => list.map((post) => (post.id === id ? updater(post) : post))
    setPosts(apply)
    setLiked(apply)
    setScraps(apply)
  }

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
          <main className="my-main my-board" aria-label="마이페이지">
            <section className="my-summary">
              <img src={viewer.avatar} alt="" />
              <div>
                <h2>{viewer.name}</h2>
                <p className="my-intro">{viewer.bio}</p>
                <p className="my-counts">
                  <button type="button" className="count-link" onClick={() => setFollowTab('following')}>
                    팔로잉 <b>{followedIds.size}</b>
                  </button>
                  <button type="button" className="count-link" onClick={() => setFollowTab('followers')}>
                    팔로워 <b>{followersLoading ? '…' : followers.length}</b>
                  </button>
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
                        onOpen={() => setSelectedId(post.id)}
                        onToggleMenu={() => setMenuId((current) => (current === post.id ? null : post.id))}
                        onEdit={() => {
                          setEditingPost(post)
                          setMenuId(null)
                        }}
                        onDelete={() => {
                          setPosts((current) => current.filter((item) => item.id !== post.id))
                          setMenuId(null)
                          if (selectedId === post.id) setSelectedId(null)
                        }}
                        onToggleLike={() =>
                          updateList(post.id, (item) => ({
                            ...item,
                            liked: !item.liked,
                            likes: item.likes + (item.liked ? -1 : 1),
                          }))
                        }
                        scrapped={scraps.some((item) => item.id === post.id)}
                        onToggleScrap={tab === 'posts' ? undefined : () => toggleScrap(post)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
            <div className="support">
              <Link to="/support" className="support-fab">
                <HeadsetIcon />
                <span>
                  고객센터
                  <small>환불 신청</small>
                </span>
              </Link>
            </div>
          </main>
        </div>
      </div>

      {followTab && (
        <FollowList
          initialTab={followTab}
          followers={followers}
          following={followListItemsFromIds([...followedIds])}
          followedIds={followedIds}
          onToggle={setFollowing}
          onClose={() => setFollowTab(null)}
          loading={followTab === 'followers' ? followersLoading : false}
          error={followTab === 'followers' ? followersError : null}
        />
      )}

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
              createdAt: formatDateTime(new Date()),
              thread: [],
            }
            setPosts((current) => [post, ...current])
            setTab('posts')
            setCategory((current) => (current === 'all' || current === draft.category ? current : 'all'))
            setWriting(false)
          }}
        />
      )}

      {selectedPost && (
        <PostDetail
          post={toDetailPost(selectedPost)}
          user={viewer}
          onClose={closeDetail}
          onToggleLike={(id) =>
            patchPost(id, (item) => ({
              ...item,
              liked: !item.liked,
              likes: item.likes + (item.liked ? -1 : 1),
            }))
          }
          onToggleBookmark={() => toggleScrap(selectedPost)}
          onAddComment={(id, content) =>
            patchPost(id, (item) => ({
              ...item,
              comments: item.comments + 1,
              thread: [
                {
                  id: `comment-${Date.now()}`,
                  author: viewer.name,
                  avatar: viewer.avatar,
                  createdAt: formatDateTime(new Date()),
                  content,
                },
                ...(item.thread ?? []),
              ],
            }))
          }
          onUpdateComment={(id, commentId, content) =>
            patchPost(id, (item) => ({
              ...item,
              thread: (item.thread ?? []).map((comment) =>
                comment.id === commentId ? { ...comment, content } : comment,
              ),
            }))
          }
          onDeleteComment={(id, commentId) =>
            patchPost(id, (item) => {
              const thread = (item.thread ?? []).filter((comment) => comment.id !== commentId)
              if (thread.length === (item.thread ?? []).length) return item
              return { ...item, thread, comments: Math.max(0, item.comments - 1) }
            })
          }
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

    </div>
  )
}
