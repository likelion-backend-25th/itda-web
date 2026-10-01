import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import RequireAuth from '@/components/auth/RequireAuth'
import { useOAuthTokenCapture } from '@/hooks/auth/useOAuthTokenCapture'
import { useSessionThemeSync } from '@/hooks/theme/useSessionThemeSync'
import type { PostModalState } from '@/data/feed'
import AdminPage from '@/pages/admin/AdminPage'
import HomePage from '@/pages/home/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import MemberPage from '@/pages/member/MemberPage'
import MyPage from '@/pages/member/MyPage'
import PayPage from '@/pages/member/PayPage'
import PostDetailPage from '@/pages/post/PostDetailPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import SubscriptionPage from '@/pages/member/SubscriptionPage'
import SupportPage from '@/pages/support/SupportPage'
import ThemePage from '@/pages/theme/ThemePage'

function OAuthTokenCapture() {
  useOAuthTokenCapture()
  return null
}

function SessionThemeSync() {
  useSessionThemeSync()
  return null
}

/** SPA는 문서가 유지되므로 경로가 바뀔 때 직접 맨 위로 올린다. 게시글 모달은 제외. */
function ScrollToTop() {
  const location = useLocation()
  const background = (location.state as PostModalState | null)?.backgroundLocation
  const pagePath = background?.pathname ?? location.pathname

  useEffect(() => {
    if (background) return
    window.scrollTo(0, 0)
  }, [pagePath, background])

  return null
}

function AppRoutes() {
  const location = useLocation()
  const background = (location.state as PostModalState | null)?.backgroundLocation
  const isPostDetailPath = /^\/posts\/[^/]+$/.test(location.pathname)

  return (
    <>
      {/* 모달일 때는 이전 화면(background)을 그대로 렌더해 피드를 유지한다 */}
      <Routes location={background ?? location}>
        <Route path="/" element={<HomePage />} />
        {/* 공유 링크로 /posts/:id 직접 진입 시에도 홈 피드를 배경으로 둔다 */}
        <Route path="/posts/:postId" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:section" element={<AdminPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/mypage"
          element={
            <RequireAuth>
              <MyPage />
            </RequireAuth>
          }
        />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/theme/:themeId" element={<ThemePage />} />
        <Route path="/theme" element={<ThemePage />} />
        <Route
          path="/subscription/:memberId"
          element={
            <RequireAuth>
              <SubscriptionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/member/:memberId/pay"
          element={
            <RequireAuth>
              <PayPage />
            </RequireAuth>
          }
        />
        <Route path="/member/:memberId" element={<MemberPage />} />
      </Routes>

      {(background || isPostDetailPath) && (
        <Routes>
          <Route path="/posts/:postId" element={<PostDetailPage />} />
        </Routes>
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <OAuthTokenCapture />
      <SessionThemeSync />
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  )
}
