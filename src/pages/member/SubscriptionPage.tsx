import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { DEFAULT_AVATAR, resolveMemberImageUrl } from '@/api/member'
import { unsubscribeAndRefund } from '@/api/payment'
import { fetchMonthlyIncome, fetchMySubscriptions, fetchSubscriberCount } from '@/api/subscription'
import UnsubscribeRefundDialog from '@/components/payment/UnsubscribeRefundDialog'
import CategoryFeed from '@/components/feed/CategoryFeed'
import Header from '@/components/layout/Header'
import FollowList, { type FollowTab } from '@/components/profile/FollowList'
import ProfileEditModal, { type ProfileForm } from '@/components/profile/ProfileEditModal'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal, { type PostDraft } from '@/components/feed/WritePostModal'
import { GearIcon } from '@/components/icons'
import { myPageCategories, type CategoryId } from '@/data/feed'
import { getLoggedIn, subscribeSession } from '@/data/session'
import { members } from '@/data/members'
import { ensureViewerLoaded, getViewerProfile, refreshViewerProfile, subscribeViewer } from '@/data/viewer'
import { useFollow } from '@/hooks/member/useFollow'
import { useMyFollows } from '@/hooks/member/useMyFollows'
import { useViewerUser } from '@/hooks/member/useViewerUser'
import { usePublishPost } from '@/hooks/post/usePublishPost'
import type { MySubscriptionResponse } from '@/types/subscription'

type SubscriptionTab = 'users' | 'manage'

const banks = ['국민', '신한', '우리', '하나', '농협', '기업', '카카오뱅크', '토스뱅크']

/** 백엔드 회원 id가 목 프로필 하나와만 맞을 때 프로필로 이동 */
function subscriptionProfileHref(targetId: number): string | null {
  const matched = members.filter((member) => member.backendId === targetId)
  if (matched.length !== 1) return null
  return `/member/${matched[0].id}`
}

