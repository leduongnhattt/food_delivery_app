"use client"

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

export default function ActionButton({
  children,
  className,
  pendingText,
}: {
  children: React.ReactNode
  className?: string
  pendingText?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      aria-busy={pending}
      disabled={pending}
      className={cn(
        'relative h-8 px-3 text-xs rounded-md border transition-all duration-150 flex items-center justify-center gap-2',
        'border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed',
        pending && 'animate-pulse',
        className
      )}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          {pendingText || 'Processing...'}
        </span>
      ) : (
        children
      )}
    </button>
  )
}








