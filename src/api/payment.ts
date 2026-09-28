import { apiJson } from '@/lib/apiClient'
import type {
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
