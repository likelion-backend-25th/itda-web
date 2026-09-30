import type { InterestId } from '@/components/profile/ProfileEditModal'

/** UI 관심사 ↔ common_code id (type=3, data.sql CA01~CA10) */
export const INTEREST_CATEGORY_ID: Record<InterestId, number> = {
  food: 8,
  travel: 9,
  workout: 10,
  reading: 11,
  music: 12,
  cooking: 13,
  craft: 14,
  drawing: 15,
  game: 16,
  etc: 17,
}

const CATEGORY_ID_TO_INTEREST: Record<number, InterestId> = Object.fromEntries(
  Object.entries(INTEREST_CATEGORY_ID).map(([id, categoryId]) => [categoryId, id as InterestId]),
) as Record<number, InterestId>

export function interestIdsFromCategoryIds(categoryIds: number[] | null | undefined): InterestId[] {
  if (!categoryIds?.length) return []
  const seen = new Set<InterestId>()
  const result: InterestId[] = []
  for (const categoryId of categoryIds) {
    const interest = CATEGORY_ID_TO_INTEREST[categoryId]
    if (!interest || seen.has(interest)) continue
    seen.add(interest)
    result.push(interest)
  }
  return result
}

export function categoryIdsFromInterestIds(interests: InterestId[]): number[] {
  return [...new Set(interests.map((id) => INTEREST_CATEGORY_ID[id]))]
}
