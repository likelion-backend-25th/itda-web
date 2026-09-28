import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { fetchMemberProfile, resolveMemberImageUrl, toFeedUser } from '@/api/member'
import { cancelSubscription, fetchSubscriptionStatus } from '@/api/subscription'
import FollowList, { type FollowTab } from '@/components/profile/FollowList'
import Header from '@/components/layout/Header'
import PostDetail from '@/components/feed/PostDetail'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal from '@/components/feed/WritePostModal'
import { BookmarkIcon, CommentIcon, CrownIcon, DotsIcon, EyeIcon, HeartIcon } from '@/components/icons'
import { formatDateTime, initialPosts, myPageCategories, type CategoryId, type Post } from '@/data/feed'
import { getFollowingIds, memberFollowIds, setFollowing, subscribeFollows } from '@/data/follows'
import { followListItemsFromIds, memberById, type MemberProfile } from '@/data/members'
import { setSubscribed } from '@/data/subscriptions'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import { useMemberFollows } from '@/hooks/member/useMemberFollows'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { ApiError } from '@/lib/apiClient'

function toMemberView(profile: {
  id: number
  nickname: string
  bio: string
  avatar: string
}): MemberProfile {
  return {
    id: String(profile.id),
    backendId: profile.id,
    name: profile.nickname,
    avatar: profile.avatar,
    bio: profile.bio || '소개글이 없습니다.',
    followers: 0,
    following: 0,
    posts: 0,
  }
}

