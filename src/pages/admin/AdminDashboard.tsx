import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  CardIcon,
  CommentIcon,
  DocIcon,
  PaletteIcon,
  RefreshIcon,
  UsersIcon,
} from '@/components/icons'
import {
  fetchAdminMembers,
  fetchAdminPosts,
  fetchAdminReplies,
  fetchAdminThemes,
} from '@/api/admin'
import { fetchAdminPayments, fetchAdminRefunds } from '@/api/adminPayment'
import { fetchAdminSubscriptions } from '@/api/adminSubscription'
import type { AdminMember, AdminPayment, AdminPost, AdminSubscription, AdminTheme } from '@/data/admin'

type DashData = {
  members: AdminMember[]
  payments: AdminPayment[]
  refunds: AdminPayment[]
  subscriptions: AdminSubscription[]
  posts: AdminPost[]
  replies: AdminPost[]
  themes: AdminTheme[]
}

type DashKey = keyof DashData

const empty: DashData = {
  members: [],
  payments: [],
  refunds: [],
  subscriptions: [],
  posts: [],
  replies: [],
  themes: [],
}

function won(amount: string): string {
  const value = Number(amount)
  if (!Number.isFinite(value)) return amount
  return `${value.toLocaleString('ko-KR')}원`
}

function countLabel(failed: boolean, value: number): string {
  return failed ? '—' : value.toLocaleString('ko-KR')
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashData>(empty)
  const [failed, setFailed] = useState<Record<DashKey, boolean>>({
    members: false,
    payments: false,
    refunds: false,
    subscriptions: false,
    posts: false,
    replies: false,
    themes: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [members, payments, refunds, subscriptions, posts, replies, themes] = await Promise.allSettled([
        fetchAdminMembers(),
        fetchAdminPayments(),
        fetchAdminRefunds(),
        fetchAdminSubscriptions(),
        fetchAdminPosts(),
        fetchAdminReplies(),
        fetchAdminThemes(),
      ])
      if (cancelled) return

      const nextFailed: Record<DashKey, boolean> = {
        members: members.status === 'rejected',
        payments: payments.status === 'rejected',
        refunds: refunds.status === 'rejected',
        subscriptions: subscriptions.status === 'rejected',
        posts: posts.status === 'rejected',
        replies: replies.status === 'rejected',
        themes: themes.status === 'rejected',
      }
      setFailed(nextFailed)
      setData({
        members: members.status === 'fulfilled' ? members.value : [],
        payments: payments.status === 'fulfilled' ? payments.value : [],
        refunds: refunds.status === 'fulfilled' ? refunds.value : [],
        subscriptions: subscriptions.status === 'fulfilled' ? subscriptions.value : [],
        posts: posts.status === 'fulfilled' ? posts.value : [],
        replies: replies.status === 'fulfilled' ? replies.value : [],
        themes: themes.status === 'fulfilled' ? themes.value : [],
      })
      setError(Object.values(nextFailed).some(Boolean) ? '일부 현황을 불러오지 못했습니다.' : null)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const suspended = data.members.filter((item) => !item.active).length
  const paymentSum = data.payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const activeSubs = data.subscriptions.filter((item) => item.status === '구독 중').length
  const onSale = data.themes.filter((item) => item.active).length
  const boardFailed = failed.posts || failed.replies

  const cards = [
    {
      to: '/admin/members',
      label: '회원',
      icon: UsersIcon,
      value: loading ? '…' : countLabel(failed.members, data.members.length),
      detail: failed.members ? '불러오기 실패' : `활동 정지 ${suspended.toLocaleString('ko-KR')}명`,
    },
    {
      to: '/admin/payments',
      label: '결제',
      icon: CardIcon,
      value: loading ? '…' : countLabel(failed.payments, data.payments.length),
      detail: failed.payments ? '불러오기 실패' : `합계 ${paymentSum.toLocaleString('ko-KR')}원`,
    },
    {
      to: '/admin/refunds',
      label: '환불 대기',
      icon: RefreshIcon,
      value: loading ? '…' : countLabel(failed.refunds, data.refunds.length),
      detail: failed.refunds ? '불러오기 실패' : '수락 대기 중인 신청',
    },
    {
      to: '/admin/subscriptions',
      label: '구독',
      icon: DocIcon,
      value: loading ? '…' : countLabel(failed.subscriptions, data.subscriptions.length),
      detail: failed.subscriptions ? '불러오기 실패' : `구독 중 ${activeSubs.toLocaleString('ko-KR')}건`,
    },
    {
      to: '/admin/posts',
      label: '게시글/댓글',
      icon: CommentIcon,
      value: loading ? '…' : countLabel(boardFailed, data.posts.length + data.replies.length),
      detail: boardFailed
        ? '불러오기 실패'
        : `글 ${data.posts.length.toLocaleString('ko-KR')} · 댓글 ${data.replies.length.toLocaleString('ko-KR')}`,
    },
    {
      to: '/admin/themes',
      label: '테마',
      icon: PaletteIcon,
      value: loading ? '…' : countLabel(failed.themes, data.themes.length),
      detail: failed.themes ? '불러오기 실패' : `판매 중 ${onSale.toLocaleString('ko-KR')}개`,
    },
  ]

  return (
    <main className="admin-main" aria-label="대시보드">
      <header className="admin-head">
        <h1>대시보드</h1>
        <p>회원, 결제, 구독, 콘텐츠, 테마 현황을 한눈에 확인합니다.</p>
      </header>
      {error && (
        <p className="admin-note" role="alert">
          {error}
        </p>
      )}
      <div className="admin-stats">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.to} className="admin-stat" to={card.to}>
              <span className="admin-stat-icon" aria-hidden="true">
                <Icon />
              </span>
              <small>{card.label}</small>
              <strong>{card.value}</strong>
              <em>{loading ? '집계 중…' : card.detail}</em>
            </Link>
          )
        })}
      </div>
      <div className="admin-panels">
        <section className="admin-panel">
          <header>
            <h2>최근 결제</h2>
            <Link to="/admin/payments">전체 보기</Link>
          </header>
          {loading ? (
            <p className="admin-empty">결제 내역을 불러오는 중…</p>
          ) : failed.payments ? (
            <p className="admin-empty">결제 내역을 불러오지 못했습니다.</p>
          ) : data.payments.length === 0 ? (
            <p className="admin-empty">결제 내역이 없습니다.</p>
          ) : (
            <ul>
              {data.payments.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <strong>#{item.orderNo}</strong>
                  <span>{item.paymentType}</span>
                  <span>{won(item.amount)}</span>
                  <time>{item.paidOn}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="admin-panel">
          <header>
            <h2>환불 대기</h2>
            <Link to="/admin/refunds">전체 보기</Link>
          </header>
          {loading ? (
            <p className="admin-empty">환불 신청을 불러오는 중…</p>
          ) : failed.refunds ? (
            <p className="admin-empty">환불 신청을 불러오지 못했습니다.</p>
          ) : data.refunds.length === 0 ? (
            <p className="admin-empty">대기 중인 환불이 없습니다.</p>
          ) : (
            <ul>
              {data.refunds.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <strong>#{item.orderNo}</strong>
                  <span>{item.paymentType}</span>
                  <span>{won(item.amount)}</span>
                  <time>{item.paidOn}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="admin-panel">
          <header>
            <h2>최근 가입</h2>
            <Link to="/admin/members">전체 보기</Link>
          </header>
          {loading ? (
            <p className="admin-empty">회원 목록을 불러오는 중…</p>
          ) : failed.members ? (
            <p className="admin-empty">회원 목록을 불러오지 못했습니다.</p>
          ) : data.members.length === 0 ? (
            <p className="admin-empty">가입한 회원이 없습니다.</p>
          ) : (
            <ul>
              {data.members.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <strong>{item.nickname}</strong>
                  <span>{item.email}</span>
                  <time>{item.joinedOn}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="admin-panel">
          <header>
            <h2>최근 구독</h2>
            <Link to="/admin/subscriptions">전체 보기</Link>
          </header>
          {loading ? (
            <p className="admin-empty">구독 목록을 불러오는 중…</p>
          ) : failed.subscriptions ? (
            <p className="admin-empty">구독 목록을 불러오지 못했습니다.</p>
          ) : data.subscriptions.length === 0 ? (
            <p className="admin-empty">구독 내역이 없습니다.</p>
          ) : (
            <ul>
              {data.subscriptions.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <strong>{item.memberNickname}</strong>
                  <span>{item.targetNickname}</span>
                  <span>{item.status}</span>
                  <time>{item.startedOn}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
