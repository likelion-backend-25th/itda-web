import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router'

type AuthCardProps = {
  children: ReactNode
  footer: ReactNode
  className?: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function AuthCard({ children, footer, className, onSubmit }: AuthCardProps) {
  return (
    <div className="auth-page">
      <span className="auth-blob top" aria-hidden="true" />
      <span className="auth-blob bottom" aria-hidden="true" />
      <form className={className ? `auth-card ${className}` : 'auth-card'} onSubmit={onSubmit}>
        <h1>ITDA</h1>
        {children}
        {footer}
      </form>
    </div>
  )
}

export function AuthSwitch({ prompt, to, label }: { prompt: string; to: string; label: string }) {
  return (
    <p className="auth-switch">
      {prompt} <Link to={to}>{label}</Link>
    </p>
  )
}

export function GoogleMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z" />
    </svg>
  )
}

export function KakaoMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#FEE500" />
      <path
        fill="#191919"
        d="M12 7.2c-3.2 0-5.8 2-5.8 4.5 0 1.6 1 3 2.6 3.8l-.6 2.3 2.6-1.7c.4.1.8.1 1.2.1 3.2 0 5.8-2 5.8-4.5S15.2 7.2 12 7.2Z"
      />
    </svg>
  )
}
