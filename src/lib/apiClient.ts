import {
  bootstrapProactiveRefresh,
  getAccessToken,
  registerProactiveRefreshHandler,
  setAccessToken,
} from './authToken'

interface ApiErrorBody {
  message: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  )
}

function readApiErrorMessage(body: unknown, status: number): string {
  if (isApiErrorBody(body) && body.message.trim() !== '') {
    return body.message
  }
  return `요청에 실패했습니다. (${status})`
}

type ApiFetchOptions = Omit<RequestInit, 'headers' | 'credentials'> & {
  headers?: HeadersInit
  /** true면 Authorization 헤더를 붙이지 않음 */
  skipAuth?: boolean
  /** true면 401 시 refresh 재시도 안 함 (refresh 자체·재시도 1회용) */
  skipRefresh?: boolean
}

/** 로컬: 빈 문자열(프록시). 배포: netlify.toml 의 VITE_API_BASE_URL, 없으면 PROD 기본값. */
function apiOrigin(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/\/$/, '')
  }
  if (import.meta.env.PROD) {
    return 'https://api.eony.site'
  }
  return ''
}

export function getApiOrigin(): string {
  return apiOrigin()
}

function apiUrl(path: string): string {
  const pathWithVersion = path.startsWith('/api/')
    ? path
    : `/api/v1${path.startsWith('/') ? path : `/${path}`}`
  return `${apiOrigin()}${pathWithVersion}`
}

/** 동시에 여러 401이 나도 refresh는 한 번만 */
let refreshInFlight: Promise<boolean> | null = null

/**
 * HttpOnly refreshToken 쿠키로 access 재발급 (RTR).
 * 쿠키 Path=/api/v1/auth 이므로 이 경로로만 전송됨.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const response = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) return false
      const body: unknown = await response.json().catch(() => null)
      if (
        typeof body !== 'object' ||
        body === null ||
        !('accessToken' in body) ||
        typeof (body as { accessToken: unknown }).accessToken !== 'string'
      ) {
        return false
      }
      const accessToken = (body as { accessToken: string }).accessToken
      const expiresIn =
        'expiresIn' in body && typeof (body as { expiresIn: unknown }).expiresIn === 'number'
          ? (body as { expiresIn: number }).expiresIn
          : undefined
      setAccessToken(accessToken, expiresIn)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

/**
 * /api/v1 요청 래퍼.
 * - credentials: include → refresh HttpOnly 쿠키 송수신
 * - JWT 있으면 Bearer 첨부
 * - 401이면 refresh 1회 후 재시도
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuth = false, skipRefresh = false, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)

  if (!skipAuth) {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  if (rest.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const url = apiUrl(path)

  try {
    const response = await fetch(url, { ...rest, headers, credentials: 'include' })

    if (response.status === 401 && !skipAuth && !skipRefresh) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return apiFetch(path, { ...options, skipRefresh: true })
      }
      // refresh 실패 → 세션 정리 (동적 import로 순환 참조 방지)
      const { setLoggedIn } = await import('@/data/session')
      setLoggedIn(false)
    }

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null)
      throw new ApiError(readApiErrorMessage(body, response.status), response.status)
    }
    return response
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    throw new Error(message)
  }
}

export async function apiJson<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const response = await apiFetch(path, options)
  return (await response.json()) as T
}

// 만료 전 자동 refresh 등록 (페이지 로드 시 기존 세션도 스케줄)
registerProactiveRefreshHandler(async () => refreshAccessToken())
bootstrapProactiveRefresh()