export default function MemberPage() {
  const { memberId = '' } = useParams()
  const navigate = useNavigate()
  const numericId = Number(memberId)
  const isNumericRoute = Number.isInteger(numericId) && numericId > 0
  const mockMember = !isNumericRoute ? memberById(memberId) : undefined
  const [apiMember, setApiMember] = useState<MemberProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(isNumericRoute)
  const [profileError, setProfileError] = useState('')
  const member = apiMember ?? mockMember
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [tab, setTab] = useState<'public' | 'exclusive'>('public')
  const [followTab, setFollowTab] = useState<FollowTab | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [subscribed, setSubscribedFlag] = useState(false)
  const [statusReady, setStatusReady] = useState(false)
  const [subscribeBusy, setSubscribeBusy] = useState(false)
  const [subscribeError, setSubscribeError] = useState<string | null>(null)
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const viewer = useViewerUser()
  const followedIds = useSyncExternalStore(subscribeFollows, getFollowingIds)
  const following = member ? followedIds.has(member.id) : false
  const network = member ? memberFollowIds(member.id) : { followers: [], following: [] }
  const apiFollows = useMemberFollows(isNumericRoute ? numericId : (member?.backendId ?? null), Boolean(member) && loggedIn)
  const followerItems = apiFollows.followers.items.length > 0
    ? apiFollows.followers
    : {
        items: followListItemsFromIds(network.followers),
        loading: apiFollows.followers.loading,
        error: apiFollows.followers.error,
      }
  const followingItems = apiFollows.following.items.length > 0
    ? apiFollows.following
    : {
        items: followListItemsFromIds(network.following),
        loading: apiFollows.following.loading,
        error: apiFollows.following.error,
      }

  // GET /member/{memberId}
  useEffect(() => {
    if (!isNumericRoute) {
      setApiMember(null)
      setProfileLoading(false)
      setProfileError('')
      return
    }

    let cancelled = false
    async function loadProfile() {
      setProfileLoading(true)
      setProfileError('')
      try {
        const profile = await fetchMemberProfile(numericId)
        if (cancelled) return
        const feed = toFeedUser(profile)
        setApiMember(
          toMemberView({
            id: profile.id,
            nickname: feed.name,
            bio: feed.bio,
            avatar: resolveMemberImageUrl(profile.profileImage),
          }),
        )
      } catch (error: unknown) {
        if (cancelled) return
        setApiMember(null)
        setProfileError(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.')
        if (error instanceof ApiError && error.status === 401 && loggedIn) setLoggedIn(false)
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [isNumericRoute, loggedIn, numericId])

  useEffect(() => {
    setFollowTab(null)
    setTab('public')
    setCategory('all')
    setSelectedId(null)
    setPosts(member ? initialPosts.filter((post) => post.author === member.name) : [])
  }, [member])

  // GET /api/v1/subscriptions/{targetId} — subscribed로 버튼 문구를 정한다
  useEffect(() => {
    if (!member || !loggedIn) {
      setSubscribedFlag(false)
      setStatusReady(true)
      setSubscribeError(null)
      return
    }

    const targetId = member.backendId
    const localId = member.id
    let cancelled = false
    setStatusReady(false)
    setSubscribeError(null)

    async function loadStatus() {
      try {
        const status = await fetchSubscriptionStatus(targetId)
        if (cancelled) return
        setSubscribedFlag(status.subscribed)
        setSubscribed(localId, status.subscribed)
      } catch (error: unknown) {
        if (cancelled) return
        setSubscribedFlag(false)
        const message = error instanceof Error ? error.message : '구독 상태를 불러오지 못했습니다.'
        setSubscribeError(message)
      } finally {
        if (!cancelled) setStatusReady(true)
      }
    }

    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [loggedIn, member])

  async function cancelMembership() {
    if (!member || subscribeBusy) return
    setSubscribeBusy(true)
    setSubscribeError(null)
    try {
      await cancelSubscription(member.backendId)
      setSubscribedFlag(false)
      setSubscribed(member.id, false)
      setTab('public')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '구독 취소에 실패했습니다.'
      setSubscribeError(message)
    } finally {
      setSubscribeBusy(false)
    }
  }

  const visiblePosts = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const exclusive = subscribed && tab === 'exclusive'
    return posts.filter((post) => {
      const audienceMatch = exclusive ? post.visibility === 'subscribers' : post.visibility !== 'subscribers'
      const categoryMatch = category === 'all' || post.category === category
      const keywordMatch =
        keyword.length === 0 ||
        post.content.toLowerCase().includes(keyword) ||
        post.categoryLabel.toLowerCase().includes(keyword)
      return audienceMatch && categoryMatch && keywordMatch
    })
  }, [category, posts, query, subscribed, tab])

  const selectedPost = posts.find((post) => post.id === selectedId) ?? null

  if (member?.name === viewer.name) return <Navigate to="/mypage" replace />

  function toggleLike(id: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
          : post,
      ),
    )
  }

  function toggleBookmark(id: string) {
    setPosts((current) =>
      current.map((post) => (post.id === id ? { ...post, bookmarked: !post.bookmarked } : post)),
    )
  }

  function updateComment(postId: string, commentId: string, content: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              thread: post.thread.map((comment) =>
                comment.id === commentId ? { ...comment, content } : comment,
              ),
            }
          : post,
      ),
    )
  }

  function deleteComment(postId: string, commentId: string) {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post
        const thread = post.thread.filter((comment) => comment.id !== commentId)
        if (thread.length === post.thread.length) return post
        return { ...post, thread, comments: Math.max(0, post.comments - 1) }
      }),
    )
  }

  function addComment(id: string, content: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              comments: post.comments + 1,
              thread: [
                {
                  id: `comment-${Date.now()}`,
                  author: viewer.name,
                  avatar: viewer.avatar,
                  createdAt: formatDateTime(new Date()),
                  content,
                },
                ...post.thread,
              ],
            }
          : post,
      ),
    )
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
          <main className="my-main" aria-label="프로필">
            {profileLoading ? (
              <div className="empty">프로필을 불러오는 중…</div>
            ) : !member ? (
              <div className="empty">{profileError || '프로필을 찾을 수 없습니다.'}</div>
            ) : (
              <>
                <section className="my-summary member-summary">
                  <img src={member.avatar} alt="" />
                  <div>
                    <h2>{member.name}</h2>
                    <p className="my-intro">{member.bio}</p>
                    <p className="my-counts">
                      <button type="button" className="count-link" onClick={() => setFollowTab('followers')}>
                        팔로워 <b>{followerItems.items.length || network.followers.length}</b>
                      </button>
                      <button type="button" className="count-link" onClick={() => setFollowTab('following')}>
                        팔로잉 <b>{followingItems.items.length || network.following.length}</b>
                      </button>
                      <span>
                        게시글 <b>{member.posts}</b>
                      </span>
                    </p>
                    {subscribeError && (
                      <p className="pay-error" role="alert">
                        {subscribeError}
                      </p>
                    )}
                  </div>
                  <div className="member-actions">
                    <button
                      type="button"
                      className={following ? 'member-follow on' : 'member-follow'}
                      aria-pressed={following}
                      onClick={() => setFollowing(member.id, !following)}
                    >
                      {following ? '팔로잉' : '팔로우'}
                    </button>
                    <button
                      type="button"
                      className="member-subscribe"
                      disabled={!statusReady || subscribeBusy}
                      onClick={() => {
                        if (!loggedIn) {
                          navigate('/login')
                          return
                        }
                        if (subscribed) {
                          void cancelMembership()
                          return
                        }
                        navigate(`/member/${member.id}/pay`)
                      }}
                    >
                      <CrownIcon />
                      {subscribed ? '구독 취소' : '구독'}
                    </button>
                  </div>
                </section>

                {subscribed ? (
                  <div className="my-tabs" role="tablist" aria-label="게시글 종류">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tab === 'public'}
                      className={tab === 'public' ? 'my-tab active' : 'my-tab'}
                      onClick={() => setTab('public')}
                    >
                      게시글
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={tab === 'exclusive'}
                      className={tab === 'exclusive' ? 'my-tab active' : 'my-tab'}
                      onClick={() => setTab('exclusive')}
                    >
                      구독자 전용 게시글
                    </button>
                  </div>
                ) : (
                  <h3 className="my-heading">게시글</h3>
                )}
                <div className="my-feed">
                  {visiblePosts.length === 0 ? (
                    <div className="empty">
                      {subscribed && tab === 'exclusive' ? '구독자 전용 글이 없습니다.' : '작성한 글이 없습니다.'}
                    </div>
                  ) : (
                    visiblePosts.map((post) => (
                      <article key={post.id} className="member-post" onClick={() => setSelectedId(post.id)}>
                        <header>
                          <img src={post.avatar} alt="" />
                          <div>
                            <strong>{post.author}</strong>
                            <p>
                              {post.createdAt}
                              <span aria-hidden="true"> | </span>
                              {post.categoryLabel}
                            </p>
                          </div>
                          <span className="more" aria-hidden="true">
                            <DotsIcon />
                          </span>
                        </header>
                        <p className="member-post-text">{post.content}</p>
                        <footer className="post-actions">
                          <span className="stat">
                            <CommentIcon />
                            <span>댓글 {post.comments}</span>
                          </span>
                          <button
                            type="button"
                            className={post.liked ? 'stat liked' : 'stat'}
                            aria-pressed={post.liked}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleLike(post.id)
                            }}
                          >
                            <HeartIcon filled={post.liked} />
                            <span>{post.likes}</span>
                          </button>
                          <span className="stat">
                            <EyeIcon />
                            <span>조회수 {post.views}</span>
                          </span>
                          <button
                            type="button"
                            className={post.bookmarked ? 'bookmark on' : 'bookmark'}
                            aria-pressed={post.bookmarked}
                            aria-label={post.bookmarked ? '북마크 해제' : '북마크'}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleBookmark(post.id)
                            }}
                          >
                            <BookmarkIcon filled={post.bookmarked} />
                          </button>
                        </footer>
                      </article>
                    ))
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
      {member && followTab && (
        <FollowList
          initialTab={followTab}
          followers={followerItems.items}
          following={followingItems.items}
          followedIds={followedIds}
          onToggle={setFollowing}
          onClose={() => setFollowTab(null)}
          followersLoading={followerItems.loading}
          followersError={followerItems.error}
          followingLoading={followingItems.loading}
          followingError={followingItems.error}
        />
      )}
      {writing && (
        <WritePostModal
          user={viewer}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={() => setWriting(false)}
        />
      )}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          user={viewer}
          onClose={() => setSelectedId(null)}
          onToggleLike={toggleLike}
          onToggleBookmark={toggleBookmark}
          onAddComment={addComment}
          onUpdateComment={updateComment}
          onDeleteComment={deleteComment}
        />
      )}
    </div>
  )
}
