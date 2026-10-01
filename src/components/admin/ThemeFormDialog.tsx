import { useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { CloseIcon, ImageIcon } from '@/components/icons'
import type { ThemeDraft } from '@/data/admin'

type ThemeFormDialogProps = {
  mode: 'edit' | 'add'
  value: ThemeDraft
  onChange: (next: ThemeDraft) => void
  onClose: () => void
  onSubmit: () => void
  error?: string | null
}

export function ThemeFormDialog({ mode, value, onChange, onClose, onSubmit, error }: ThemeFormDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function openPicker() {
    fileRef.current?.click()
  }

  function pickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    // 미리보기는 data URL, 등록 시에는 imageFile 을 multipart 로 보낸다.
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ ...value, image: reader.result, imageFile: file })
      }
    }
    reader.readAsDataURL(file)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (value.name.trim().length === 0) return
    if (mode === 'add' && value.code.trim().length === 0) return
    if (value.cssText.trim().length === 0) return
    onSubmit()
  }

  function setField(key: Exclude<keyof ThemeDraft, 'imageFile'>, next: string) {
    onChange({ ...value, [key]: next })
  }

  const canSubmit =
    value.name.trim().length > 0 &&
    value.cssText.trim().length > 0 &&
    (mode === 'edit' || value.code.trim().length > 0)

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <form className="theme-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <h2>{mode === 'edit' ? '테마 상세 수정' : '테마 상세 등록'}</h2>
        <button type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="theme-form-top">
          <div>
            <div className="theme-preview" aria-hidden="true">
              <aside>
                <strong>Social</strong>
                <span>홈</span>
                <span>탐색하기</span>
                <span>알림</span>
                <span>메시지</span>
                <span>북마크</span>
                <span>더보기</span>
              </aside>
              <div
                className={value.image ? 'theme-preview-main has-image' : 'theme-preview-main'}
                style={value.image ? { backgroundImage: `url("${value.image}")` } : undefined}
              >
                <div className="theme-preview-search">
                  <span>무슨 생각을 하고 계신가요?</span>
                  <em>게시하기</em>
                </div>
                <div className="theme-preview-card">
                  <i />
                  <b />
                  <b />
                </div>
                <div className="theme-preview-recommend">
                  <span>추천 콘텐츠</span>
                  <b />
                  <b />
                  <b />
                </div>
              </div>
            </div>
            <button type="button" className="theme-form-pick" aria-label="테마 이미지 선택" onClick={openPicker}>
              <ImageIcon />
            </button>
          </div>
          <button type="button" className="theme-photo" onClick={openPicker}>
            {value.image ? <img src={value.image} alt="" /> : <ImageIcon />}
            <span>사진</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
        <div className="theme-form-fields">
          <label>
            테마 이름
            <input value={value.name} onChange={(event) => setField('name', event.target.value)} />
          </label>
          <label>
            테마 설명
            <input value={value.description} onChange={(event) => setField('description', event.target.value)} />
          </label>
          <label>
            테마 가격
            <input value={value.price} onChange={(event) => setField('price', event.target.value)} />
          </label>
          <label>
            테마 코드
            <input
              value={value.code}
              placeholder="예: SPRING"
              readOnly={mode === 'edit'}
              aria-describedby="theme-code-hint"
              onChange={(event) => setField('code', event.target.value)}
            />
          </label>
          <p id="theme-code-hint" className="theme-form-hint">
            css_text의 data-theme 과 같아야 합니다. (SPRING → data-theme=&apos;spring&apos;)
            {mode === 'edit' ? ' 수정 시 코드는 변경할 수 없습니다.' : ''}
          </p>
          <label>
            css_text
            <textarea
              value={value.cssText}
              placeholder={":root[data-theme='spring']{ --bg:#ffe8f0; ... }"}
              onChange={(event) => setField('cssText', event.target.value)}
            />
          </label>
        </div>
        {error && (
          <p className="theme-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="theme-form-submit">
          <button type="submit" disabled={!canSubmit}>
            {mode === 'edit' ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
