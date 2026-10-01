export type Membership = {
  memberId: string
  daysLeft: number
}

/** 결제·구독 토글 직후 UI용. 시드 없이 서버 상태와 맞춰 갱신한다. */
let memberships: Membership[] = []
let idSnapshot = new Set<string>()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeMemberships(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSubscribedIds() {
  return idSnapshot
}

export function setSubscribed(memberId: string, subscribed: boolean) {
  const exists = memberships.some((item) => item.memberId === memberId)
  if (exists === subscribed) return
  memberships = subscribed
    ? [...memberships, { memberId, daysLeft: 30 }]
    : memberships.filter((item) => item.memberId !== memberId)
  idSnapshot = new Set(memberships.map((item) => item.memberId))
  emit()
}
