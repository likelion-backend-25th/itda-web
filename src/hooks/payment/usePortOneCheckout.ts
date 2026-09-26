import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { preparePayment } from '@/api/payment'
import { getLoggedIn } from '@/data/session'
import { openPortOneCheckout } from '@/lib/portone'
import type { PaymentType } from '@/types/payment'

interface StartCheckoutInput {
  paymentType: PaymentType
  targetId: number
  orderName: string
}

export type CheckoutReceipt = {
  paymentId: string
  orderName: string
  amount: number
}

export function usePortOneCheckout() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<CheckoutReceipt | null>(null)

  const reset = useCallback(() => {
    setError('')
    setReceipt(null)
  }, [])

  const startCheckout = useCallback(
    async (input: StartCheckoutInput) => {
      if (!getLoggedIn()) {
        navigate('/login')
        return null
      }

      setBusy(true)
      setError('')
      try {
        const prepared = await preparePayment({
          paymentType: input.paymentType,
          targetId: input.targetId,
        })
        const result = await openPortOneCheckout({
          paymentId: prepared.paymentId,
          amount: prepared.amount,
          orderName: input.orderName,
        })
        if (!result.ok) {
          setError(result.message)
          return null
        }
        setReceipt({
          paymentId: result.paymentId,
          orderName: input.orderName,
          amount: prepared.amount,
        })
        return result
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : '결제를 시작하지 못했습니다.'
        setError(message)
        return null
      } finally {
        setBusy(false)
      }
    },
    [navigate],
  )

  return { startCheckout, busy, error, receipt, reset }
}
