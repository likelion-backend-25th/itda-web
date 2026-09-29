import { fetchMyProfile, toFeedUser } from '@/api/member'
import type { FeedUser } from '@/data/feed'
import type { MemberProfileResponse } from '@/types/member'
import { ApiError } from '@/lib/apiClient'

let profile: MemberProfileResponse | null = null
let feedUser: FeedUser | null = null
let loadPromise: Promise<MemberProfileResponse | null> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeViewer(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getViewerProfile(): MemberProfileResponse | null {
  return profile
}

/** 활동 정지 회원은 글·댓글을 작성할 수 없다 */
export function isViewerSuspended(): boolean {
  return profile?.status === 'SUSPENDED'
}

export function getViewerUser(): FeedUser | null {
  return feedUser
}

/** 로그인 프로필을 캐시에 넣고 구독자에게 알린다 */
export function setViewerProfile(me: MemberProfileResponse) {
  profile = me
  feedUser = toFeedUser(me)
  emit()
}

export function clearViewer() {
  profile = null
  feedUser = null
  loadPromise = null
  emit()
}

/** 캐시를 무시하고 /members/me 를 다시 받아 카운트 등을 갱신한다 (실패 시 기존 캐시 유지) */
export async function refreshViewerProfile(): Promise<void> {
  if (!profile) return
  try {
    setViewerProfile(await fetchMyProfile())
  } catch {
    // 표시 중인 값을 유지
  }
}

/**
 * 캐시가 있으면 그대로 쓰고, 없으면 /members/me 를 한 번만 호출한다.
 * 페이지 이동 시 목 사용자 깜빡임을 막기 위함.
 */
export function ensureViewerLoaded(): Promise<MemberProfileResponse | null> {
  if (profile) return Promise.resolve(profile)
  if (loadPromise) return loadPromise

  loadPromise = fetchMyProfile()
    .then((me) => {
      setViewerProfile(me)
      return me
    })
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        clearViewer()
        throw error
      }
      return null
    })
    .finally(() => {
      loadPromise = null
    })

  return loadPromise
}
