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

/** POST /api/v1/payments/refund/{paymentId} */
export interface PaymentRefundRequest {
  reason: string
}

/** 환불 처리 결과 */
export interface PaymentRefundResponse {
  paymentId: string
  cancellationId: string
  refundAmount: number
  deductionAmount: number
}

/** GET /api/v1/customer/payments 한 건. paymentId는 payment.payment_id (ITDA-…) */
export interface MyPaymentResponse {
  id: number
  /** payment.payment_id. ITDA-… 가 없으면 빈 문자열 */
  paymentId: string
  paymentType: string
  targetId: number
  amount: number
  createdAt: string
  paymentStatus: string
  refundAvailable: boolean
}
