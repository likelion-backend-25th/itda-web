import { apiFetch, apiJson } from '@/lib/apiClient'
import type {
  MonthlyIncomeResponse,
  MySubscriptionResponse,
  SubscriberCountResponse,
  SubscriptionStatusResponse,
} from '@/types/subscription'

function isSubscriptionStatus(body: unknown): body is SubscriptionStatusResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'subscribed' in body &&
    typeof body.subscribed === 'boolean'
  )
}

/** 로그인한 회원이 targetId 회원을 구독 중인지 */
export async function fetchSubscriptionStatus(targetId: number): Promise<SubscriptionStatusResponse> {
  const raw = await apiJson<unknown>(`/subscriptions/${targetId}`)
  if (!isSubscriptionStatus(raw)) {
    throw new Error('구독 상태를 확인하지 못했습니다.')
  }
  return raw
}

function isSubscriberCount(body: unknown): body is SubscriberCountResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'subscriberCount' in body &&
    typeof body.subscriberCount === 'number' &&
    Number.isFinite(body.subscriberCount)
  )
}

function isMonthlyIncome(body: unknown): body is MonthlyIncomeResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'monthlyIncome' in body &&
    typeof body.monthlyIncome === 'number' &&
    Number.isFinite(body.monthlyIncome)
  )
}

/** 해당 회원의 이번 달 정산 금액 */
export async function fetchMonthlyIncome(targetId: number): Promise<MonthlyIncomeResponse> {
  const raw = await apiJson<unknown>(`/subscriptions/${targetId}/income`)
  if (!isMonthlyIncome(raw)) {
    throw new Error('정산 금액을 확인하지 못했습니다.')
  }
  return raw
}

/** 해당 회원을 구독 중인 사람 수 */
export async function fetchSubscriberCount(targetId: number): Promise<SubscriberCountResponse> {
  const raw = await apiJson<unknown>(`/subscriptions/${targetId}/count`)
  if (!isSubscriberCount(raw)) {
    throw new Error('구독자 수를 확인하지 못했습니다.')
  }
  return raw
}

function isMySubscription(item: unknown): item is MySubscriptionResponse {
  if (typeof item !== 'object' || item === null) return false
  const record = item as Record<string, unknown>
  return (
    typeof record.subscriptionId === 'number' &&
    typeof record.targetId === 'number' &&
    typeof record.nickname === 'string' &&
    (typeof record.profileImage === 'string' || record.profileImage === null) &&
    typeof record.priceId === 'number' &&
    typeof record.nextBillingAt === 'string' &&
    typeof record.remainingDays === 'number'
  )
}

/** 로그인한 회원이 구독 중인 사용자 목록 */
export async function fetchMySubscriptions(): Promise<MySubscriptionResponse[]> {
  const raw = await apiJson<unknown>('/subscriptions/me')
  if (!Array.isArray(raw)) return []
  return raw.filter(isMySubscription)
}

/** PATCH /api/v1/subscriptions/{targetId}/cancel — 본문 없는 200 */
export async function cancelSubscription(targetId: number): Promise<void> {
  await apiFetch(`/subscriptions/${targetId}/cancel`, { method: 'PATCH' })
}
