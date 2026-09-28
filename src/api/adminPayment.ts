import { apiFetch, apiJson } from '@/lib/apiClient'
import type { AdminPayment, AdminRefund } from '@/data/admin'

type AdminPaymentBody = {
  paymentId: number
  memberId: number
  email: string
  paymentType: string
  targetId: number
  transactionId: string
  amount: number
  paymentStatus: string
  paymentMethod: string
  paidAt: string
}

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

function isPaymentBody(item: unknown): item is AdminPaymentBody {
  if (typeof item !== 'object' || item === null) return false
  const record = item as Record<string, unknown>
  return asNumber(record.paymentId) != null
}

function formatDay(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value
}

function formatDateTime(value: string): string {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

function purchaseLabel(paymentType: string): string {
  if (paymentType === 'THEME') return '테마'
  if (paymentType === 'SUBSCRIPTION') return '구독'
  return paymentType
}

function isRefunded(status: string): boolean {
  return status.includes('환불')
}

function toPayment(item: AdminPaymentBody): AdminPayment {
  const paymentId = String(item.paymentId)
  return {
    id: paymentId,
    orderNo: paymentId,
    memberId: String(item.memberId),
    targetId: String(item.targetId),
    paidOn: formatDay(item.paidAt),
    expiresOn: '—',
    payType: item.paymentMethod,
    paymentId,
    pgProvider: '—',
    impUid: '—',
    merchantUid: item.transactionId,
    amount: String(item.amount),
    payMethod: item.paymentMethod,
    status: item.paymentStatus,
    paidAt: formatDateTime(item.paidAt),
  }
}

function toRefund(item: AdminPaymentBody): AdminRefund {
  return {
    id: String(item.paymentId),
    orderNo: String(item.paymentId),
    email: item.email,
    purchaseType: purchaseLabel(item.paymentType),
    payType: item.paymentMethod,
    purchasedOn: formatDay(item.paidAt),
    refunded: isRefunded(item.paymentStatus),
  }
}

function normalizeList(raw: unknown): AdminPaymentBody[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!isPaymentBody(item)) return []
    const record = item as Record<string, unknown>
    const paymentId = asNumber(record.paymentId)
    const memberId = asNumber(record.memberId)
    const targetId = asNumber(record.targetId)
    const amount = asNumber(record.amount)
    if (paymentId == null || memberId == null || targetId == null || amount == null) return []
    return [
      {
        paymentId,
        memberId,
        email: asString(record.email),
        paymentType: asString(record.paymentType),
        targetId,
        transactionId: asString(record.transactionId),
        amount,
        paymentStatus: asString(record.paymentStatus),
        paymentMethod: asString(record.paymentMethod),
        paidAt: asString(record.paidAt),
      },
    ]
  })
}

/** GET /api/v1/admin/payments — 목록·상세에 이미 있는 칸만 채운다 */
export async function fetchAdminPayments(): Promise<AdminPayment[]> {
  const raw = await apiJson<unknown>('/admin/payments')
  return normalizeList(raw).map(toPayment)
}

/** GET /api/v1/admin/payments/refunds */
export async function fetchAdminRefunds(): Promise<AdminRefund[]> {
  const raw = await apiJson<unknown>('/admin/payments/refunds')
  return normalizeList(raw).map(toRefund)
}

/** PATCH /api/v1/admin/payments/{paymentId}/refund */
export async function refundAdminPayment(paymentId: number): Promise<void> {
  await apiFetch(`/admin/payments/${paymentId}/refund`, { method: 'PATCH' })
}
