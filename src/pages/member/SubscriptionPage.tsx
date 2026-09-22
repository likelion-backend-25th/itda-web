import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import CategoryFeed from '@/components/feed/CategoryFeed'
import FollowList, { type FollowTab } from '@/components/profile/FollowList'
import Header from '@/components/layout/Header'
import ProfileEditModal, { type ProfileForm } from '@/components/profile/ProfileEditModal'
import Sidebar from '@/components/layout/Sidebar'
import WritePostModal from '@/components/feed/WritePostModal'
import { GearIcon } from '@/components/icons'
import { currentUser, myPageCategories, type CategoryId } from '@/data/feed'
import { getFollowingIds, memberFollowIds, setFollowing, subscribeFollows } from '@/data/follows'
import { memberById, profilePath } from '@/data/members'
import {
  creatorSubscriberCount,
  getMemberships,
  setSubscribed,
  settlementAmount,
  subscribeMemberships,
} from '@/data/subscriptions'

type SubscriptionTab = 'users' | 'manage'

const banks = ['국민', '신한', '우리', '하나', '농협', '기업', '카카오뱅크', '토스뱅크']

export default function SubscriptionPage() {
  const { memberId = '' } = useParams()
  const owner = memberById('jieun')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [tab, setTab] = useState<SubscriptionTab>('users')
  const [writing, setWriting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [followTarget, setFollowTarget] = useState<{ memberId: string; tab: FollowTab } | null>(null)
  const [bank, setBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountSaved, setAccountSaved] = useState(false)
  const [profile, setProfile] = useState<ProfileForm>({
    name: owner?.name ?? currentUser.name,
    bio: owner?.bio ?? currentUser.bio,
    avatar: owner?.avatar ?? currentUser.avatar,
    interests: ['food', 'travel'],
  })
  const memberships = useSyncExternalStore(subscribeMemberships, getMemberships)
  const followedIds = useSyncExternalStore(subscribeFollows, getFollowingIds)

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return memberships.flatMap((membership) => {
      const member = memberById(membership.memberId)
      if (!member) return []
      const matched =
        keyword.length === 0 ||
        member.name.toLowerCase().includes(keyword) ||
        member.bio.toLowerCase().includes(keyword)
      return matched ? [{ membership, member }] : []
    })
  }, [memberships, query])

  function saveAccount() {
    if (!bank || accountNumber.trim().length === 0) {
      setAccountSaved(false)
      setAccountError('은행과 계좌번호를 입력해 주세요.')
      return
    }
    setAccountError('')
    setAccountSaved(true)
  }

  if (memberId !== 'jieun') return <Navigate to="/subscription/jieun" replace />

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
                  <span>
                    팔로워 <b>{owner?.followers ?? 100}</b>
                  </span>
                  <span>
                    팔로잉 <b>{owner?.following ?? 100}</b>
                  </span>
                  <span>
                    게시글 <b>{owner?.posts ?? 100}</b>
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
                  <strong className="settle-amount">{settlementAmount.toLocaleString('ko-KR')} ₩</strong>
                </div>
                <div className="settle-row">
                  <span>구독자 수</span>
                  <strong className="settle-count">{creatorSubscriberCount.toLocaleString('ko-KR')}</strong>
                </div>
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
              {visible.length === 0 ? (
                <div className="empty">구독한 사용자가 없습니다.</div>
              ) : (
                visible.map(({ membership, member }) => {
                  const href = profilePath(member.name)
                  const network = memberFollowIds(member.id)
                  return (
                    <article key={member.id} className="sub-card">
                      {href ? (
                        <Link to={href} className="sub-photo" aria-label={`${member.name} 프로필`}>
                          <img src={member.avatar} alt="" />
                        </Link>
                      ) : (
                        <img className="sub-photo" src={member.avatar} alt="" />
                      )}
                      <div className="sub-copy">
                        {href ? (
                          <Link to={href} className="sub-name">
                            {member.name}
                          </Link>
                        ) : (
                          <strong className="sub-name">{member.name}</strong>
                        )}
                        <p className="my-counts">
                          <button
                            type="button"
                            className="count-link"
                            onClick={() => setFollowTarget({ memberId: member.id, tab: 'followers' })}
                          >
                            팔로워 <b>{network.followers.length}</b>
                          </button>
                          <button
                            type="button"
                            className="count-link"
                            onClick={() => setFollowTarget({ memberId: member.id, tab: 'following' })}
                          >
                            팔로잉 <b>{network.following.length}</b>
                          </button>
                          <span>
                            게시글 <b>{member.posts}</b>
                          </span>
                        </p>
                      </div>
                      <p className="sub-days">{membership.daysLeft}일 남음</p>
                      <button type="button" className="sub-cancel" onClick={() => setSubscribed(member.id, false)}>
                        구독해제
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
      {followTarget && (
        <FollowList
          initialTab={followTarget.tab}
          followers={memberFollowIds(followTarget.memberId).followers}
          following={memberFollowIds(followTarget.memberId).following}
          followedIds={followedIds}
          onToggle={setFollowing}
          onClose={() => setFollowTarget(null)}
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
