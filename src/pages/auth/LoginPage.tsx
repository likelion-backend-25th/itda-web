import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { applyAccessToken, login } from '@/api/auth'
import AuthCard, { AuthSwitch, GoogleMark, KakaoMark } from '@/components/auth/AuthCard'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/components/icons'
import { setAdmin } from '@/data/adminSession'

const adminId = 'admin@example.com'
const adminPassword = '1111'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = email.trim()
    if (!id || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    // 프론트 전용 관리자 진입 (백엔드 계정과 별개)
    if (id === adminId) {
      if (password !== adminPassword) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }
      setAdmin(true)
      navigate('/admin/members')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { accessToken } = await login({ email: id, password })
      applyAccessToken(accessToken)
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      noValidate
      onSubmit={submit}
      footer={<AuthSwitch prompt="아직 계정이 없으신가요?" to="/register" label="회원가입" />}
    >
      <label className="auth-field">
        <MailIcon />
        <input
          type="email"
          name="email"
          placeholder="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="auth-field">
        <LockIcon />
        <input
          type={visible ? 'text' : 'password'}
          name="password"
          placeholder="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          type="button"
          className="auth-eye"
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
          onClick={() => setVisible((open) => !open)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? '로그인 중…' : '로그인'}
      </button>
      <a className="auth-social" href="/oauth2/authorization/google">
        <GoogleMark />
        구글로 로그인
      </a>
      <a className="auth-social" href="/oauth2/authorization/kakao">
        <KakaoMark />
        카카오로 로그인
      </a>
    </AuthCard>
  )
}
