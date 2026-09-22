import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { setLoggedIn } from '@/data/session'
import { setAccessToken } from '@/lib/authToken'

/**
 * 백엔드 OAuth 성공 리다이렉트(?accessToken=...)에서 JWT를 저장하고 URL을 정리한다.
 */
export function useOAuthTokenCapture() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken = params.get('accessToken')
    if (!accessToken) return

    setAccessToken(accessToken)
    setLoggedIn(true)

    // 주소창·히스토리에 토큰이 남지 않도록 쿼리 제거
    const next = new URLSearchParams(params)
    next.delete('accessToken')
    const search = next.toString()
    navigate({ search: search ? `?${search}` : '' }, { replace: true })
  }, [params, navigate])
}