export default function SubscriptionPage() {
  const { memberId = '' } = useParams()
  const navigate = useNavigate()
  const { publish } = usePublishPost()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [tab, setTab] = useState<SubscriptionTab>('users')
  const [writing, setWriting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bank, setBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountSaved, setAccountSaved] = useState(false)
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const viewer = useViewerUser()
  const me = useSyncExternalStore(subscribeViewer, getViewerProfile)
  const [followTab, setFollowTab] = useState<FollowTab | null>(null)
  const follow = useFollow(loggedIn)
  // GET /members/{내 id}/followers · /followings — 팔로우 토글 후 version 으로 재조회
  const { followers, following } = useMyFollows(loggedIn, follow.version)
  const [profile, setProfile] = useState<ProfileForm>({
    name: '',
    bio: '',
    avatar: DEFAULT_AVATAR,
    interests: ['food', 'travel'],
  })
  const [subscriptions, setSubscriptions] = useState<MySubscriptionResponse[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [pendingCancel, setPendingCancel] = useState<MySubscriptionResponse | null>(null)
  const [refundDone, setRefundDone] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [subscriberCountError, setSubscriberCountError] = useState<string | null>(null)
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null)
  const [monthlyIncomeError, setMonthlyIncomeError] = useState<string | null>(null)

  // 카운트(followerCount 등)가 최신이 되도록 캐시가 있어도 /members/me 를 다시 받는다
  useEffect(() => {
    if (!loggedIn) return
    if (getViewerProfile()) void refreshViewerProfile()
    else void ensureViewerLoaded()
  }, [loggedIn])

  const profileCount = (count: number | undefined) => (!loggedIn ? '—' : (count ?? '…'))

  // /me 프로필로 요약·설정 폼을 맞춘다
  useEffect(() => {
    if (!me) return
    setProfile({
      name: me.nickname || viewer.name,
      bio: me.introduction?.trim() || viewer.bio,
      avatar: resolveMemberImageUrl(me.profileImage) || viewer.avatar || DEFAULT_AVATAR,
      interests: ['food', 'travel'],
    })
  }, [me, viewer.avatar, viewer.bio, viewer.name])

  // 구독 관리: 내 memberId 기준 /count · /income
  useEffect(() => {
    if (!me || !loggedIn) {
      setSubscriberCount(null)
      setMonthlyIncome(null)
      const message = loggedIn ? null : '로그인 후 정산 금액과 구독자 수를 볼 수 있습니다.'
      setSubscriberCountError(message)
      setMonthlyIncomeError(message)
      return
    }

    const targetId = me.id
    let cancelled = false
    setSubscriberCountError(null)
    setMonthlyIncomeError(null)

    async function loadManage() {
      const [countResult, incomeResult] = await Promise.allSettled([
        fetchSubscriberCount(targetId),
        fetchMonthlyIncome(targetId),
      ])
      if (cancelled) return

      if (countResult.status === 'fulfilled') {
        setSubscriberCount(countResult.value.subscriberCount)
      } else {
        setSubscriberCount(null)
        const reason: unknown = countResult.reason
        const message = reason instanceof Error ? reason.message : '구독자 수를 불러오지 못했습니다.'
        setSubscriberCountError(message)
      }

      if (incomeResult.status === 'fulfilled') {
        setMonthlyIncome(incomeResult.value.monthlyIncome)
      } else {
        setMonthlyIncome(null)
        const reason: unknown = incomeResult.reason
        const message = reason instanceof Error ? reason.message : '정산 금액을 불러오지 못했습니다.'
        setMonthlyIncomeError(message)
      }
    }

    void loadManage()
    return () => {
      cancelled = true
    }
  }, [loggedIn, me])

  // GET /api/v1/subscriptions/me — 내가 구독 중인 사용자
  useEffect(() => {
    if (!loggedIn) {
      setSubscriptions([])
      setSubscriptionsLoading(false)
      setSubscriptionsError('로그인 후 구독한 사용자를 볼 수 있습니다.')
      return
    }

    let cancelled = false
    setSubscriptionsLoading(true)
    setSubscriptionsError(null)

    async function loadSubscriptions() {
      try {
        const list = await fetchMySubscriptions()
        if (!cancelled) setSubscriptions(list)
      } catch (error: unknown) {
        if (cancelled) return
        setSubscriptions([])
        const message = error instanceof Error ? error.message : '구독 목록을 불러오지 못했습니다.'
        setSubscriptionsError(message)
      } finally {
        if (!cancelled) setSubscriptionsLoading(false)
      }
    }

    void loadSubscriptions()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (keyword.length === 0) return subscriptions
    return subscriptions.filter((item) => item.nickname.toLowerCase().includes(keyword))
  }, [query, subscriptions])

  async function confirmUnsubscribe() {
    if (!pendingCancel || cancelingId != null) return
    setCancelingId(pendingCancel.subscriptionId)
    setSubscriptionsError(null)
    try {
      await unsubscribeAndRefund(pendingCancel.targetId)
      setSubscriptions((current) => current.filter((row) => row.subscriptionId !== pendingCancel.subscriptionId))
      setRefundDone(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '구독 해제에 실패했습니다.'
      setSubscriptionsError(message)
    } finally {
      setCancelingId(null)
    }
  }

  function saveAccount() {
    if (!bank || accountNumber.trim().length === 0) {
      setAccountSaved(false)
      setAccountError('은행과 계좌번호를 입력해 주세요.')
      return
    }
    setAccountError('')
    setAccountSaved(true)
  }

  if (memberId !== 'me' && !(me != null && memberId === String(me.id))) {
    return <Navigate to="/subscription/me" replace />
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
          <main className="my-main" aria-label="구독">
            {category !== 'all' ? (
              <CategoryFeed category={category} query={query} />
            ) : (
            <>
            <section className="my-summary member-summary">
              <img src={profile.avatar} alt="" />
              <div>
                <h2>{profile.name}</h2>
                <p className="my-intro">{profile.bio}</p>
                <p className="my-counts">
                  <button type="button" className="count-link" onClick={() => setFollowTab('followers')}>
                    팔로워 <b>{profileCount(me?.followerCount)}</b>
                  </button>
                  <button type="button" className="count-link" onClick={() => setFollowTab('following')}>
                    팔로잉 <b>{profileCount(me?.followingCount)}</b>
                  </button>
                  <span>
                    게시글 <b>{profileCount(me?.postCount)}</b>
                  </span>
                </p>
              </div>
              <button type="button" className="settings-btn" onClick={() => setSettingsOpen(true)}>
                <GearIcon />
                설정
              </button>
            </section>

            <div className="my-tabs" role="tablist" aria-label="구독 메뉴">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'users'}
                className={tab === 'users' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('users')}
              >
                구독한 사용자
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'manage'}
                className={tab === 'manage' ? 'my-tab active' : 'my-tab'}
                onClick={() => setTab('manage')}
              >
                구독 관리
              </button>
            </div>

            {tab === 'manage' ? (
              <section className="settle" aria-label="구독 관리">
                <div className="settle-row">
                  <span>이번 달 정산 금액</span>
                  <strong className="settle-amount">
                    {monthlyIncomeError
                      ? '—'
                      : monthlyIncome == null
                        ? '…'
                        : `${monthlyIncome.toLocaleString('ko-KR')} ₩`}
                  </strong>
                </div>
                <div className="settle-row">
                  <span>구독자 수</span>
                  <strong className="settle-count">
                    {subscriberCountError ? '—' : subscriberCount == null ? '…' : subscriberCount.toLocaleString('ko-KR')}
                  </strong>
                </div>
                {monthlyIncomeError && <p className="settle-error">{monthlyIncomeError}</p>}
                {subscriberCountError && subscriberCountError !== monthlyIncomeError && (
                  <p className="settle-error">{subscriberCountError}</p>
                )}
                <form
                  className="settle-account"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveAccount()
                  }}
                >
                  <h3>입금 계좌번호</h3>
                  <div className="settle-fields">
                    <select
                      className={bank ? 'settle-bank' : 'settle-bank is-placeholder'}
                      value={bank}
                      aria-label="은행"
                      onChange={(event) => {
                        setBank(event.target.value)
                        setAccountSaved(false)
                      }}
                    >
                      <option value="">은행</option>
                      {banks.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="settle-number"
                      value={accountNumber}
                      placeholder="123-4567-8888-9999"
                      aria-label="계좌번호"
                      onChange={(event) => {
                        setAccountNumber(event.target.value)
                        setAccountSaved(false)
                      }}
                    />
                  </div>
                  {accountError && <p className="settle-error">{accountError}</p>}
                  {accountSaved && (
                    <p className="settle-saved">
                      {bank} {accountNumber.trim()} 계좌가 저장되었습니다.
                    </p>
                  )}
                  <button type="submit" className="settle-save">
                    저장
                  </button>
                </form>
              </section>
            ) : (
            <div className="sub-list">
              {subscriptionsError && <p className="settle-error">{subscriptionsError}</p>}
              {subscriptionsLoading ? (
                <div className="empty">구독 목록을 불러오는 중…</div>
              ) : visible.length === 0 && !subscriptionsError ? (
                <div className="empty">구독한 사용자가 없습니다.</div>
              ) : (
                visible.map((item) => {
                  const href = subscriptionProfileHref(item.targetId)
                  const avatar = resolveMemberImageUrl(item.profileImage)
                  return (
                    <article key={item.subscriptionId} className="sub-card">
                      {href ? (
                        <Link to={href} className="sub-photo" aria-label={`${item.nickname} 프로필`}>
                          <img
                            src={avatar}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.src = DEFAULT_AVATAR
                            }}
                          />
                        </Link>
                      ) : (
                        <img
                          className="sub-photo"
                          src={avatar}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.src = DEFAULT_AVATAR
                          }}
                        />
                      )}
                      <div className="sub-copy">
                        {href ? (
                          <Link to={href} className="sub-name">
                            {item.nickname}
                          </Link>
                        ) : (
                          <strong className="sub-name">{item.nickname}</strong>
                        )}
                      </div>
                      <p className="sub-days">{item.remainingDays}일 남음</p>
                      <button
                        type="button"
                        className="sub-cancel"
                        disabled={cancelingId === item.subscriptionId}
                        onClick={() => setPendingCancel(item)}
                      >
                        구독 취소
                      </button>
                    </article>
                  )
                })
              )}
            </div>
            )}
            </>
            )}
          </main>
        </div>
      </div>
      {followTab && (
        <FollowList
          initialTab={followTab}
          followers={followers.items}
          following={following.items}
          followedIds={follow.followedIds}
          pendingIds={follow.pendingIds}
          actionError={follow.error}
          viewerId={me ? String(me.id) : null}
          onToggle={(targetId, next) => void follow.toggle(targetId, next)}
          onClose={() => setFollowTab(null)}
          followersLoading={followers.loading}
          followersError={followers.error}
          followingLoading={following.loading}
          followingError={following.error}
        />
      )}
      {writing && (
        <WritePostModal
          user={viewer}
          categories={myPageCategories}
          onClose={() => setWriting(false)}
          onPublish={async (draft: PostDraft) => {
            await publish(draft)
            setWriting(false)
            navigate('/')
          }}
        />
      )}
      {pendingCancel && (
        <UnsubscribeRefundDialog
          name={pendingCancel.nickname}
          busy={cancelingId === pendingCancel.subscriptionId}
          error={subscriptionsError ?? ''}
          done={refundDone}
          onClose={() => {
            if (cancelingId != null) return
            const targetId = pendingCancel.targetId
            setPendingCancel(null)
            setRefundDone(false)
            setSubscriptionsError(null)
            if (refundDone) navigate(`/member/${targetId}`)
          }}
          onConfirm={() => {
            void confirmUnsubscribe()
          }}
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
    </div>
  )
}
