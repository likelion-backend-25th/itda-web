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
const IDLE: FollowListState = { items: [], loading: false, error: null }

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

type MemberFollows = {
  followers: FollowListState
  following: FollowListState
}

/**
 * GET /members/{id}/followers · followings
 * 결과를 회원 id와 함께 저장해, 다른 회원으로 이동하면 이전 목록 대신 로딩을 보여주고
 * refreshKey로 재조회할 때는 기존 목록을 유지한다.
 */
export function useMemberFollows(memberId: number | null, enabled: boolean, refreshKey = 0): MemberFollows {
  const [result, setResult] = useState<{ memberId: number; data: MemberFollows } | null>(null)
  const active = enabled && memberId != null && memberId > 0

  useEffect(() => {
    if (!active || memberId == null) return

    const id = memberId
    let cancelled = false
    async function load() {
      const [followerResult, followingResult] = await Promise.allSettled([
        fetchFollowers(id),
        fetchFollowings(id),
      ])
      if (cancelled) return
      setResult({
        memberId: id,
        data: {
          followers: toListState(followerResult, '팔로워 목록을 불러오지 못했습니다.'),
          following: toListState(followingResult, '팔로잉 목록을 불러오지 못했습니다.'),
        },
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [active, memberId, refreshKey])

  if (!active) return { followers: IDLE, following: IDLE }
  if (result == null || result.memberId !== memberId) return { followers: LOADING, following: LOADING }
  return result.data
}
