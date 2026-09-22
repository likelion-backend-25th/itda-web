import { getAccessToken } from './authToken'

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

type ApiFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit
  /** true면 Authorization 헤더를 붙이지 않음 */
  skipAuth?: boolean
}

/**
 * /api/v1 요청 래퍼. JWT가 있으면 Bearer로 자동 첨부.
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { skipAuth = false, headers: initHeaders, ...rest } = options
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

  const url = path.startsWith('/api/') ? path : `/api/v1${path.startsWith('/') ? path : `/${path}`}`

  try {
    const response = await fetch(url, { ...rest, headers })
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
