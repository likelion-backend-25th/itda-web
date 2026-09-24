import { apiJson } from '@/lib/apiClient'
import type { PaymentPrepareRequest, PaymentPrepareResponse } from '@/types/payment'

/** 결제 대기 건을 만들고 PortOne용 paymentId를 받는다 */
export function preparePayment(request: PaymentPrepareRequest): Promise<PaymentPrepareResponse> {
  return apiJson<PaymentPrepareResponse>('/payments/prepare', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
