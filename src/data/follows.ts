import { fetchFollowings, followMember, unfollowMember } from '@/api/member'
import { ensureViewerLoaded, refreshViewerProfile } from '@/data/viewer'

/**
 * 내가 팔로우 중인 회원 id 저장소.
 * - 숫자 id: 서버 회원 (GET /members/{me}/followings 로 채우고 POST·DELETE /members/{id}/follow 로 변경)
 * - 문자열 id: 목 데이터 회원 (서버에 없으므로 로컬에서만 토글)
 */
const mockFollowing = new Set<string>(['minsu', 'haneul', 'minseo', 'dohyun'])
let serverFollowing = new Set<string>()
let serverLoaded = false
let loadPromise: Promise<void> | null = null
let following: ReadonlySet<string> = new Set(mockFollowing)
let pending: ReadonlySet<string> = new Set()
let version = 0
const listeners = new Set<() => void>()

const myFollowers = ['minsu', 'minseo', 'dohyun', 'cat']

const networks: Record<string, { followers: string[]; following: string[] }> = {
  minsu: {
    followers: ['haneul', 'minseo', 'dohyun', 'cat'],
    following: ['haneul', 'minseo', 'jieun', 'cat'],
  },
  haneul: {
    followers: ['minsu', 'minseo', 'jieun', 'cat'],
    following: ['minsu', 'dohyun', 'minseo'],
  },
  minseo: {
    followers: ['minsu', 'haneul', 'dohyun', 'jieun'],
    following: ['haneul', 'cat', 'dohyun', 'minsu'],
  },
  dohyun: {
    followers: ['minseo', 'haneul', 'cat', 'jieun'],
    following: ['minsu', 'minseo', 'haneul'],
  },
  cat: {
    followers: ['minseo', 'dohyun', 'haneul'],
    following: ['minsu', 'minseo', 'jieun', 'dohyun'],
  },
  jieun: {
    followers: ['minsu', 'haneul', 'minseo'],
    following: ['minsu', 'dohyun', 'cat'],
  },
}

function toServerId(memberId: string): number | null {
  const id = Number(memberId)
  return Number.isInteger(id) && id > 0 ? id : null
}

function emit() {
  following = new Set([...mockFollowing, ...serverFollowing])
  listeners.forEach((listener) => listener())
}

export function subscribeFollows(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFollowingIds(): ReadonlySet<string> {
  return following
}

/** 요청 중인 회원 id (버튼 중복 클릭 방지) */
export function getPendingFollowIds(): ReadonlySet<string> {
  return pending
}

/** 서버 팔로우 변경이 성공할 때마다 증가 — 팔로워·팔로잉 목록 재조회 트리거 */
export function getFollowsVersion(): number {
  return version
}

export function isMyFollowingLoaded(): boolean {
  return serverLoaded
}

/** 이미 받은 내 팔로잉 목록으로 서버 상태를 맞춘다 (중복 조회 방지) */
export function syncMyFollowing(ids: number[]) {
  serverFollowing = new Set(ids.map(String))
  serverLoaded = true
  emit()
}

/** 로그인한 내 팔로잉 목록을 세션당 한 번 불러온다 */
export function ensureMyFollowingLoaded(): Promise<void> {
  if (serverLoaded) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      const me = await ensureViewerLoaded()
      if (!me) return
      const list = await fetchFollowings(me.id)
      syncMyFollowing(list.map((member) => member.id))
    } catch {
      // 실패하면 다음 호출에서 다시 시도
    } finally {
      loadPromise = null
    }
  })()
  return loadPromise
}

/** 로그아웃 시 서버 팔로우 상태를 비운다 */
export function resetServerFollows() {
  serverFollowing = new Set()
  serverLoaded = false
  loadPromise = null
  pending = new Set()
  emit()
}

/**
 * 팔로우/언팔로우.
 * 화면을 먼저 바꾸고(낙관적 업데이트) 서버 요청이 실패하면 되돌린 뒤 에러를 던진다.
 */
export async function toggleFollow(memberId: string, next: boolean): Promise<void> {
  const serverId = toServerId(memberId)

  if (serverId == null) {
    if (mockFollowing.has(memberId) === next) return
    if (next) mockFollowing.add(memberId)
    else mockFollowing.delete(memberId)
    emit()
    return
  }

  if (pending.has(memberId)) return
  const previous = serverFollowing.has(memberId)
  if (previous === next) return

  const optimistic = new Set(serverFollowing)
  if (next) optimistic.add(memberId)
  else optimistic.delete(memberId)
  serverFollowing = optimistic
  pending = new Set([...pending, memberId])
  emit()

  try {
    if (next) await followMember(serverId)
    else await unfollowMember(serverId)
    version += 1
    // 내 followingCount가 바뀌었으므로 캐시된 내 프로필도 갱신
    void refreshViewerProfile()
  } catch (error: unknown) {
    const rollback = new Set(serverFollowing)
    if (previous) rollback.add(memberId)
    else rollback.delete(memberId)
    serverFollowing = rollback
    throw error
  } finally {
    const nextPending = new Set(pending)
    nextPending.delete(memberId)
    pending = nextPending
    emit()
  }
}

export function myFollowerIds() {
  return myFollowers
}

export function memberFollowIds(memberId: string) {
  return networks[memberId] ?? { followers: [], following: [] }
}
