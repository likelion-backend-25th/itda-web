export interface LoginRequest {
  email: string
  password: string
}

/** 백엔드 TokenResponse — refresh는 HttpOnly 쿠키, body에는 access만 */
export interface TokenResponse {
  accessToken: string
  tokenType?: string
  expiresIn?: number
}

/** @deprecated LoginResponse 대신 TokenResponse 사용 */
export type LoginResponse = TokenResponse

export interface SignupRequest {
  email: string
  password: string
  nickname: string
}
