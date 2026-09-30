import { apiJson } from '@/lib/apiClient'
import type {
  MyPaymentResponse,
  PaymentCompleteRequest,
  PaymentCompleteResponse,
  PaymentPrepareRequest,
  PaymentPrepareResponse,
  PaymentRefundResponse,
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

/** 목록의 paymentId는 payment.payment_id 문자열이다 */
function portonePaymentId(value: unknown): string {
  if (typeof value !== 'string') return ''
  const paymentId = value.trim()
  if (paymentId === '' || /^\d+$/.test(paymentId)) return ''
  return paymentId
}

function toMyPayment(item: unknown): MyPaymentResponse | null {
  if (typeof item !== 'object' || item === null) return null
  const record = item as Record<string, unknown>
  const id = asNumber(record.id)
  const amount = asNumber(record.amount)
  const targetId = asNumber(record.targetId)
  if (id == null || amount == null || targetId == null) return null
  return {
    id,
    paymentId: portonePaymentId(record.paymentId),
    paymentType: typeof record.paymentType === 'string' ? record.paymentType : '',
    targetId,
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

/** POST /api/v1/payments/refund/{paymentId}. paymentId는 payment.payment_id. PortOne 취소는 서버가 보낸다 */
export function requestPaymentRefund(
  paymentId: string,
  reason = '사용자 요청',
): Promise<PaymentRefundResponse> {
  if (paymentId.trim() === '' || /^\d+$/.test(paymentId.trim())) {
    throw new Error('환불은 payment_id로 요청해야 합니다.')
  }
  return apiJson<PaymentRefundResponse>(`/payments/refund/${encodeURIComponent(paymentId.trim())}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

/** 구독 해제 전, 해당 창작자 구독 결제를 payment_id로 환불한다 */
export async function refundSubscriptionByTarget(targetId: number): Promise<PaymentRefundResponse> {
  const payments = await fetchMyPayments()
  const payment = payments.find(
    (item) =>
      item.paymentType === 'SUBSCRIPTION' &&
      item.targetId === targetId &&
      item.refundAvailable &&
      item.paymentId !== '',
  )
  if (!payment) {
    throw new Error('환불할 구독 결제의 payment_id를 찾지 못했습니다.')
  }
  return requestPaymentRefund(payment.paymentId, '구독 해제')
}

/** 구독 해지는 결제 환불로만 한다. 환불이 구독 행까지 지운다. */
export async function unsubscribeAndRefund(targetId: number): Promise<void> {
  await refundSubscriptionByTarget(targetId)
}
