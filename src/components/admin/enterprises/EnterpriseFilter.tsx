"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface Enterprise {
  EnterpriseID: string
  EnterpriseName: string
}

export default function EnterpriseFilter({ 
  enterprises, 
  currentEnterpriseId,
  currentStatus,
  currentSearch,
  currentStartDate,
  currentEndDate
}: { 
  enterprises: Enterprise[]
  currentEnterpriseId?: string
  currentStatus?: string
  currentSearch?: string
  currentStartDate?: string
  currentEndDate?: string
}) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const navigateWithEnterpriseId = (nextEnterpriseId: string) => {
    const nextQuery = new URLSearchParams(currentSearchParams.toString())
    if (currentStatus) nextQuery.set('status', currentStatus)
    if (currentSearch) nextQuery.set('q', currentSearch)
    else nextQuery.delete('q')
    if (currentStartDate) nextQuery.set('startDate', currentStartDate)
    else nextQuery.delete('startDate')
    if (currentEndDate) nextQuery.set('endDate', currentEndDate)
    else nextQuery.delete('endDate')
    if (nextEnterpriseId) {
      nextQuery.set('enterpriseId', nextEnterpriseId)
    } else {
      nextQuery.delete('enterpriseId')
    }
    startTransition(() => {
      router.replace(`/admin/reviews?${nextQuery.toString()}`, { scroll: false })
    })
  }

  const selectedEnterpriseLabel = useMemo(() => {
    if (!currentEnterpriseId) return 'All Restaurants'
    const match = enterprises.find(
      (enterprise) => enterprise.EnterpriseID === currentEnterpriseId,
    )
    return match?.EnterpriseName ?? 'All Restaurants'
  }, [currentEnterpriseId, enterprises])

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      if (!open) return
      const targetNode = event.target as Node | null
      if (!targetNode) return
      if (rootRef.current && !rootRef.current.contains(targetNode)) setOpen(false)
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        className="relative group inline-flex items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] py-2.5 px-3 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-200 pe-10 ring-slate-200 w-full shrink-0 sm:w-56"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="truncate">{selectedEnterpriseLabel}</span>
        <ChevronDown
          className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !isPending && (
        <div className="absolute right-0 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              navigateWithEnterpriseId('')
              setOpen(false)
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
          >
            <span>All Restaurants</span>
            {!currentEnterpriseId && <Check className="w-4 h-4 text-slate-700" />}
          </button>
          {enterprises.map((enterprise) => (
            <button
              key={enterprise.EnterpriseID}
              type="button"
              onClick={() => {
                navigateWithEnterpriseId(enterprise.EnterpriseID)
                setOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
            >
              <span className="truncate">{enterprise.EnterpriseName}</span>
              {currentEnterpriseId === enterprise.EnterpriseID && (
                <Check className="w-4 h-4 text-slate-700" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

