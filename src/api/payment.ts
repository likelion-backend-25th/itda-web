import { apiFetch, apiJson } from '@/lib/apiClient'
import type {
  MyPaymentResponse,
  PaymentCompleteRequest,
  PaymentCompleteResponse,
  PaymentPrepareRequest,
  PaymentPrepareResponse,
} from '@/types/payment'

/** 결제 대기 건을 만들고 PortOne용 paymentId를 받는다 */
export function preparePayment(request: PaymentPrepareRequest): Promise<PaymentPrepareResponse> {
  return apiJson<PaymentPrepareResponse>('/payments/prepare', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/** PortOne 결제창 성공 뒤 서버 검증. 이 호출이 있어야 백엔드 completePayment()가 실행된다 */
export function completePayment(request: PaymentCompleteRequest): Promise<PaymentCompleteResponse> {
  return apiJson<PaymentCompleteResponse>('/payments/complete', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function createdOn(value: unknown): string {
  if (typeof value === 'string') return value.length >= 10 ? value.slice(0, 10) : value
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value
    if (typeof year === 'number' && typeof month === 'number' && typeof day === 'number') {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return ''
}

function toMyPayment(item: unknown): MyPaymentResponse | null {
  if (typeof item !== 'object' || item === null) return null
  const record = item as Record<string, unknown>
  const paymentId = asNumber(record.paymentId)
  const amount = asNumber(record.amount)
  if (paymentId == null || amount == null) return null
  return {
    paymentId,
    paymentType: typeof record.paymentType === 'string' ? record.paymentType : '',
    amount,
    createdAt: createdOn(record.createdAt),
    paymentStatus: typeof record.paymentStatus === 'string' ? record.paymentStatus : '',
    refundAvailable: record.refundAvailable === true,
  }
}

/** 로그인한 회원의 결제 목록 */
export async function fetchMyPayments(): Promise<MyPaymentResponse[]> {
  const raw = await apiJson<unknown>('/customer/payments')
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const row = toMyPayment(item)
    return row ? [row] : []
  })
}

/** POST /api/v1/customer/payments/{paymentId}/refund — 본문 없는 200 */
export async function requestPaymentRefund(paymentId: number): Promise<void> {
  await apiFetch(`/customer/payments/${paymentId}/refund`, { method: 'POST' })
}
