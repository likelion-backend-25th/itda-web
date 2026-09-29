import { useEffect, useState } from 'react'
import { fetchFollowers, fetchFollowings, fetchMyProfile, resolveMemberImageUrl } from '@/api/member'
import type { FollowListItem } from '@/components/profile/FollowList'
import { syncMyFollowing } from '@/data/follows'
import { ApiError } from '@/lib/apiClient'
import type { FollowerResponse, FollowingResponse } from '@/types/member'

export type FollowListState = {
  items: FollowListItem[]
  loading: boolean
  error: string | null
}

const LOADING: FollowListState = { items: [], loading: true, error: null }
const LOGGED_OUT: FollowListState = {
  items: [],
  loading: false,
  error: '로그인 후 확인할 수 있습니다.',
}

function toFollowListItem(member: FollowerResponse | FollowingResponse): FollowListItem {
  return {
    id: String(member.id),
    name: member.nickname,
    avatar: resolveMemberImageUrl(member.profileImage),
    href: `/member/${member.id}`,
  }
}

function toErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof ApiError && reason.status === 401) {
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  }
  return reason instanceof Error ? reason.message : fallback
}

function toListState(
  result: PromiseSettledResult<FollowerResponse[]>,
  fallback: string,
): FollowListState {
  if (result.status === 'fulfilled') {
    return { items: result.value.map(toFollowListItem), loading: false, error: null }
  }
  return { items: [], loading: false, error: toErrorMessage(result.reason, fallback) }
}

type MyFollows = {
  followers: FollowListState
  following: FollowListState
}

/**
 * 로그인한 본인의 팔로워·팔로잉 목록 (/members/me → /members/{id}/followers, followings)
 * refreshKey가 바뀌면 기존 목록을 유지한 채 다시 받는다.
 */
export function useMyFollows(loggedIn: boolean, refreshKey = 0): MyFollows {
  const [result, setResult] = useState<MyFollows | null>(null)

  useEffect(() => {
    if (!loggedIn) return

    let cancelled = false
    async function load() {
      try {
        const me = await fetchMyProfile()
        // 한쪽 목록이 실패해도 다른 쪽은 보여주도록 allSettled
        const [followerResult, followingResult] = await Promise.allSettled([
          fetchFollowers(me.id),
          fetchFollowings(me.id),
        ])
        if (cancelled) return
        if (followingResult.status === 'fulfilled') {
          syncMyFollowing(followingResult.value.map((member) => member.id))
        }
        setResult({
          followers: toListState(followerResult, '팔로워 목록을 불러오지 못했습니다.'),
          following: toListState(followingResult, '팔로잉 목록을 불러오지 못했습니다.'),
        })
      } catch (error: unknown) {
        if (cancelled) return
        const failed: FollowListState = {
          items: [],
          loading: false,
          error: toErrorMessage(error, '프로필을 불러오지 못했습니다.'),
        }
        setResult({ followers: failed, following: failed })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [loggedIn, refreshKey])

  useEffect(() => {
    if (!loggedIn) return
    // 다른 계정으로 다시 로그인했을 때 이전 목록이 잠깐 보이지 않도록 로그아웃 시 비운다
    return () => setResult(null)
  }, [loggedIn])

  if (!loggedIn) return { followers: LOGGED_OUT, following: LOGGED_OUT }
  return result ?? { followers: LOADING, following: LOADING }
}
