/** 백엔드 PaymentPrepareRequest.paymentType 과 동일 */
export type PaymentType = 'THEME' | 'SUBSCRIPTION'

export interface PaymentPrepareRequest {
  paymentType: PaymentType
  targetId: number
}

export interface PaymentPrepareResponse {
  paymentId: string
  amount: number
}
