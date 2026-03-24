"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

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
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = new URLSearchParams(params.toString())
    if (currentStatus) p.set('status', currentStatus)
    if (currentSearch) p.set('q', currentSearch)
    else p.delete('q')
    if (currentStartDate) p.set('startDate', currentStartDate)
    else p.delete('startDate')
    if (currentEndDate) p.set('endDate', currentEndDate)
    else p.delete('endDate')
    if (e.target.value) {
      p.set('enterpriseId', e.target.value)
    } else {
      p.delete('enterpriseId')
    }
    startTransition(() => {
      router.replace(`/admin/reviews?${p.toString()}`, { scroll: false })
    })
  }

  return (
    <select
      value={currentEnterpriseId || ''}
      onChange={handleChange}
      disabled={isPending}
      className="text-sm border border-slate-200 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 disabled:opacity-50"
    >
      <option value="">All Restaurants</option>
      {enterprises.map(ent => (
        <option key={ent.EnterpriseID} value={ent.EnterpriseID}>
          {ent.EnterpriseName}
        </option>
      ))}
    </select>
  )
}

