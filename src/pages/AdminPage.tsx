import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { Navigate, NavLink, useNavigate, useParams } from 'react-router'
import ThemeShot from '../components/ThemeShot'
import {
  AlertIcon,
  CardIcon,
  CommentIcon,
  DocIcon,
  LogoutIcon,
  PaletteIcon,
  RefreshIcon,
  SearchIcon,
  UsersIcon,
} from '../components/icons'
import {
  addTheme,
  adminPageSize,
  getAdminData,
  markRefunded,
  removeMember,
  removePost,
  removeReport,
  removeTheme,
  renameTheme,
  subscribeAdminData,
  type AdminPayment,
  type AdminTheme,
} from '../data/admin'
import { getAdmin, setAdmin, subscribeAdmin } from '../data/adminSession'

const sections = [
  { id: 'members', label: '회원 관리', icon: UsersIcon },
  { id: 'payments', label: '결제 관리', icon: CardIcon },
  { id: 'refunds', label: '환불 관리', icon: RefreshIcon },
  { id: 'subscriptions', label: '구독 관리', icon: DocIcon },
  { id: 'posts', label: '게시글/댓글 관리', icon: CommentIcon },
  { id: 'themes', label: '테마 관리', icon: PaletteIcon },
  { id: 'reports', label: '신고 관리', icon: AlertIcon },
] as const

type SectionId = (typeof sections)[number]['id']

const searchFields: Record<SectionId, { value: string; label: string }[]> = {
  members: [
    { value: 'nickname', label: '닉네임' },
    { value: 'email', label: '이메일' },
    { value: 'provider', label: '인증 방식' },
    { value: 'year', label: '가입년도' },
  ],
  payments: [
    { value: 'orderNo', label: '결제 번호' },
    { value: 'memberId', label: 'member_id' },
    { value: 'targetId', label: 'target_id' },
    { value: 'payType', label: '결제 유형' },
  ],
  refunds: [
    { value: 'orderNo', label: '결제 번호' },
    { value: 'email', label: '회원 email' },
    { value: 'purchaseType', label: '구매 유형' },
    { value: 'payType', label: '결제 유형' },
  ],
  subscriptions: [
    { value: 'orderNo', label: '결제 번호' },
    { value: 'memberId', label: 'member_id' },
    { value: 'targetId', label: 'target_id' },
    { value: 'payType', label: '결제 유형' },
  ],
  posts: [
    { value: 'id', label: 'id' },
    { value: 'nickname', label: '닉네임' },
    { value: 'email', label: '이메일' },
    { value: 'content', label: '내용' },
  ],
  themes: [{ value: 'name', label: '테마 이름' }],
  reports: [
    { value: 'id', label: 'id' },
    { value: 'nickname', label: '닉네임' },
    { value: 'email', label: '이메일' },
    { value: 'content', label: '신고 내용' },
  ],
}

function filterRows<T extends object>(rows: T[], field: string, keyword: string) {
  const text = keyword.trim().toLowerCase()
  if (!text) return rows
  return rows.filter((item) => {
    const record = item as Record<string, unknown>
    if (field) return String(record[field] ?? '').toLowerCase().includes(text)
    return Object.values(record).some((value) => String(value).toLowerCase().includes(text))
  })
}

function slicePage<T>(rows: T[], page: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / adminPageSize))
  const currentPage = Math.min(page, pageCount)
  return {
    pageCount,
    currentPage,
    visible: rows.slice((currentPage - 1) * adminPageSize, currentPage * adminPageSize),
  }
}

function isSection(value: string | undefined): value is SectionId {
  return sections.some((item) => item.id === value)
}

