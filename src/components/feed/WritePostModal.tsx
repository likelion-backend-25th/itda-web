import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CategoryId, FeedImage, FeedUser, PostCategory } from '@/data/feed'
import type { PostVisibility } from '@/data/mypage'
import { ChevronDownIcon, CloseIcon, GlobeIcon, ImageIcon, UsersIcon } from '@/components/icons'

const textLimit = 2000

export type PostDraft = {
  title: string
  body?: string
  content: string
  category: PostCategory
  categoryLabel: string
  images: FeedImage[]
  visibility: PostVisibility
}

type WritePostModalProps = {
  user: FeedUser
  categories: { id: CategoryId; label: string }[]
  onClose: () => void
  onPublish: (draft: PostDraft) => void | Promise<void>
}

export default function WritePostModal({ user, categories, onClose, onPublish }: WritePostModalProps) {
  const titleId = useId()
  const fieldId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [text, setText] = useState('')
  const [category, setCategory] = useState<PostCategory | null>(null)
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [images, setImages] = useState<FeedImage[]>([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const categoryOptions = categories.filter(
    (item): item is { id: PostCategory; label: string } => item.id !== 'all',
  )
  const selectedCategory = categoryOptions.find((item) => item.id === category)

  useEffect(() => {
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

  function addImages(fileList: FileList | null) {
    if (!fileList) return
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setImages((current) => [...current, { src: String(reader.result), alt: file.name }])
      }
      reader.readAsDataURL(file)
    })
  }

  async function publish() {
    const trimmed = text.trim()
    const fallback = categoryOptions.find((item) => item.id === 'etc')
    const chosen = selectedCategory ?? fallback
    if (!trimmed || !chosen || saving) return
    const [title, ...rest] = trimmed.split('\n')
    const body = rest.join('\n').trim()
    setSaving(true)
    setSaveError('')
    try {
      await onPublish({
        title,
        body: body || undefined,
        content: trimmed,
        category: chosen.id,
        categoryLabel: chosen.label,
        images,
        visibility,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '글을 등록하지 못했습니다.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className="editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="editor-top">
          <div className="editor-tools">
            <div className="category-picker">
              <button
                type="button"
                className={selectedCategory ? 'editor-select' : 'editor-select is-placeholder'}
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen((open) => !open)}
              >
                <span>{selectedCategory?.label ?? '카테고리'}</span>
                <ChevronDownIcon />
              </button>
              {categoryOpen && (
                <div className="category-menu" role="listbox" aria-label="카테고리">
                  {categoryOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={item.id === category}
                      className={item.id === category ? 'active' : undefined}
                      onClick={() => {
                        setCategory(item.id)
                        setCategoryOpen(false)
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className={visibility === 'public' ? 'visibility-btn on' : 'visibility-btn'}
              aria-pressed={visibility === 'public'}
              onClick={() => setVisibility('public')}
            >
              <GlobeIcon />
              전체 공개
            </button>
            <button
              type="button"
              className={visibility === 'subscribers' ? 'visibility-btn on' : 'visibility-btn'}
              aria-pressed={visibility === 'subscribers'}
              onClick={() => setVisibility('subscribers')}
            >
              <UsersIcon />
              구독자 전용
            </button>
          </div>
          <button type="button" className="detail-close" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="editor-body">
          <img className="editor-avatar" src={user.avatar} alt="" />
          <div className="editor-box compose">
            <h2 className="sr-only" id={titleId}>
              글 작성
            </h2>
            <div className="editor-field">
              {text.length === 0 && (
                <div className="editor-placeholder" aria-hidden="true">
                  <strong>새로운 소식이 있나요?</strong>
                  <span>글 쓰는 곳</span>
                </div>
              )}
              <label className="sr-only" htmlFor={fieldId}>
                게시글 내용
              </label>
              <textarea
                id={fieldId}
                value={text}
                maxLength={textLimit}
                rows={3}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
            {images.length > 0 && (
              <div className="editor-photos">
                {images.map((image) => (
                  <img key={image.src} src={image.src} alt={image.alt} />
                ))}
              </div>
            )}
            <p className="editor-count">
              {text.length.toLocaleString('ko-KR')} / {textLimit.toLocaleString('ko-KR')}
            </p>
          </div>
        </div>

        {saveError && (
          <p className="editor-error" role="alert">
            {saveError}
          </p>
        )}
        <footer className="editor-footer">
          <button type="button" className="add-image" onClick={() => fileRef.current?.click()}>
            <ImageIcon />
            이미지 추가하기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              addImages(event.target.files)
              event.target.value = ''
            }}
          />
          <button
            type="button"
            className="editor-save"
            disabled={saving || text.trim().length === 0}
            onClick={() => void publish()}
          >
            {saving ? '게시 중...' : '게시'}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
