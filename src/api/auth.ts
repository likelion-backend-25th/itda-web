import { apiFetch, apiJson } from '@/lib/apiClient'
import { setAccessToken } from '@/lib/authToken'
import { setLoggedIn } from '@/data/session'
import type { LoginRequest, LoginResponse, SignupRequest } from '@/types/auth'

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiJson<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
  })
}

export async function signup(request: SignupRequest): Promise<void> {
  await apiFetch('/member', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
  })
}

/** JWT 저장 후 로그인 상태로 전환 */
export function applyAccessToken(accessToken: string): void {
  setAccessToken(accessToken)
  setLoggedIn(true)
}
