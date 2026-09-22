import { BrowserRouter, Route, Routes } from 'react-router'
import AdminPage from './pages/AdminPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MemberPage from './pages/MemberPage'
import MyPage from './pages/MyPage'
import PayPage from './pages/PayPage'
import RegisterPage from './pages/RegisterPage'
import SubscriptionPage from './pages/SubscriptionPage'
import SupportPage from './pages/SupportPage'
import ThemePage from './pages/ThemePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:section" element={<AdminPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/theme/:themeId" element={<ThemePage />} />
        <Route path="/theme" element={<ThemePage />} />
        <Route path="/subscription/:memberId" element={<SubscriptionPage />} />
        <Route path="/member/:memberId/pay" element={<PayPage />} />
        <Route path="/member/:memberId" element={<MemberPage />} />
      </Routes>
    </BrowserRouter>
  )
}
