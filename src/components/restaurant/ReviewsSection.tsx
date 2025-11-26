"use client"
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export type Review = {
  id: string
  author: string
  rating: number
  content: string
  images?: string[]
}

function ReviewComposer() {
  const [rating, setRating] = React.useState<number>(0)
  const [hover, setHover] = React.useState<number>(0)
  const [content, setContent] = React.useState<string>('')
  const [files, setFiles] = React.useState<File[]>([])
  const [previews, setPreviews] = React.useState<string[]>([])

  React.useEffect(() => {
    const next = files.map(f => URL.createObjectURL(f))
    setPreviews(next)
    return () => next.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    const accepted = Array.from(list).filter(f => f.type.startsWith('image/')).slice(0, 6)
    setFiles(prev => [...prev, ...accepted].slice(0, 6))
    e.target.value = ''
  }

  function removeImage(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  function submit() {
    console.log('submit review', { rating, content, files })
    setRating(0)
    setHover(0)
    setContent('')
    setFiles([])
  }

  const canSubmit = rating > 0 || content.trim().length > 0 || files.length > 0

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
        <Button disabled={!canSubmit} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50" onClick={submit}>Submit</Button>
      </div>
    </div>
  )
}

function ReviewsList({ reviews }: { reviews: Review[] }) {
  const [expanded, setExpanded] = React.useState<boolean>(false)
  const visible = expanded ? reviews : reviews.slice(0, 2)
  return (
    <div>
      <div className="space-y-5">
        {visible.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${r.author ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{(r.author || 'A').charAt(0).toUpperCase()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{r.author || 'Anonymous'}</p>
                  <div className="flex gap-1 text-yellow-400" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < r.rating ? '' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{r.content}</p>
                {r.images && r.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                    {r.images.map((src, idx) => (
                      <Image key={idx} src={src} alt="review" width={200} height={200} className="h-20 w-full object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {reviews.length > 2 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="text-sm px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? 'Show less' : `Show all (${reviews.length})`}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ReviewsSection({ rating, reviews }: { rating: number, reviews: Review[] }) {
  return (
    <div id="reviews" className="mt-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Ratings & Reviews</h2>
        <Badge variant="secondary" className="text-sm">Community feedback</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-5xl font-bold text-gray-900">{rating.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">out of 5</p>
          <div className="flex gap-1 mt-3" aria-label="overall rating">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-900 mb-3">Write a review</p>
          <ReviewComposer />
        </div>
      </div>

      <ReviewsList reviews={reviews} />
    </div>
  )
}


