import { apiFetch, apiJson, refreshAccessToken } from '@/lib/apiClient'
import { DEFAULT_ACCESS_EXPIRES_IN, clearAccessToken, setAccessToken } from '@/lib/authToken'
import { setLoggedIn } from '@/data/session'
import type { LoginRequest, SignupPayload, TokenResponse } from '@/types/auth'

/** POST /api/v1/auth/login → TokenResponse + Set-Cookie(refreshToken) */
export async function login(request: LoginRequest): Promise<TokenResponse> {
  return apiJson<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
    skipRefresh: true,
  })
}

/**
 * POST /api/v1/member → 201 Created
 * @RequestPart("request") SignupRequest + @RequestPart("profileImage") MultipartFile?
 */
export async function signup({ request, profileImage }: SignupPayload): Promise<void> {
  const form = new FormData()
  form.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' }),
  )
  if (profileImage && profileImage.size > 0) {
    form.append('profileImage', profileImage, profileImage.name || 'profile.png')
  }

  await apiFetch('/member', {
    method: 'POST',
    body: form,
    skipAuth: true,
    skipRefresh: true,
  })
}

export { refreshAccessToken }

export function applyAccessToken(accessToken: string, expiresIn?: number): void {
  setAccessToken(accessToken, expiresIn ?? DEFAULT_ACCESS_EXPIRES_IN)
  setLoggedIn(true)
}

export function logoutLocal(): void {
  clearAccessToken()
  setLoggedIn(false)
}

/** POST /api/v1/auth/logout — HttpOnly refresh 쿠키로 revoke */
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
