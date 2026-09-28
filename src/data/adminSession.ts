import { subscribeSession } from '@/data/session'
import { hasAdminRole } from '@/lib/authToken'

/** 로그인 세션이 바뀔 때 관리자 여부도 다시 읽는다 */
export function subscribeAdmin(listener: () => void) {
  return subscribeSession(listener)
}

/** JWT roles의 ROLE_ADMIN */
export function getAdmin() {
  return hasAdminRole()
}
