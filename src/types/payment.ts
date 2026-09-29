/** 백엔드 PaymentPrepareRequest.paymentType 과 동일 */
export type PaymentType = 'THEME' | 'SUBSCRIPTION'

/** 백엔드 PaymentPrepareRequest.payMethod. PortOne 채널을 고르는 값 */
export type PayMethod = 'KAKAOPAY' | 'TOSSPAY'

export interface PaymentPrepareRequest {
  paymentType: PaymentType
  targetId: number
  payMethod: PayMethod
}

export interface PaymentPrepareResponse {
  paymentId: string
  amount: number
  storeId: string
  channelKey: string
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
