import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  ensureMyFollowingLoaded,
  getFollowingIds,
  getFollowsVersion,
  getPendingFollowIds,
  isMyFollowingLoaded,
  subscribeFollows,
  toggleFollow,
} from '@/data/follows'
import { ApiError } from '@/lib/apiClient'

function toFollowErrorMessage(error: unknown, next: boolean): string {
  if (error instanceof ApiError && error.status === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }
  if (error instanceof Error && error.message.trim() !== '') return error.message
  return next ? '팔로우에 실패했습니다.' : '언팔로우에 실패했습니다.'
}

/** 팔로우 상태 구독 + 팔로우/언팔로우 실행 */
export function useFollow(loggedIn: boolean) {
  const followedIds = useSyncExternalStore(subscribeFollows, getFollowingIds)
  const pendingIds = useSyncExternalStore(subscribeFollows, getPendingFollowIds)
  const version = useSyncExternalStore(subscribeFollows, getFollowsVersion)
  const loaded = useSyncExternalStore(subscribeFollows, isMyFollowingLoaded)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loggedIn) void ensureMyFollowingLoaded()
  }, [loggedIn])

  const toggle = useCallback(async (memberId: string, next: boolean) => {
    setError(null)
    try {
      await toggleFollow(memberId, next)
    } catch (caught: unknown) {
      setError(toFollowErrorMessage(caught, next))
    }
  }, [])

  return {
    followedIds,
    pendingIds,
    /** 서버 팔로우 변경 횟수 — 목록 훅의 재조회 키 */
    version,
    /** 서버 기준 팔로우 여부를 알고 있는지 */
    ready: !loggedIn || loaded,
    error,
    toggle,
  }
}
