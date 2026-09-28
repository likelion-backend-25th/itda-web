import { useSyncExternalStore, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { getLoggedIn, subscribeSession } from '@/data/session'

type RequireAuthProps = {
  children: ReactNode
}

/** 비로그인이면 로그인으로 보내고, 로그인 후 돌아올 경로를 state에 남긴다 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const location = useLocation()

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return children
}
