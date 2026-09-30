import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { completePayment, preparePayment } from '@/api/payment'
import { getLoggedIn } from '@/data/session'
import { openPortOneCheckout } from '@/lib/portone'
import type { PayMethod, PaymentPrepareResponse, PaymentType } from '@/types/payment'

interface StartCheckoutInput {
  paymentType: PaymentType
  targetId: number
  orderName: string
  payMethod: PayMethod
}

export type CheckoutReceipt = {
  paymentId: string
  orderName: string
  amount: number
}

export type CheckoutPhase = 'idle' | 'window' | 'confirm'

export function usePortOneCheckout() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<CheckoutPhase>('idle')
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<CheckoutReceipt | null>(null)

  const reset = useCallback(() => {
    setError('')
    setReceipt(null)
  }, [])

  const payPrepared = useCallback(
    async (prepared: PaymentPrepareResponse, orderName: string) => {
      if (!getLoggedIn()) {
        navigate('/login')
        return null
      }

      setBusy(true)
      setPhase('window')
      setError('')
      try {
        const result = await openPortOneCheckout({
          paymentId: prepared.paymentId,
          amount: prepared.amount,
          storeId: prepared.storeId,
          channelKey: prepared.channelKey,
          orderName,
        })
        if (!result.ok) {
          setError(result.message)
          return null
        }
        // 결제창 성공만으로는 서버에 기록되지 않는다. complete 가 completePayment()를 실행한다
        setPhase('confirm')
        const completed = await completePayment({ paymentId: result.paymentId })
        setReceipt({
          paymentId: completed.paymentId || result.paymentId,
          orderName,
          amount: typeof completed.amount === 'number' ? completed.amount : prepared.amount,
        })
        return result
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : '결제를 시작하지 못했습니다.'
        setError(message)
        return null
      } finally {
        setBusy(false)
        setPhase('idle')
      }
    },
    [navigate],
  )

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
          payMethod: input.payMethod,
        })
        setBusy(false)
        return payPrepared(prepared, input.orderName)
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : '결제를 시작하지 못했습니다.'
        setError(message)
        setBusy(false)
        setPhase('idle')
        return null
      }
    },
    [navigate, payPrepared],
  )

  return { startCheckout, payPrepared, busy, phase, error, receipt, reset }
}
