let following = new Set<string>(['minsu', 'haneul', 'minseo', 'dohyun'])
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

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeFollows(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFollowingIds() {
  return following
}

export function setFollowing(memberId: string, next: boolean) {
  if (following.has(memberId) === next) return
  const copy = new Set(following)
  if (next) copy.add(memberId)
  else copy.delete(memberId)
  following = copy
  emit()
}

export function myFollowerIds() {
  return myFollowers
}

export function memberFollowIds(memberId: string) {
  return networks[memberId] ?? { followers: [], following: [] }
}
