import { useEffect, useSyncExternalStore } from 'react'
import { DEFAULT_AVATAR } from '@/api/member'
import type { FeedUser } from '@/data/feed'
import { getLoggedIn, setLoggedIn, subscribeSession } from '@/data/session'
import {
  clearViewer,
  ensureViewerLoaded,
  getViewerUser,
  subscribeViewer,
} from '@/data/viewer'
import { ApiError } from '@/lib/apiClient'

const guestUser: FeedUser = {
  name: '',
  handle: '',
  bio: '',
  avatar: DEFAULT_AVATAR,
}

/**
 * 로그인 중이면 캐시된 /members/me 프로필을 쓴다.
 * 페이지를 옮겨도 같은 캐시를 공유해서 목 사용자가 깜빡이지 않는다.
 */
export function useViewerUser(): FeedUser {
  const loggedIn = useSyncExternalStore(subscribeSession, getLoggedIn)
  const cached = useSyncExternalStore(subscribeViewer, getViewerUser)

  useEffect(() => {
    if (!loggedIn) {
      clearViewer()
      return
    }

    let cancelled = false
    void ensureViewerLoaded().catch((error: unknown) => {
      if (cancelled) return
      if (error instanceof ApiError && error.status === 401) {
        setLoggedIn(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [loggedIn])

  if (!loggedIn) return guestUser
  return cached ?? guestUser
}