export default function AdminPage() {
  const admin = useSyncExternalStore(subscribeAdmin, getAdmin)
  const { section } = useParams()
  const navigate = useNavigate()

  if (!admin) return <Navigate to="/login" replace />
  if (!isSection(section)) return <Navigate to="/admin/members" replace />

  return (
    <div className="admin-page">
      <aside className="admin-side">
        <strong className="admin-logo">ADMIN</strong>
        <button
          type="button"
          className="admin-logout"
          onClick={() => {
            setAdmin(false)
            navigate('/login')
          }}
        >
          <LogoutIcon />
          로그아웃
        </button>
        <nav className="admin-nav" aria-label="관리자 메뉴">
          {sections.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={`/admin/${item.id}`}
                className={({ isActive }) => (isActive ? 'admin-nav-item on' : 'admin-nav-item')}
              >
                <Icon />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <AdminBoard section={section} />
    </div>
  )
}

function AdminBoard({ section }: { section: SectionId }) {
  const data = useSyncExternalStore(subscribeAdminData, getAdminData)
  const [field, setField] = useState('')
  const [draft, setDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [payment, setPayment] = useState<AdminPayment | null>(null)
  const [editing, setEditing] = useState<AdminTheme | null>(null)
  const [adding, setAdding] = useState(false)
  const [themeName, setThemeName] = useState('')

  useEffect(() => {
    setField('')
    setDraft('')
    setKeyword('')
    setPage(1)
    setPayment(null)
    setEditing(null)
    setAdding(false)
  }, [section])

  const memberPage = slicePage(filterRows(data.members, field, keyword), page)
  const paymentPage = slicePage(filterRows(data.payments, field, keyword), page)
  const refundPage = slicePage(filterRows(data.refunds, field, keyword), page)
  const postPage = slicePage(filterRows(data.posts, field, keyword), page)
  const themePage = slicePage(filterRows(data.themes, field, keyword), page)
  const reportPage = slicePage(filterRows(data.reports, field, keyword), page)
  const active =
    section === 'members'
      ? memberPage
      : section === 'payments' || section === 'subscriptions'
        ? paymentPage
        : section === 'refunds'
          ? refundPage
          : section === 'posts'
            ? postPage
            : section === 'themes'
              ? themePage
              : reportPage

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setKeyword(draft)
    setPage(1)
  }

  function saveTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = themeName.trim()
    if (!name) return
    if (editing) renameTheme(editing.id, name)
    else addTheme(name)
    setEditing(null)
    setAdding(false)
    setThemeName('')
  }

  return (
    <main className="admin-main" aria-label={sections.find((item) => item.id === section)?.label}>
      <form className="admin-search" onSubmit={search}>
        <select aria-label="검색 항목" value={field} onChange={(event) => setField(event.target.value)}>
          <option value="">선택</option>
          {searchFields[section].map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          value={draft}
          placeholder={section === 'themes' ? '테마 이름을 검색하세요.' : '검색어를 입력하세요.'}
          aria-label="검색어"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit">
          <SearchIcon />
          검색
        </button>
      </form>

      {section === 'subscriptions' && (
        <p className="admin-note">결제 후 7일 이내 전액 환불, 이후 남은 구독일 수에 따른 부분 환불(남은 구독일/30)</p>
      )}
      {section !== 'members' && (
        <header className="admin-head">
          <h1>
            {section === 'refunds'
              ? '환불 내역'
              : sections.find((item) => item.id === section)?.label}
          </h1>
          {section === 'themes' && <p>서비스에 제공되는 테마를 관리하고, 새로운 테마를 추가할 수 있습니다.</p>}
        </header>
      )}

      {active.visible.length === 0 ? (
        <p className="admin-empty">검색 결과가 없습니다.</p>
      ) : section === 'themes' ? (
        <div className="admin-themes">
          {themePage.visible.map((theme) => (
            <article key={theme.id} className="admin-theme">
              <ThemeShot tone={theme.tone} />
              <strong>{theme.name}</strong>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(theme)
                    setThemeName(theme.name)
                  }}
                >
                  수정
                </button>
                <button type="button" onClick={() => removeTheme(theme.id)}>
                  삭제
                </button>
              </div>
            </article>
          ))}
          <button type="button" className="admin-theme-add" onClick={() => setAdding(true)}>
            <span>+</span>
            <strong>새로운 테마 추가</strong>
            <small>다양한 분위기의 테마로 서비스를 더 특별하게 만들어보세요.</small>
          </button>
        </div>
      ) : (
        <div className="admin-list">
          {section === 'members' &&
            memberPage.visible.map((member) => (
              <article key={member.id} className="admin-row members">
                <img src={member.avatar} alt="" />
                <Cell label="닉네임" value={member.nickname} />
                <Cell label="이메일" value={member.email} />
                <Cell label="인증 방식" value={member.provider} />
                <Cell label="가입년도" value={member.year} />
                <button type="button" className="admin-danger" onClick={() => removeMember(member.id)}>
                  강퇴
                </button>
              </article>
            ))}
          {(section === 'payments' || section === 'subscriptions') &&
            paymentPage.visible.map((item) => (
              <article key={item.id} className="admin-row pays">
                <Cell label="결제 번호" value={item.orderNo} />
                <Cell label="member_id" value={item.memberId} />
                <Cell label="target_id" value={item.targetId} />
                <Cell label="결제일" value={item.paidOn} />
                <Cell label="만료일" value={item.expiresOn} />
                <Cell label="결제 유형" value={item.payType} />
                {section === 'payments' && (
                  <button type="button" className="admin-danger" onClick={() => setPayment(item)}>
                    상세보기
                  </button>
                )}
              </article>
            ))}
          {section === 'refunds' &&
            refundPage.visible.map((item) => (
              <article key={item.id} className="admin-row refunds">
                <Cell label="결제 번호" value={item.orderNo} />
                <Cell label="회원 email" value={item.email} />
                <Cell label="구매 유형" value={item.purchaseType} />
                <Cell label="결제 유형" value={item.payType} />
                <Cell label="구입 날짜" value={item.purchasedOn} />
                <button
                  type="button"
                  className="admin-danger"
                  disabled={item.refunded}
                  onClick={() => markRefunded(item.id)}
                >
                  {item.refunded ? '완료' : '환불'}
                </button>
              </article>
            ))}
          {section === 'posts' &&
            postPage.visible.map((item) => (
              <article key={item.id} className="admin-row posts">
                <Cell label="id" value={item.id} />
                <Cell label="닉네임" value={item.nickname} />
                <Cell label="이메일" value={item.email} />
                <Cell label="내용" value={item.content} />
                <Cell label="작성일시" value={item.createdAt} />
                <button type="button" className="admin-danger" onClick={() => removePost(item.id)}>
                  삭제
                </button>
              </article>
            ))}
          {section === 'reports' &&
            reportPage.visible.map((item) => (
              <article key={item.id} className="admin-row reports">
                <Cell label="id" value={item.id} />
                <Cell label="닉네임" value={item.nickname} />
                <Cell label="이메일" value={item.email} />
                <Cell label="신고 내용" value={item.content} />
                <Cell label="작성일시" value={item.createdAt} />
                <button type="button" className="admin-danger" onClick={() => removeReport(item.id)}>
                  삭제
                </button>
              </article>
            ))}
        </div>
      )}

      <Pager page={active.currentPage} pageCount={active.pageCount} onPage={setPage} />

      {payment && (
        <div className="detail-backdrop" onClick={() => setPayment(null)}>
          <div className="admin-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>결제 상세</h2>
            <Cell label="결제 번호" value={payment.orderNo} />
            <Cell label="member_id" value={payment.memberId} />
            <Cell label="target_id" value={payment.targetId} />
            <Cell label="결제일" value={payment.paidOn} />
            <Cell label="만료일" value={payment.expiresOn} />
            <Cell label="결제 유형" value={payment.payType} />
            <button type="button" onClick={() => setPayment(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {(editing || adding) && (
        <div
          className="detail-backdrop"
          onClick={() => {
            setEditing(null)
            setAdding(false)
          }}
        >
          <form
            className="admin-dialog"
            onSubmit={saveTheme}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>{editing ? '테마 수정' : '새로운 테마 추가'}</h2>
            <label>
              테마 이름
              <input value={themeName} onChange={(event) => setThemeName(event.target.value)} />
            </label>
            <div>
              <button type="button" onClick={() => { setEditing(null); setAdding(false) }}>
                취소
              </button>
              <button type="submit" disabled={themeName.trim().length === 0}>
                {editing ? '저장' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <small>{label}</small>
      <span>{value}</span>
    </p>
  )
}

function Pager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  return (
    <nav className="admin-pages" aria-label="목록 페이지">
      {Array.from({ length: pageCount }, (_, index) => {
        const number = index + 1
        return (
          <button
            key={number}
            type="button"
            className={number === page ? 'on' : undefined}
            aria-current={number === page ? 'page' : undefined}
            onClick={() => onPage(number)}
          >
            {number}
          </button>
        )
      })}
    </nav>
  )
}
