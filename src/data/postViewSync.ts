type PostViewListener = (postId: string, views: number) => void

const listeners = new Set<PostViewListener>()

/** 상세에서 받은 최신 조회수를 목록 카드에 반영할 때 구독 */
export function subscribePostViews(listener: PostViewListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 상세 조회 성공 시 호출 — 홈/마이페이지 목록 views 동기화 */
export function publishPostViews(postId: string, views: number) {
  listeners.forEach((listener) => listener(postId, views))
}
