import { apiJson } from '@/lib/apiClient'
import type { AdminSubscription } from '@/data/admin'

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

function formatDay(value: string): string {
  if (!value) return '—'
  return value.length >= 10 ? value.slice(0, 10) : value
}

function statusLabel(status: string): string {
  if (status === 'ACTIVE') return '구독 중'
  if (status === 'CANCELLED') return '해지'
  return status || '—'
}

function toSubscription(item: Record<string, unknown>): AdminSubscription | null {
  const subscriptionId = asNumber(item.subscriptionId)
  if (subscriptionId == null) return null
  return {
    id: String(subscriptionId),
    subscriptionId: String(subscriptionId),
    memberNickname: asString(item.memberNickname) || '—',
    memberEmail: asString(item.memberEmail) || '—',
    targetNickname: asString(item.targetNickname) || '—',
    status: statusLabel(asString(item.subscriptionStatus)),
    startedOn: formatDay(asString(item.startedAt)),
    endedOn: formatDay(asString(item.endedAt) || asString(item.nextBillingAt)),
  }
}

/** GET /api/v1/admin/subscriptions */
export async function fetchAdminSubscriptions(): Promise<AdminSubscription[]> {
  const raw = await apiJson<unknown>('/admin/subscriptions')
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const row = toSubscription(item as Record<string, unknown>)
    return row ? [row] : []
  })
}
