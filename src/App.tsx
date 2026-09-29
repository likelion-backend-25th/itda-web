import { BrowserRouter, Route, Routes } from 'react-router'
import RequireAuth from '@/components/auth/RequireAuth'
import { useOAuthTokenCapture } from '@/hooks/auth/useOAuthTokenCapture'
import { useSessionThemeSync } from '@/hooks/theme/useSessionThemeSync'
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

export default function App() {
  return (
    <BrowserRouter>
      <OAuthTokenCapture />
      <SessionThemeSync />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/posts/:postId" element={<PostDetailPage />} />
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
    </BrowserRouter>
  )
}
