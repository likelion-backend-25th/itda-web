import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { myPageCategories, type CategoryId, type FeedImage, type PostCategory } from '../data/feed'
import type { MyPost, PostVisibility } from '../data/mypage'
import { ChevronDownIcon, CloseIcon, GlobeIcon, ImageIcon, UsersIcon } from './icons'

const textLimit = 2000

type EditPostModalProps = {
  post: MyPost
  categories?: { id: CategoryId; label: string }[]
  onClose: () => void
  onSave: (next: {
    title: string
    body?: string
    category: PostCategory
    categoryLabel: string
    images: FeedImage[]
    visibility: PostVisibility
  }) => void
}

export default function EditPostModal({
  post,
  categories = myPageCategories,
  onClose,
  onSave,
}: EditPostModalProps) {
  const categoryOptions = categories.filter(
    (item): item is { id: PostCategory; label: string } => item.id !== 'all',
  )
  const titleId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [text, setText] = useState(post.body ? `${post.title}\n${post.body}` : post.title)
  const [category, setCategory] = useState<PostCategory>(post.category)
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility ?? 'public')
  const [images, setImages] = useState<FeedImage[]>(post.images)
  const [categoryOpen, setCategoryOpen] = useState(false)
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

  function save() {
    const trimmed = text.trim()
    if (!trimmed || !selectedCategory) return
    const [title, ...rest] = trimmed.split('\n')
    const body = rest.join('\n').trim()
    onSave({
      title,
      body: body || undefined,
      category: selectedCategory.id,
      categoryLabel: selectedCategory.label,
      images,
      visibility,
    })
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
                className="editor-select"
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
          <img className="editor-avatar" src={post.avatar} alt="" />
          <div className="editor-box">
            <label className="sr-only" id={titleId} htmlFor="edit-post-text">
              게시글 내용
            </label>
            <textarea
              id="edit-post-text"
              value={text}
              maxLength={textLimit}
              rows={2}
              onChange={(event) => setText(event.target.value)}
            />
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
          <button type="button" className="editor-save" disabled={text.trim().length === 0} onClick={save}>
            수정
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
