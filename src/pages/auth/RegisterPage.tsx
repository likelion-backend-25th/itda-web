import { useState, type ChangeEvent, type ComponentType, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { applyAccessToken, login, signup } from '@/api/auth'
import AuthCard, { AuthSwitch } from '@/components/auth/AuthCard'
import type { InterestId } from '@/components/profile/ProfileEditModal'
import {
  ChefHatIcon,
  EyeIcon,
  EyeOffIcon,
  FlightIcon,
  ForkKnifeIcon,
  ImageIcon,
  LockIcon,
  MailIcon,
  NoteIcon,
  OpenBookIcon,
  RunIcon,
  UserIcon,
} from '@/components/icons'

const interests: { id: InterestId; label: string; Icon: ComponentType }[] = [
  { id: 'food', label: '맛집', Icon: ForkKnifeIcon },
  { id: 'travel', label: '여행', Icon: FlightIcon },
  { id: 'workout', label: '운동', Icon: RunIcon },
  { id: 'reading', label: '독서', Icon: OpenBookIcon },
  { id: 'cooking', label: '요리', Icon: ChefHatIcon },
  { id: 'music', label: '음악', Icon: NoteIcon },
]

type RegisterStep = 'account' | 'interest' | 'profile'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<RegisterStep>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [visible, setVisible] = useState(false)
  const [interest, setInterest] = useState<InterestId | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)

  function pickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 'account') {
      if (!email.trim() || !password || !nickname.trim()) {
        setError('이메일, 비밀번호, 닉네임을 입력해 주세요.')
        return
      }
      if (!email.includes('@')) {
        setError('이메일 형식을 확인해 주세요.')
        return
      }
      setError('')
      setStep('interest')
      return
    }
    if (step === 'interest') {
      if (!interest) {
        setError('관심사를 하나 선택해 주세요.')
        return
      }
      setError('')
      setStep('profile')
      return
    }

    // 마지막 단계: 회원가입 API → 바로 로그인
    setLoading(true)
    setError('')
    try {
      const account = {
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      }
      await signup(account)
      const { accessToken } = await login({ email: account.email, password: account.password })
      applyAccessToken(accessToken)
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      className={step === 'interest' ? 'is-interest' : undefined}
      onSubmit={submit}
      footer={<AuthSwitch prompt="이미 계정이 있으신가요?" to="/login" label="로그인" />}
    >
      {step === 'account' && (
        <>
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
              autoComplete="new-password"
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
          <label className="auth-field">
            <UserIcon />
            <input
              type="text"
              name="nickname"
              placeholder="nickname"
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit">
            다음
          </button>
        </>
      )}
      {step === 'interest' && (
        <>
          <p className="register-lead">당신이 가장 좋아하는 것 하나를 알려주세요</p>
          <p className="register-sub">당신의 관심사가 새로운 인연으로 이어질 거예요.</p>
          <div className="register-interests">
            {interests.map((item) => (
              <button
                key={item.id}
                type="button"
                className={interest === item.id ? 'register-interest on' : 'register-interest'}
                aria-pressed={interest === item.id}
                onClick={() => {
                  setInterest(item.id)
                  setError('')
                }}
              >
                <item.Icon />
                {item.label}
              </button>
            ))}
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit">
            다음 →
          </button>
        </>
      )}
      {step === 'profile' && (
        <>
          <label className={preview ? 'profile-picker has-image' : 'profile-picker'}>
            <input type="file" accept="image/*" onChange={pickImage} />
            {preview ? (
              <img src={preview} alt="선택한 프로필 이미지" />
            ) : (
              <>
                <ImageIcon />
                <span>프로필 이미지 선택</span>
              </>
            )}
          </label>
          <p className="profile-picker-note">미선택 시 기본 프로필 적용</p>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '가입 중…' : '회원가입'}
          </button>
        </>
      )}
    </AuthCard>
  )
}
