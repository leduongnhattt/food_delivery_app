"use client"
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useToast } from '@/contexts/toast-context'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from '@/lib/i18n'
import { createReview } from '@/services/review.service'

export type Review = {
  id: string
  author: string
  rating: number
  content: string
  images?: string[]
  createdAt?: string
}

interface ReviewComposerProps {
  enterpriseId: string
  onReviewSubmitted: () => void
}

function ReviewComposer({ enterpriseId, onReviewSubmitted }: ReviewComposerProps) {
  const [rating, setRating] = React.useState<number>(0)
  const [hover, setHover] = React.useState<number>(0)
  const [content, setContent] = React.useState<string>('')
  const [files, setFiles] = React.useState<File[]>([])
  const [previews, setPreviews] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { showToast } = useToast()
  const { isAuthenticated } = useAuth()

  React.useEffect(() => {
    const next = files.map(f => URL.createObjectURL(f))
    setPreviews(next)
    return () => next.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    
    const accepted = Array.from(list).filter(f => {
      const isImage = f.type.startsWith('image/')
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
      const isValidSize = f.size <= 5 * 1024 * 1024 // 5MB
      
      if (!isImage || !isValidType) {
        showToast('Only JPEG, PNG, and WebP images are allowed', 'error')
        return false
      }
      if (!isValidSize) {
        showToast('Image size must be less than 5MB', 'error')
        return false
      }
      return true
    }).slice(0, 6 - files.length)
    
    if (accepted.length === 0 && list.length > 0) {
      return
    }
    
    setFiles(prev => [...prev, ...accepted].slice(0, 6))
    e.target.value = ''
  }

  function removeImage(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function submit() {
    if (!isAuthenticated) {
      showToast('Please sign in to submit a review', 'warning')
      return
    }

    if (rating === 0 && content.trim().length === 0 && files.length === 0) {
      showToast('Please provide at least a rating, comment, or image', 'warning')
      return
    }

    if (content.length > 200) {
      showToast('Comment must be 200 characters or less', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      await createReview({
        enterpriseId,
        rating: rating > 0 ? rating : undefined,
        comment: content.trim() || undefined,
        images: files.length > 0 ? files : undefined,
      })

      showToast('Review submitted successfully!', 'success')
      setRating(0)
      setHover(0)
      setContent('')
      setFiles([])
      onReviewSubmitted()
    } catch (error) {
      console.error('Error submitting review:', error)
      showToast(
        error instanceof Error ? error.message : 'Failed to submit review. Please try again.',
        'error'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = (rating > 0 || content.trim().length > 0 || files.length > 0) && !isSubmitting

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-600">Your rating:</span>
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1
            const active = (hover || rating) >= value
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(value)}
                className={`text-2xl leading-none ${active ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </button>
            )
          })}
        </div>
      </div>

      <textarea
        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your experience..."
      />

      <div className="mt-3">
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input type="file" accept="image/*" multiple onChange={onPickImages} className="hidden" />
          <span className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Attach images</span>
          <span className="text-xs text-gray-500">Up to 6 images</span>
        </label>
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-3">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <Image src={src} alt={`attachment-${i}`} width={200} height={200} className="h-20 w-full object-cover rounded-lg border border-gray-200" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full h-6 w-6 text-xs shadow hidden group-hover:block"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Button 
          disabled={!canSubmit} 
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50" 
          onClick={submit}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}

interface ReviewsListProps {
  reviews: Review[]
  sortBy: 'newest' | 'oldest'
  onSortChange: (sort: 'newest' | 'oldest') => void
}

function ReviewsList({ reviews, sortBy, onSortChange }: ReviewsListProps) {
  const INITIAL_DISPLAY = 3 // Hiển thị ít nhất 3 reviews ban đầu
  const LOAD_MORE_COUNT = 5 // Mỗi lần load thêm 5 reviews
  
  // Nếu có ít hơn 3 reviews, hiển thị tất cả; nếu không, hiển thị ít nhất 3
  const initialCount = Math.min(INITIAL_DISPLAY, reviews.length)
  const [displayCount, setDisplayCount] = React.useState<number>(initialCount)
  
  // Track previous values để detect changes
  const prevSortByRef = React.useRef<string>(sortBy)
  const prevReviewsLengthRef = React.useRef<number>(reviews.length)
  
  // Reset displayCount khi reviews.length hoặc sortBy thay đổi
  // Sử dụng refs để track changes và đảm bảo dependency array luôn ổn định
  React.useEffect(() => {
    const newInitialCount = Math.min(INITIAL_DISPLAY, reviews.length)
    const sortChanged = prevSortByRef.current !== sortBy
    const reviewsLengthChanged = prevReviewsLengthRef.current !== reviews.length
    
    if (sortChanged || reviewsLengthChanged) {
      prevSortByRef.current = sortBy
      prevReviewsLengthRef.current = reviews.length
      setDisplayCount(newInitialCount)
    }
  }, [reviews.length, sortBy])
  
  const visible = reviews.slice(0, displayCount)
  const hasMore = reviews.length > displayCount

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  }

  return (
    <div>
      {/* Sort Filter */}
      {reviews.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {visible.map(r => (
              <div key={r.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${r.author && r.author !== 'Anonymous' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    {(r.author || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{r.author || 'Anonymous'}</p>
                      <div className="flex gap-1 text-yellow-400" aria-label={`${r.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < r.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      {r.createdAt && (
                        <span className="text-xs text-gray-500 ml-auto">{formatDate(r.createdAt)}</span>
                      )}
                    </div>
                    {r.content && (
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{r.content}</p>
                    )}
                    {r.images && r.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                        {r.images.map((src, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <Image 
                              src={src} 
                              alt={`Review image ${idx + 1}`} 
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 33vw, 16vw"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                className="text-sm px-6 py-2.5 rounded-full border border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-colors font-medium"
                onClick={() => setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, reviews.length))}
              >
                Load more reviews ({reviews.length - displayCount} remaining)
              </button>
            </div>
          )}
          {displayCount > INITIAL_DISPLAY && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="text-sm px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                onClick={() => setDisplayCount(INITIAL_DISPLAY)}
              >
                Show less
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface ReviewsSectionProps {
  enterpriseId: string
  rating: number
  reviews: Review[]
  sortBy?: 'newest' | 'oldest'
  onSortChange?: (sort: 'newest' | 'oldest') => void
  onReviewsUpdate?: () => void
}

export default function ReviewsSection({ 
  enterpriseId, 
  rating, 
  reviews, 
  sortBy = 'newest',
  onSortChange,
  onReviewsUpdate 
}: ReviewsSectionProps) {
  const { t } = useTranslations()
  
  const handleReviewSubmitted = () => {
    if (onReviewsUpdate) {
      onReviewsUpdate()
    }
  }

  const handleSortChange = (sort: 'newest' | 'oldest') => {
    if (onSortChange) {
      onSortChange(sort)
    }
  }

  return (
    <div id="reviews" className="mt-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Ratings & Reviews</h2>
        <Badge variant="secondary" className="text-sm">Community feedback</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-5xl font-bold text-gray-900">{rating.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">{t('reviews.outOf5')}</p>
          <div className="flex gap-1 mt-3" aria-label="overall rating">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
            ))}
          </div>
          {reviews.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">{reviews.length} {reviews.length === 1 ? t('reviews.review') : t('reviews.reviews')}</p>
          )}
        </div>
        <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-900 mb-3">Write a review</p>
          <ReviewComposer enterpriseId={enterpriseId} onReviewSubmitted={handleReviewSubmitted} />
        </div>
      </div>

      <ReviewsList reviews={reviews} sortBy={sortBy} onSortChange={handleSortChange} />
    </div>
  )
}


