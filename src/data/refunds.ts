export type RefundPurchase = {
  id: string
  orderNo: string
  themeName: string
  kind: string
  purchasedAt: string
}

export const refundPurchases: RefundPurchase[] = [
  { id: 'pay-1', orderNo: '20260901-1042', themeName: '기본 라이트', kind: '테마', purchasedAt: '2026.09.01' },
  { id: 'pay-2', orderNo: '20260908-2210', themeName: '오션 블루', kind: '테마', purchasedAt: '2026.09.08' },
  { id: 'pay-3', orderNo: '20260912-3301', themeName: '선셋 코랄', kind: '테마', purchasedAt: '2026.09.12' },
  { id: 'pay-4', orderNo: '20260918-4418', themeName: '포레스트 그린', kind: '테마', purchasedAt: '2026.09.18' },
  { id: 'pay-5', orderNo: '20260920-5520', themeName: '라벤더 나이트', kind: '테마', purchasedAt: '2026.09.20' },
]
