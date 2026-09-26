import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { logout } from '@/api/auth'
import { creatorSubscriberCount, getMemberships, subscribeMemberships } from '@/data/subscriptions'
import WithdrawModal, { type WithdrawKind } from './WithdrawModal'
import { CloseIcon } from '@/components/icons'

export type InterestId =
  | 'food'
  | 'travel'
  | 'workout'
  | 'reading'
  | 'cooking'
  | 'music'
  | 'craft'
  | 'drawing'
  | 'game'
  | 'etc'

const interests: { id: InterestId; label: string }[] = [
  { id: 'food', label: '맛집' },
  { id: 'travel', label: '여행' },
  { id: 'workout', label: '운동' },
  { id: 'reading', label: '독서' },
  { id: 'cooking', label: '요리' },
  { id: 'music', label: '음악' },
  { id: 'craft', label: '공예' },
  { id: 'drawing', label: '그림' },
  { id: 'game', label: '게임' },
  { id: 'etc', label: '기타' },
]

export type ProfileForm = {
  name: string
  bio: string
  avatar: string
  interests: InterestId[]
}

type ProfileEditModalProps = {
  profile: ProfileForm
  onClose: () => void
  onSaveProfile: (next: Pick<ProfileForm, 'name' | 'bio' | 'avatar'>) => void
  onSaveInterests: (interests: InterestId[]) => void
}

export default function ProfileEditModal({
  profile,
  onClose,
  onSaveProfile,
  onSaveInterests,
}: ProfileEditModalProps) {
  const titleId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [selected, setSelected] = useState<InterestId[]>(profile.interests)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const withdrawOpenRef = useRef(false)
  const confirmCancelRef = useRef(false)
  withdrawOpenRef.current = withdrawOpen
  confirmCancelRef.current = confirmCancel
  const navigate = useNavigate()
  const memberships = useSyncExternalStore(subscribeMemberships, getMemberships)
  // 구독자가 있으면 창작자 안내, 없으면 내 유료 구독 여부만 본다
  const withdrawKind: WithdrawKind =
    creatorSubscriberCount > 0 ? 'creator' : memberships.length > 0 ? 'subscriber' : 'general'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !withdrawOpenRef.current && !confirmCancelRef.current) {
        onCloseRef.current()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!confirmCancel) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmCancel(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmCancel])

  function resetProfile() {
    setName(profile.name)
    setBio(profile.bio)
    setAvatar(profile.avatar)
  }

  function changeAvatar(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(String(reader.result))
    reader.readAsDataURL(file)
  }

  function toggleInterest(id: InterestId) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return createPortal(
    <>
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className="profile-edit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="profile-edit-head">
          <h2 id={titleId}>회원 정보 수정</h2>
          <button type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="profile-edit-top">
          <div className="profile-photo">
            <img src={avatar} alt="" />
            <small>50 x 50</small>
            <button type="button" onClick={() => fileRef.current?.click()}>
              변경
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                changeAvatar(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
          <div>
            <label className="profile-row">
              <span>닉네임</span>
              <input value={name} maxLength={20} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="profile-row">
              <span>소개글</span>
              <input value={bio} maxLength={80} onChange={(event) => setBio(event.target.value)} />
            </label>
            <div className="profile-actions">
              <button type="button" className="profile-cancel" onClick={resetProfile}>
                취소
              </button>
              <button
                type="button"
                className="profile-save"
                disabled={name.trim().length === 0}
                onClick={() => onSaveProfile({ name: name.trim(), bio: bio.trim(), avatar })}
              >
                저장
              </button>
            </div>
          </div>
        </div>

        <hr className="profile-edit-line" />

        <h3>무엇을 좋아하시나요?</h3>
        <p className="profile-edit-copy">관심사를 선택하면 나와 비슷한 취향의 새로운 사람들을 만날 수 있어요.</p>
        <div className="interest-grid">
          {interests.map((item) => {
            const on = selected.includes(item.id)
            return (
              <button
                key={item.id}
                type="button"
                className={on ? 'interest-chip on' : 'interest-chip'}
                aria-pressed={on}
                onClick={() => toggleInterest(item.id)}
              >
                {on && <span aria-hidden="true">✓</span>}
                {item.label}
              </button>
            )
          })}
        </div>

        <footer className="profile-edit-foot">
          <button type="button" className="leave-link" onClick={() => setWithdrawOpen(true)}>
            회원 탈퇴
          </button>
          <div className="edit-apply">
            <button type="button" className="interest-cancel" onClick={() => setConfirmCancel(true)}>
              취소
            </button>
            <button
              type="button"
              className="theme-apply interest-apply"
              onClick={() => {
                onSaveInterests(selected)
                onClose()
              }}
            >
              적용
            </button>
          </div>
        </footer>
      </div>
    </div>
      {confirmCancel && (
        <div className="detail-backdrop cancel-layer" onClick={() => setConfirmCancel(false)}>
          <div
            className="cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-ask"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="cancel-ask">
              정말 취소하시겠습니까?
              <br />
              변경사항이 적용되지 않을 수 있습니다
            </p>
            <div className="withdraw-actions">
              <button type="button" onClick={() => setConfirmCancel(false)}>
                돌아가기
              </button>
              <button type="button" onClick={onClose}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      {withdrawOpen && (
        <WithdrawModal
          kind={withdrawKind}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={() => {
            void logout().then(() => navigate('/'))
          }}
        />
      )}
    </>,
    document.body,
  )
}
