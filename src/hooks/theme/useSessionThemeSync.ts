import { useEffect, useSyncExternalStore } from 'react'
import { resetAppTheme, syncAppliedThemeFromServer } from '@/data/appTheme'
import { getLoggedIn, subscribeSession } from '@/data/session'
import { ApiError } from '@/lib/apiClient'

/** 로그인/로그아웃에 맞춰 적용 테마를 서버와 동기화한다 */
export function useSessionThemeSync() {
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)

  useEffect(() => {
    if (!loggedIn) {
      resetAppTheme()
      return
    }

    let cancelled = false
    void syncAppliedThemeFromServer().catch((error: unknown) => {
      if (cancelled) return
      // 401은 세션 쪽에서 처리. 그 외는 light 유지(reset은 sync 실패 시 apply 폴백)
      if (error instanceof ApiError && error.status === 401) return
    })

    return () => {
      cancelled = true
    }
  }, [loggedIn])
}
