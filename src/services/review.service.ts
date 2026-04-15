import { getServerApiBase, requestJson } from '@/lib/http-client'
import { refreshAccessToken, setAuthToken } from '@/lib/auth-helpers'

function apiRoot(): string {
  return getServerApiBase().replace(/\/$/, '')
}

function bearerHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('access_token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

/**
 * FormData POST with 401 refresh (same pattern as {@link requestJson}).
 */
async function fetchWithAuthRefresh(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const run = () =>
    fetch(url, {
      credentials: 'include',
      ...init,
      headers: {
        ...bearerHeaders(),
        ...(init.headers as Record<string, string>),
      },
    })
  let res = await run()
  if (res.status === 401 && typeof window !== 'undefined') {
    const next = await refreshAccessToken()
    if (next) {
      setAuthToken(next)
      res = await run()
    }
  }
  return res
}

export interface CreateReviewResponse {
  success: boolean
  review: {
    id: string
    author: string
    rating: number
    content: string
    images: string[]
    createdAt: string
  }
}

export async function createReview(params: {
  enterpriseId: string
  rating?: number
  comment?: string
  images?: File[]
}): Promise<CreateReviewResponse> {
  const formData = new FormData()
  formData.append('enterpriseId', params.enterpriseId)
  if (params.rating != null && params.rating > 0) {
    formData.append('rating', String(params.rating))
  }
  if (params.comment?.trim()) {
    formData.append('comment', params.comment.trim())
  }
  params.images?.forEach((file) => formData.append('images', file))

  const res = await fetchWithAuthRefresh(`${apiRoot()}/reviews`, {
    method: 'POST',
    body: formData,
  })
  const data = (await res.json()) as CreateReviewResponse & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit review')
  }
  return data
}

export async function getEnterpriseReviews(params: {
  q?: string
  rating?: string
  status?: string
  startDate?: string
  endDate?: string
  sort?: string
  page?: number
  limit?: number
}): Promise<{
  success: boolean
  reviews: Array<{
    id: string
    customerName: string
    customerEmail: string | null
    rating: number
    comment: string
    createdAt: string
    updatedAt: string | null
    images: string[]
    isHidden: boolean
  }>
  stats: {
    averageRating: number
    totalReviews: number
    ratingDistribution: Record<string, number>
    visibleCount: number
    hiddenCount: number
    supportsVisibility: boolean
  }
  pagination: { page: number; limit: number; total: number; totalPages: number }
  features: { visibilityToggle: boolean }
}> {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  })
  const qs = search.toString()
  const url = qs
    ? `${apiRoot()}/enterprise/reviews?${qs}`
    : `${apiRoot()}/enterprise/reviews`
  return requestJson(url, { method: 'GET' })
}

export async function patchEnterpriseReview(
  reviewId: string,
  isHidden: boolean,
): Promise<{ success: boolean; reviewId: string; isHidden: boolean }> {
  return requestJson(`${apiRoot()}/enterprise/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ isHidden }),
  })
}

export async function getAdminReviews(params: {
  q?: string
  enterpriseId?: string
  status?: string
  startDate?: string
  endDate?: string
}): Promise<{
  reviews: Array<{
    id: string
    customerName: string
    customerEmail: string
    enterpriseId: string
    enterpriseName: string
    rating: number
    comment: string
    images: string[]
    createdAt: string
    updatedAt: string | null
    isHidden: boolean
  }>
  total: number
}> {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  })
  const qs = search.toString()
  const url = qs
    ? `${apiRoot()}/admin/reviews?${qs}`
    : `${apiRoot()}/admin/reviews`
  return requestJson(url, { method: 'GET' })
}

export async function patchAdminReview(
  reviewId: string,
  isHidden: boolean,
): Promise<{ success: boolean; review: { id: string; isHidden: boolean } }> {
  return requestJson(
    `${apiRoot()}/admin/reviews/${encodeURIComponent(reviewId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isHidden }),
    },
  )
}
