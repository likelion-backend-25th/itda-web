type PostViewListener = (postId: string, views: number) => void
type PostCommentListener = (postId: string, comments: number) => void

/** 상세에서 바뀐 좋아요·스크랩. 넘긴 필드만 목록 카드에 덮어쓴다. */
export type PostReactionPatch = {
  liked?: boolean
  likes?: number
  bookmarked?: boolean
}

type PostReactionListener = (postId: string, patch: PostReactionPatch) => void

const viewListeners = new Set<PostViewListener>()
const commentListeners = new Set<PostCommentListener>()
const reactionListeners = new Set<PostReactionListener>()

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

/** 상세의 좋아요·스크랩을 메인 피드 카드에 반영할 때 구독 */
export function subscribePostReaction(listener: PostReactionListener) {
  reactionListeners.add(listener)
  return () => {
    reactionListeners.delete(listener)
  }
}

/** 상세에서 좋아요·스크랩을 누른 직후 호출 — 응답 전에도 피드에 같은 상태를 올린다 */
export function publishPostReaction(postId: string, patch: PostReactionPatch) {
  reactionListeners.forEach((listener) => listener(postId, patch))
}
