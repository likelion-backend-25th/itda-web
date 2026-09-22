import { useState, type ChangeEvent, type ComponentType, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import AuthCard, { AuthSwitch } from '../components/AuthCard'
import type { InterestId } from '../components/ProfileEditModal'
import {
  ChefHatIcon,
  FlightIcon,
  ForkKnifeIcon,
  ImageIcon,
  NoteIcon,
  OpenBookIcon,
  RunIcon,
} from '../components/icons'

const interests: { id: InterestId; label: string; Icon: ComponentType }[] = [
  { id: 'food', label: '맛집', Icon: ForkKnifeIcon },
  { id: 'travel', label: '여행', Icon: FlightIcon },
  { id: 'workout', label: '운동', Icon: RunIcon },
  { id: 'reading', label: '독서', Icon: OpenBookIcon },
  { id: 'cooking', label: '요리', Icon: ChefHatIcon },
  { id: 'music', label: '음악', Icon: NoteIcon },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'interest' | 'profile'>('interest')
  const [interest, setInterest] = useState<InterestId | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')

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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 'interest') {
      if (!interest) {
        setError('관심사를 하나 선택해 주세요.')
        return
      }
      setStep('profile')
      return
    }
    navigate('/')
  }

  return (
    <AuthCard
      className={step === 'interest' ? 'is-interest' : undefined}
      onSubmit={submit}
      footer={<AuthSwitch prompt="이미 계정이 있으신가요?" to="/login" label="로그인" />}
    >
      {step === 'interest' ? (
        <>
          <p className="signup-lead">당신이 가장 좋아하는 것 하나를 알려주세요</p>
          <p className="signup-sub">당신의 관심사가 새로운 인연으로 이어질 거예요.</p>
          <div className="signup-interests">
            {interests.map((item) => (
              <button
                key={item.id}
                type="button"
                className={interest === item.id ? 'signup-interest on' : 'signup-interest'}
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
      ) : (
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
          <button type="submit" className="auth-submit">
            회원가입
          </button>
        </>
      )}
    </AuthCard>
  )
}
