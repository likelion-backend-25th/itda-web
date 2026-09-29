import type { PayMethod } from '@/types/payment'

const labels: Record<PayMethod, string> = {
  KAKAOPAY: '카카오페이',
  TOSSPAY: '토스페이',
}

type PayMethodPickerProps = {
  value: PayMethod
  disabled?: boolean
  onChange: (value: PayMethod) => void
}

export default function PayMethodPicker({ value, disabled, onChange }: PayMethodPickerProps) {
  return (
    <div className="pay-methods" role="radiogroup" aria-label="결제수단">
      {(Object.keys(labels) as PayMethod[]).map((method) => (
        <button
          key={method}
          type="button"
          role="radio"
          aria-checked={value === method}
          className={value === method ? 'on' : undefined}
          disabled={disabled}
          onClick={() => onChange(method)}
        >
          {labels[method]}
        </button>
      ))}
    </div>
  )
}
