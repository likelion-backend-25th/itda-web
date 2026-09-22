import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { OwnedTheme } from '../data/mypage'
import { pageProfile } from '../data/mypage'
import { CloseIcon, HeartIcon, PencilIcon } from './icons'

const previewPhotos = [
  '/images/photo-cliff.jpg',
  '/images/photo-palms.jpg',
  '/images/photo-field.jpg',
  '/images/photo-cafe.jpg',
]

const people = [
  { name: '여행하는지은', handle: '@jieun_travel', avatar: '/images/avatar-jieun.jpg' },
  { name: '김라떼', handle: '@latte_daily', avatar: '/images/avatar-haneul.jpg' },
  { name: '오늘도작은행복', handle: '@happy_day2', avatar: '/images/avatar-minsu.jpg' },
  { name: '풍경수집가', handle: '@scenery_pic', avatar: '/images/avatar-dohyun.jpg' },
]

type ThemeDetailProps = {
  theme: OwnedTheme
  onClose: () => void
  onApply: () => void
}

export default function ThemeDetail({ theme, onClose, onApply }: ThemeDetailProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return createPortal(
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className="theme-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <ThemeBoard tone={theme.tone} />
        <aside className="theme-detail-side">
          <button ref={closeRef} type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
          <h2 id={titleId}>{theme.title}</h2>
          <p>{theme.subtitle}</p>
          <button type="button" className="theme-apply" onClick={onApply}>
            적용
          </button>
        </aside>
      </div>
    </div>,
    document.body,
  )
}

function ThemeBoard({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <div className={`theme-board ${tone}`} aria-hidden="true">
      <header className="board-top">
        <strong>ITDA</strong>
        <span className="board-search">검색창</span>
        <span>알림</span>
        <span>메시지</span>
        <img src={pageProfile.avatar} alt="" />
      </header>
      <div className="board-layout">
        <aside className="board-side">
          <img src={pageProfile.avatar} alt="" />
          <em>프로필</em>
          <span className="board-write">
            <PencilIcon />
            글쓰기
          </span>
          <span>홈 (SNS 메인페이지)</span>
          <span>메시지(DM)</span>
          <span className="on">마이페이지</span>
          <span>테마 구매</span>
          <span>구독</span>
          <b>카테고리</b>
          <span className="dot">전체</span>
          <span className="dot">맛집</span>
          <span className="dot">여행</span>
        </aside>
        <div className="board-main">
          <div className="board-compose">
            <img src={pageProfile.avatar} alt="" />
            <div>
              <p>무슨 생각을 하고 계신가요?</p>
              <div>
                <span>사진</span>
                <span>동영상</span>
                <span>장소</span>
                <span>이모티콘</span>
                <strong>게시하기</strong>
              </div>
            </div>
          </div>
          <div className="board-filters">
            <span className="on">전체</span>
            <span>팔로잉</span>
            <span>인기</span>
            <span>최신</span>
          </div>
          <article className="board-post">
            <header>
              <img src={pageProfile.avatar} alt="" />
              <div>
                <strong>{pageProfile.name}</strong>
                <small>2시간 전</small>
              </div>
            </header>
            <p>오늘의 야경 🌙 역시 도시는 밤이 더 아름답네요 ✨</p>
            <div className="board-photos">
              {previewPhotos.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>
            <footer>
              <HeartIcon filled />
              <span>256</span>
              <span>48</span>
            </footer>
          </article>
        </div>
        <aside className="board-rail">
          <div className="board-panel">
            <header>
              <strong>추천 사용자</strong>
              <small>더보기</small>
            </header>
            {people.map((person) => (
              <div key={person.handle} className="board-person">
                <img src={person.avatar} alt="" />
                <div>
                  <strong>{person.name}</strong>
                  <small>{person.handle}</small>
                </div>
                <em>팔로우</em>
              </div>
            ))}
          </div>
          <div className="board-panel">
            <header>
              <strong>실시간 인기 게시물</strong>
              <small>더보기</small>
            </header>
            <div className="board-popular">
              <img src="/images/photo-cliff.jpg" alt="" />
              <div>
                <strong>제주도의 푸른 바다</strong>
                <small>좋아요 1.2만</small>
              </div>
            </div>
            <div className="board-popular">
              <img src="/images/photo-cafe.jpg" alt="" />
              <div>
                <strong>서울 밤거리 산책</strong>
                <small>좋아요 8.7천</small>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
