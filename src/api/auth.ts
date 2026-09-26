import { apiFetch, apiJson, refreshAccessToken } from '@/lib/apiClient'
import { DEFAULT_ACCESS_EXPIRES_IN, setAccessToken } from '@/lib/authToken'
import { setLoggedIn } from '@/data/session'
import type { LoginRequest, SignupRequest, TokenResponse } from '@/types/auth'

export async function login(request: LoginRequest): Promise<TokenResponse> {
  // credentials include → Set-Cookie(refreshToken) 브라우저 저장
  return apiJson<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
    skipRefresh: true,
  })
}

export async function signup(request: SignupRequest): Promise<void> {
  await apiFetch('/member', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
    skipRefresh: true,
  })
}

/** HttpOnly 쿠키 기반 access 갱신 (RTR) */
export { refreshAccessToken }

/** JWT 저장 + 만료 전 자동 refresh 스케줄 + 로그인 상태 */
export function applyAccessToken(accessToken: string, expiresIn?: number): void {
  setAccessToken(accessToken, expiresIn ?? DEFAULT_ACCESS_EXPIRES_IN)
  setLoggedIn(true)
}

/** access·타이머만 로컬 정리 (서버 쿠키는 그대로) */
export function logoutLocal(): void {
  setLoggedIn(false)
}

/**
 * POST /api/v1/auth/logout
 * - HttpOnly refreshToken 쿠키로 DB revoke + 쿠키 삭제
 * - 이후 로컬 access 삭제
 * body 없음. credentials include 필수.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      skipAuth: true,
      skipRefresh: true,
    })
  } catch {
    // 서버 실패해도 클라이언트 세션은 정리
  } finally {
    logoutLocal()
  }
}
