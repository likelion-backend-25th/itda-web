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

/** 백엔드 PaymentCompleteRequest */
export interface PaymentCompleteRequest {
  paymentId: string
}

/** 백엔드 PaymentCompleteResponse. completePayment() 검증 결과 */
export interface PaymentCompleteResponse {
  paymentId: string
  status: string
  amount: number
  transactionId: string
}
