import { clearAccessToken, getAccessToken } from '../lib/authToken'

// JWT가 있으면 로그인으로 본다. (OAuth 리다이렉트 후 새로고침 유지)
let loggedIn = getAccessToken() !== null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getLoggedIn() {
  return loggedIn
}

export function setLoggedIn(next: boolean) {
  // 로그아웃 시 JWT도 함께 제거
  if (!next) {
    clearAccessToken()
  }
  if (loggedIn === next) return
  loggedIn = next
  emit()
}
