import { useCallback } from 'react'
import { categoryIdFromLabel, createPost } from '@/api/post'
import type { PostDraft } from '@/components/feed/WritePostModal'
import type { PostResponse } from '@/types/post'

/** 어느 페이지에서든 동일하게 POST /posts (multipart) 로 글을 등록한다 */
export function usePublishPost() {
  const publish = useCallback(async (draft: PostDraft): Promise<PostResponse> => {
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
