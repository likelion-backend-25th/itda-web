import * as PortOne from '@portone/browser-sdk/v2'

export type PortOneCheckoutResult =
  | { ok: true; paymentId: string }
  | { ok: false; message: string }

/** SDK/벤더 영어 메시지를 사용자용 한국어로 바꾼다 */
function toUserPaymentMessage(raw: string | undefined): string {
  const fallback = '결제가 취소되었습니다.'
  if (!raw || raw.trim() === '') return fallback
  const text = raw.trim()

  if (/failed to fetch|networkerror|load failed/i.test(text)) {
    return '결제 서버에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.'
  }
  if (/cancel|user.?cancel|closed|abort/i.test(text)) {
    return '결제가 취소되었습니다.'
  }
  if (/timeout|timed?\s*out/i.test(text)) {
    return '결제 시간이 초과되었습니다. 다시 시도해 주세요.'
  }
  if (/invalid|unauthorized|forbidden|not\s*allowed/i.test(text)) {
    return '결제 요청이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (/store|channel|merchant|shop/i.test(text)) {
    return '결제 설정이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.'
  }
  // 이미 한국어면 그대로, 그 외 짧은 영문은 폴백
  if (/[가-힣]/.test(text)) return text
  return fallback
}

/**
 * prepare 응답의 storeId, channelKey로 PortOne V2 결제창을 연다.
 * 창이 성공해도 구매 확정은 아니고, 이어서 POST /payments/complete 가 필요하다.
 */
export async function openPortOneCheckout(prepare: {
  paymentId: string
  amount: number
  storeId: string
  channelKey: string
  orderName: string
}): Promise<PortOneCheckoutResult> {
  const storeId = prepare.storeId
  const channelKey = prepare.channelKey
  if (!storeId || !channelKey) {
    throw new Error('결제 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.')
  }

  const response = await PortOne.requestPayment({
    storeId,
    channelKey,
    paymentId: prepare.paymentId,
    orderName: prepare.orderName,
    totalAmount: prepare.amount,
    currency: 'KRW',
    payMethod: 'EASY_PAY',
  })

  if (!response) {
    return { ok: false, message: '결제창이 닫혔습니다.' }
  }
  if (response.code !== undefined) {
    return { ok: false, message: toUserPaymentMessage(response.message) }
  }
  return { ok: true, paymentId: response.paymentId }
}
