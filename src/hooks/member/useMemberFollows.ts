import { useEffect, useState } from 'react'
import { fetchFollowers, fetchFollowings, resolveMemberImageUrl } from '@/api/member'
import type { FollowListItem } from '@/components/profile/FollowList'
import { ApiError } from '@/lib/apiClient'
import type { FollowerResponse, FollowingResponse } from '@/types/member'

export type FollowListState = {
  items: FollowListItem[]
  loading: boolean
  error: string | null
}

const LOADING: FollowListState = { items: [], loading: true, error: null }

function toFollowListItem(member: FollowerResponse | FollowingResponse): FollowListItem {
  return {
    id: String(member.id),
    name: member.nickname,
    avatar: resolveMemberImageUrl(member.profileImage),
    href: `/member/${member.id}`,
    toggleable: false,
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

type MemberFollows = {
  followers: FollowListState
  following: FollowListState
}

/** GET /member/{id}/followers · followings */
export function useMemberFollows(memberId: number | null, enabled: boolean): MemberFollows {
  const [result, setResult] = useState<MemberFollows | null>(null)

  useEffect(() => {
    if (!enabled || memberId == null || memberId <= 0) {
      setResult(null)
      return
    }

    const id = memberId
    let cancelled = false
    async function load() {
      const [followerResult, followingResult] = await Promise.allSettled([
        fetchFollowers(id),
        fetchFollowings(id),
      ])
      if (cancelled) return
      setResult({
        followers: toListState(followerResult, '팔로워 목록을 불러오지 못했습니다.'),
        following: toListState(followingResult, '팔로잉 목록을 불러오지 못했습니다.'),
      })
    }

    void load()
    return () => {
      cancelled = true
      setResult(null)
    }
  }, [enabled, memberId])

  if (!enabled || memberId == null || memberId <= 0) {
    return {
      followers: { items: [], loading: false, error: null },
      following: { items: [], loading: false, error: null },
    }
  }
  return result ?? { followers: LOADING, following: LOADING }
}
