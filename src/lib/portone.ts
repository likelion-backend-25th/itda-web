import * as PortOne from '@portone/browser-sdk/v2'

export type PortOneCheckoutResult =
  | { ok: true; paymentId: string }
  | { ok: false; message: string }

function readPortOneConfig(): { storeId: string; channelKey: string } {
  const storeId = import.meta.env.VITE_PORTONE_STORE_ID
  const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY
  if (!storeId || !channelKey) {
    throw new Error('PortOne 상점 정보가 설정되지 않았습니다.')
  }
  return { storeId, channelKey }
}

/**
 * 백엔드가 준 paymentId로 PortOne V2 결제창을 연다.
 * 창이 성공해도 구매 확정은 아니고, 이어서 POST /payments/complete 가 필요하다.
 */
export async function openPortOneCheckout(input: {
  paymentId: string
  amount: number
  orderName: string
}): Promise<PortOneCheckoutResult> {
  const { storeId, channelKey } = readPortOneConfig()

  const response = await PortOne.requestPayment({
    storeId,
    channelKey,
    paymentId: input.paymentId,
    orderName: input.orderName,
    totalAmount: input.amount,
    currency: 'KRW',
    payMethod: 'EASY_PAY',
    easyPay: {
      easyPayProvider: 'KAKAOPAY',
    },
  })

  if (!response) {
    return { ok: false, message: '결제창이 닫혔습니다.' }
  }
  if (response.code !== undefined) {
    return { ok: false, message: response.message ?? '결제가 취소되었습니다.' }
  }
  return { ok: true, paymentId: response.paymentId }
}
