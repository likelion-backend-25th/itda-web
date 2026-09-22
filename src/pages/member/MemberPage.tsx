import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import FollowList, { type FollowTab } from '@/components/profile/FollowList'
import Header from '@/components/layout/Header'
import PostDetail from '@/components/feed/PostDetail'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal from '@/components/feed/WritePostModal'
import { BookmarkIcon, CommentIcon, CrownIcon, DotsIcon, EyeIcon, HeartIcon } from '@/components/icons'
import { currentUser, formatDateTime, initialPosts, myPageCategories, type CategoryId, type Post } from '@/data/feed'
import { getFollowingIds, memberFollowIds, setFollowing, subscribeFollows } from '@/data/follows'
import { memberById } from '@/data/members'
import { getSubscribedIds, setSubscribed, subscribeMemberships } from '@/data/subscriptions'

export default function MemberPage() {
  const { memberId = '' } = useParams()
  const member = memberById(memberId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [tab, setTab] = useState<'public' | 'exclusive'>('public')
  const [followTab, setFollowTab] = useState<FollowTab | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const subscribedIds = useSyncExternalStore(subscribeMemberships, getSubscribedIds)
  const followedIds = useSyncExternalStore(subscribeFollows, getFollowingIds)
  const subscribed = member ? subscribedIds.has(member.id) : false
  const following = member ? followedIds.has(member.id) : false
  const network = member ? memberFollowIds(member.id) : { followers: [], following: [] }

  useEffect(() => {
    setFollowTab(null)
    setTab('public')
    setCategory('all')
    setSelectedId(null)
    setPosts(member ? initialPosts.filter((post) => post.author === member.name) : [])
  }, [member])

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

  if (member?.name === currentUser.name) return <Navigate to="/mypage" replace />

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
                  author: currentUser.name,
                  avatar: currentUser.avatar,
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
        <Header query={query} user={currentUser} onQueryChange={setQuery} />
        <div className="layout">
          <Sidebar
            user={currentUser}
            category={category}
            categories={myPageCategories}
            categoriesOpen={categoriesOpen}
            onCategoryChange={setCategory}
            onToggleCategories={() => setCategoriesOpen((open) => !open)}
            onWrite={() => setWriting(true)}
          />
          <main className="my-main" aria-label="프로필">
            {!member ? (
              <div className="empty">프로필을 찾을 수 없습니다.</div>
            ) : (
              <>
                <section className="my-summary member-summary">
                  <img src={member.avatar} alt="" />
                  <div>
                    <h2>{member.name}</h2>
                    <p className="my-intro">{member.bio}</p>
                    <p className="my-counts">
                      <button type="button" className="count-link" onClick={() => setFollowTab('followers')}>
                        팔로워 <b>{network.followers.length}</b>
                      </button>
                      <button type="button" className="count-link" onClick={() => setFollowTab('following')}>
                        팔로잉 <b>{network.following.length}</b>
                      </button>
                      <span>
                        게시글 <b>{member.posts}</b>
                      </span>
                    </p>
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
                    {subscribed ? (
                      <button
                        type="button"
                        className="member-subscribe"
                        onClick={() => {
                          setSubscribed(member.id, false)
                          setTab('public')
                        }}
                      >
                        <CrownIcon />
                        구독취소
                      </button>
                    ) : (
                      <Link to={`/member/${member.id}/pay`} className="member-subscribe">
                        <CrownIcon />
                        구독
                      </Link>
                    )}
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
          followers={network.followers}
          following={network.following}
          followedIds={followedIds}
          onToggle={setFollowing}
          onClose={() => setFollowTab(null)}
        />
      )}
      {writing && (
        <WritePostModal
          user={currentUser}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={() => setWriting(false)}
        />
      )}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          user={currentUser}
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
