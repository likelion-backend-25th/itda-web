const ACCESS_TOKEN_KEY = 'accessToken'
const EXPIRES_AT_KEY = 'accessTokenExpiresAt'

/** 백엔드 TokenResponse.expiresIn 기본값(초) */
export const DEFAULT_ACCESS_EXPIRES_IN = 3600

/** 만료 N초 전에 refresh (60초) */
const REFRESH_SKEW_SEC = 60

let refreshTimer: ReturnType<typeof setTimeout> | null = null
let proactiveRefreshHandler: (() => Promise<boolean>) | null = null

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getAccessTokenExpiresAt(): number | null {
  const raw = localStorage.getItem(EXPIRES_AT_KEY)
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

/**
 * access 저장 + 만료 시각 기록 + 사전 refresh 타이머 등록
 * @param expiresInSec TokenResponse.expiresIn (초). 없으면 3600
 */
export function setAccessToken(token: string, expiresInSec = DEFAULT_ACCESS_EXPIRES_IN): void {
  const ttl = expiresInSec > 0 ? expiresInSec : DEFAULT_ACCESS_EXPIRES_IN
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + ttl * 1000))
  scheduleProactiveRefresh()
}

export function clearAccessToken(): void {
  clearProactiveRefreshTimer()
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

/** apiClient에서 refresh 함수를 등록한다 */
export function registerProactiveRefreshHandler(handler: () => Promise<boolean>): void {
  proactiveRefreshHandler = handler
}

export function bootstrapProactiveRefresh(): void {
  if (getAccessToken()) scheduleProactiveRefresh()
}

function clearProactiveRefreshTimer(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

function scheduleProactiveRefresh(): void {
  clearProactiveRefreshTimer()
  if (!proactiveRefreshHandler || !getAccessToken()) return

  const expiresAt = getAccessTokenExpiresAt()
  if (expiresAt === null) return

  // 만료 REFRESH_SKEW_SEC 초 전에 실행. 이미 지났으면 즉시(0)
  const delayMs = Math.max(expiresAt - REFRESH_SKEW_SEC * 1000 - Date.now(), 0)

  refreshTimer = setTimeout(() => {
    void runProactiveRefresh()
  }, delayMs)
}

async function runProactiveRefresh(): Promise<void> {
  if (!proactiveRefreshHandler) return
  const ok = await proactiveRefreshHandler()
  if (!ok) {
    const { setLoggedIn } = await import('@/data/session')
    setLoggedIn(false)
  }
  // 성공 시 setAccessToken 안에서 다음 타이머가 다시 걸린다
}
