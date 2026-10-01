import { apiFetch, apiJson } from '@/lib/apiClient'
import type { AdminPayment } from '@/data/admin'

type AdminPaymentBody = {
  paymentId: number
  memberId: number
  email: string
  paymentType: string
  targetId: number
  transactionId: string
  servicePaymentId: string
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

function toPayment(item: AdminPaymentBody): AdminPayment {
  const paymentId = String(item.paymentId)
  return {
    id: paymentId,
    orderNo: paymentId,
    memberId: String(item.memberId),
    targetId: String(item.targetId),
    paymentType: purchaseLabel(item.paymentType),
    paidOn: formatDay(item.paidAt),
    expiresOn: '—',
    payType: item.paymentMethod,
    paymentId,
    servicePaymentId: item.servicePaymentId,
    pgProvider: '—',
    impUid: '—',
    merchantUid: item.transactionId,
    amount: String(item.amount),
    payMethod: item.paymentMethod,
    status: item.paymentStatus,
    paidAt: formatDateTime(item.paidAt),
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
        servicePaymentId: asString(record.servicePaymentId),
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

/** GET /api/v1/admin/payments/refunds — 환불 완료(PS04)만, 결제 목록과 같은 칸 */
export async function fetchAdminRefunds(): Promise<AdminPayment[]> {
  const raw = await apiJson<unknown>('/admin/payments/refunds')
  return normalizeList(raw)
    .map(toPayment)
    .filter((item) => item.status.includes('환불 완료'))
}

/** PATCH /api/v1/admin/payments/{paymentId}/refund */
export async function refundAdminPayment(paymentId: number): Promise<void> {
  await apiFetch(`/admin/payments/${paymentId}/refund`, { method: 'PATCH' })
}
