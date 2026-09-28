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

/**
 * 백엔드 SignupRequest (@RequestPart "request")
 * 프로필 파일은 MultipartFile 파트(profileImage)로 별도 전송
 */
export interface SignupRequest {
  email: string
  password: string
  nickname: string
  interestCategoryIds?: number[]
}

/** MemberController.signup 요청 묶음 */
export type SignupPayload = {
  request: SignupRequest
  profileImage?: File | null
}
