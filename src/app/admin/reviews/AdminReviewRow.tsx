"use client"

import { useState, useTransition } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { patchAdminReview } from '@/services/review.service'
import type { AdminReviewRowModel } from '@/types/admin-api.types'

export default function AdminReviewRow({
  review,
  onPatched,
}: {
  review: AdminReviewRowModel
  /** Refetch list when parent loads data from API (client pages). */
  onPatched?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [isHidden, setIsHidden] = useState(review.IsHidden)

  const handleToggleVisibility = async () => {
    const newIsHidden = !isHidden

    setIsHidden(newIsHidden)

    try {
      await patchAdminReview(review.ReviewID, newIsHidden)

      startTransition(() => {
        onPatched?.()
      })
    } catch (error) {
      setIsHidden(!newIsHidden)
      const message = error instanceof Error ? error.message : 'Failed to update review'
      alert(message)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const customerName = review.customer?.account?.Username || 'Anonymous'
  const enterpriseName = review.enterprise?.EnterpriseName || 'Unknown'
  const rating = review.Rating || 0
  const comment = review.Comment || ''
  const images = (review.Images && Array.isArray(review.Images) ? review.Images : []) as string[]

  return (
    <tr className="hover:bg-slate-50">
      <td className="py-3 pr-4">
        <div>
          <p className="text-[13px] leading-4 font-medium text-slate-900">{customerName}</p>
          {review.customer?.account?.Email && (
            <p className="text-xs leading-4 font-normal text-slate-500">
              {review.customer.account.Email}
            </p>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
        {enterpriseName}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span 
              key={i} 
              className={`text-[13px] leading-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
          <span className="ml-1 text-[13px] leading-4 font-normal text-slate-600">{rating}</span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="max-w-xs">
          <p className="text-[13px] leading-4 font-normal text-slate-700 truncate">
            {comment || 'No comment'}
          </p>
          {images.length > 0 && (
            <p className="text-xs leading-4 font-normal text-slate-500 mt-1">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-slate-700 text-xs leading-4 font-normal">
        {formatDate(review.CreatedAt)}
      </td>
      <td className="py-3 pr-4">
        {isHidden ? (
          <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200">
            Hidden
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        )}
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={handleToggleVisibility}
          disabled={isPending}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            isHidden
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isHidden ? 'Show review' : 'Hide review'}
        >
          {isPending ? (
            <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : isHidden ? (
            <>
              <Eye className="w-3 h-3" />
              Show
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              Hide
            </>
          )}
        </button>
      </td>
    </tr>
  )
}

