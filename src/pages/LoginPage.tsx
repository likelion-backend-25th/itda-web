import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import AuthCard, { AuthSwitch, GoogleMark, KakaoMark } from '../components/AuthCard'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/icons'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    navigate('/')
  }

  return (
    <AuthCard
      onSubmit={submit}
      footer={<AuthSwitch prompt="아직 계정이 없으신가요?" to="/signup" label="회원가입" />}
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
      <button type="submit" className="auth-submit">
        로그인
      </button>
      <button type="button" className="auth-social" onClick={() => navigate('/')}>
        <GoogleMark />
        구글로 로그인
      </button>
      <button type="button" className="auth-social" onClick={() => navigate('/')}>
        <KakaoMark />
        카카오로 로그인
      </button>
    </AuthCard>
  )
}
