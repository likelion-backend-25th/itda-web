/** GET /api/v1/subscriptions/{targetId} */
export interface SubscriptionStatusResponse {
  subscribed: boolean
}

/** GET /api/v1/subscriptions/{targetId}/count */
export interface SubscriberCountResponse {
  subscriberCount: number
}

/** GET /api/v1/subscriptions/{targetId}/income */
export interface MonthlyIncomeResponse {
  monthlyIncome: number
}

/** GET /api/v1/subscriptions/me */
export interface MySubscriptionResponse {
  subscriptionId: number
  targetId: number
  nickname: string
  profileImage: string | null
  priceId: number
  nextBillingAt: string
  remainingDays: number
}
