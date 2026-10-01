import type { ThemeTone } from '@/components/theme/ThemeShot'

export type AdminMember = {
  id: string
  nickname: string
  email: string
  provider: string
  joinedOn: string
  avatar: string
  /** false면 활동 정지. 글·댓글 작성이 막힌다 */
  active: boolean
}

export type AdminPayment = {
  id: string
  orderNo: string
  memberId: string
  targetId: string
  paymentType: string
  paidOn: string
  expiresOn: string
  payType: string
  paymentId: string
  /** payment.payment_id */
  servicePaymentId: string
  pgProvider: string
  impUid: string
  /** payment.transaction_id */
  merchantUid: string
  amount: string
  payMethod: string
  status: string
  paidAt: string
}

export type AdminSubscription = {
  id: string
  subscriptionId: string
  memberNickname: string
  memberEmail: string
  targetNickname: string
  status: string
  startedOn: string
  endedOn: string
}

/** payment_refund 한 건 */
export type AdminRefund = {
  id: string
  paymentId: string
  cancellationId: string
  refundReason: string
  refundAmount: string
  deductionAmount: string
  requestedOn: string
  refundedOn: string
}

export type AdminPost = {
  id: string
  nickname: string
  email: string
  content: string
  createdAt: string
}

export type ThemeDraft = {
  name: string
  description: string
  price: string
  code: string
  cssText: string
  /** 미리보기 URL (data URL 또는 서버 presigned URL) */
  image: string
  /** 등록 시 S3 업로드할 원본 파일 */
  imageFile?: File | null
}

export type AdminTheme = ThemeDraft & {
  id: string
  tone: ThemeTone
  active: boolean
  /** theme.is_default — 신규 가입 시 적용되는 기본 테마 */
  isDefault?: boolean
}

export const adminPageSize = 6
