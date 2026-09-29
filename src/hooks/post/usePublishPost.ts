import { useCallback } from 'react'
import { categoryIdFromLabel, createPost } from '@/api/post'
import type { PostDraft } from '@/components/feed/WritePostModal'
import { isViewerSuspended } from '@/data/viewer'
import type { PostResponse } from '@/types/post'

/** 어느 페이지에서든 동일하게 POST /posts (multipart) 로 글을 등록한다 */
export function usePublishPost() {
  const publish = useCallback(async (draft: PostDraft): Promise<PostResponse> => {
    if (isViewerSuspended()) {
      throw new Error('활동 정지된 회원은 글을 작성할 수 없습니다.')
    }
    return createPost({
      request: {
        categoryId: categoryIdFromLabel(draft.categoryLabel),
        content: draft.content,
        subscriberOnly: draft.visibility === 'subscribers',
      },
      image: draft.imageFile ?? null,
    })
  }, [])

  return { publish }
}
