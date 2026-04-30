"use client"

import { useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useAdminSearchInput } from "@/hooks/admin-hooks"

export default function VoucherSearch({
  currentStatus,
  currentSearch,
}: {
  currentStatus: string
  currentSearch: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const applySearch = useCallback(
    (q: string) => {
      const p = new URLSearchParams(params.toString())
      p.set("status", currentStatus)
      p.set("page", "1")
      if (q) {
        p.set("q", q)
      } else {
        p.delete("q")
      }
      startTransition(() => {
        router.replace(`/admin/vouchers?${p.toString()}`, { scroll: false })
      })
    },
    [params, currentStatus, router, startTransition],
  )

  const { value: searchValue, onChange: handleInputChange } = useAdminSearchInput(
    currentSearch,
    applySearch,
  )

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          placeholder="Search code or enterprise"
          className="w-full h-8 min-h-8 py-0 border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 gap-2 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ps-10 text-[13px] leading-normal ring-slate-200 bg-white"
          disabled={isPending}
          aria-label="Search vouchers"
        />
      </div>
    </div>
  )
}

