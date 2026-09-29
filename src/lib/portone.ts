import * as PortOne from '@portone/browser-sdk/v2'

export type PortOneCheckoutResult =
  | { ok: true; paymentId: string }
  | { ok: false; message: string }

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
    throw new Error('PortOne 상점 정보가 설정되지 않았습니다.')
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
    return { ok: false, message: response.message ?? '결제가 취소되었습니다.' }
  }
  return { ok: true, paymentId: response.paymentId }
}
