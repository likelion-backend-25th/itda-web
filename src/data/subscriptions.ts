export const creatorSubscriberCount = 123
export const settlementAmount = 123456

export type Membership = {
  memberId: string
  daysLeft: number
}

const starter: Membership[] = [
  { memberId: 'minsu', daysLeft: 7 },
  { memberId: 'haneul', daysLeft: 9 },
  { memberId: 'minseo', daysLeft: 30 },
]

let memberships: Membership[] = starter
let idSnapshot = new Set(starter.map((item) => item.memberId))
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

export function getMemberships() {
  return memberships
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
