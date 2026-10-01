type PostViewListener = (postId: string, views: number) => void
type PostCommentListener = (postId: string, comments: number) => void

const viewListeners = new Set<PostViewListener>()
const commentListeners = new Set<PostCommentListener>()

/** 상세에서 받은 최신 조회수를 목록 카드에 반영할 때 구독 */
export function subscribePostViews(listener: PostViewListener) {
  viewListeners.add(listener)
  return () => {
    viewListeners.delete(listener)
  }
}

/** 상세 조회 성공 시 호출 — 홈/마이페이지 목록 views 동기화 */
export function publishPostViews(postId: string, views: number) {
  viewListeners.forEach((listener) => listener(postId, views))
}

/** 상세에서 바뀐 댓글 수를 목록 카드에 반영할 때 구독 */
export function subscribePostComments(listener: PostCommentListener) {
  commentListeners.add(listener)
  return () => {
    commentListeners.delete(listener)
  }
}

/** 댓글 작성·삭제 후 호출 — 홈/마이페이지 목록 comments 동기화 */
export function publishPostComments(postId: string, comments: number) {
  commentListeners.forEach((listener) => listener(postId, comments))
}
