import { apiFetch, apiJson } from '@/lib/apiClient'
import { resolveMemberImageUrl } from '@/api/member'
import { resolveThemeThumbnailUrl } from '@/api/theme'
import { toneFromThemeCode } from '@/components/theme/ThemeShot'
import type { AdminMember, AdminPost, AdminTheme, ThemeDraft } from '@/data/admin'

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function formatDateTime(value: string): string {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

function formatYear(value: string): string {
  if (value.length >= 4) return `${value.slice(0, 4)}년`
  return value
}

/** GET /api/v1/admin/members */
export async function fetchAdminMembers(): Promise<AdminMember[]> {
  const raw = await apiJson<unknown>('/admin/members')
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const record = item as Record<string, unknown>
    const id = asNumber(record.id)
    if (id == null) return []
    const createdAt = asString(record.createdAt)
    return [
      {
        id: String(id),
        nickname: asString(record.nickname),
        email: asString(record.email),
        provider: asString(record.authmethod) || asString(record.role) || '—',
        year: formatYear(createdAt),
        avatar: resolveMemberImageUrl(asString(record.profileImage) || null),
      },
    ]
  })
}

/** PATCH /api/v1/admin/members/{memberId}/status?status=SUSPENDED */
export async function suspendAdminMember(memberId: number): Promise<void> {
  await apiFetch(`/admin/members/${memberId}/status?status=SUSPENDED`, { method: 'PATCH' })
}

/** GET /api/v1/admin/posts */
export async function fetchAdminPosts(): Promise<AdminPost[]> {
  const raw = await apiJson<unknown>('/admin/posts')
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const record = item as Record<string, unknown>
    const id = asNumber(record.id)
    if (id == null) return []
    return [
      {
        id: String(id),
        nickname: asString(record.nickname),
        email: asString(record.email),
        content: asString(record.content),
        createdAt: formatDateTime(asString(record.createdAt)),
      },
    ]
  })
}

/** DELETE /api/v1/admin/posts/{postId} */
export async function deleteAdminPost(postId: number): Promise<void> {
  await apiFetch(`/admin/posts/${postId}`, { method: 'DELETE' })
}

/** GET /api/v1/admin/replies — 게시글/댓글 관리 화면에 합쳐 표시 */
export async function fetchAdminReplies(): Promise<AdminPost[]> {
  const raw = await apiJson<unknown>('/admin/replies')
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const record = item as Record<string, unknown>
    const id = asNumber(record.id)
    if (id == null) return []
    return [
      {
        id: `reply-${id}`,
        nickname: asString(record.nickname),
        email: asString(record.email),
        content: `[댓글] ${asString(record.content)}`,
        createdAt: formatDateTime(asString(record.createdAt)),
      },
    ]
  })
}

/** DELETE /api/v1/admin/replies/{replyId} */
export async function deleteAdminReply(replyId: number): Promise<void> {
  await apiFetch(`/admin/replies/${replyId}`, { method: 'DELETE' })
}

function parsePrice(price: string): number {
  const digits = price.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR')
}

function toAdminTheme(record: Record<string, unknown>): AdminTheme | null {
  const id = asNumber(record.id)
  if (id == null) return null
  const themeCode = asString(record.themeCode)
  const status = asString(record.status)
  const price = asNumber(record.price) ?? 0
  return {
    id: String(id),
    name: asString(record.themeName),
    description: asString(record.description),
    price: formatPrice(price),
    code: themeCode,
    image: resolveThemeThumbnailUrl(asString(record.thumbnailUrl) || null) ?? '',
    tone: toneFromThemeCode(themeCode),
    active: status === 'ON_SALE' || status === 'ACTIVE' || status === '',
  }
}

/** GET /api/v1/admin/themes */
export async function fetchAdminThemes(): Promise<AdminTheme[]> {
  const raw = await apiJson<unknown>('/admin/themes')
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const mapped = toAdminTheme(item as Record<string, unknown>)
    return mapped ? [mapped] : []
  })
}

function toThemeRequest(draft: ThemeDraft) {
  return {
    themeName: draft.name.trim(),
    description: draft.description.trim(),
    price: parsePrice(draft.price),
    thumbnailUrl: draft.image.trim() || null,
    themeCode: draft.code.trim(),
  }
}

/** POST /api/v1/admin/themes */
export async function createAdminTheme(draft: ThemeDraft): Promise<void> {
  await apiFetch('/admin/themes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toThemeRequest(draft)),
  })
}

/** PUT /api/v1/admin/themes/{themeId} */
export async function updateAdminTheme(themeId: number, draft: ThemeDraft): Promise<void> {
  await apiFetch(`/admin/themes/${themeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toThemeRequest(draft)),
  })
}

/** PATCH /api/v1/admin/themes/{themeId}/status */
export async function setAdminThemeStatus(themeId: number, active: boolean): Promise<void> {
  const status = active ? 'ON_SALE' : 'HIDDEN'
  await apiFetch(`/admin/themes/${themeId}/status?status=${status}`, { method: 'PATCH' })
}
