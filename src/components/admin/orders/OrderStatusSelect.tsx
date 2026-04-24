"use client"

import React, { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminFilterMenu, type AdminFilterOption } from "@/components/admin/shared/AdminFilterMenu"
import { ORDER_STATUS_OPTIONS, type OrderStatusKey } from "./order-status"

export default function OrderStatusSelect({
  current,
  onStatusChange,
}: {
  current: string
  onStatusChange?: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const currentValue = useMemo<OrderStatusKey>(() => {
    const found = ORDER_STATUS_OPTIONS.some((x) => x.key === current)
    return (found ? current : "all") as OrderStatusKey
  }, [current])

  const options = useMemo<AdminFilterOption[]>(
    () => ORDER_STATUS_OPTIONS.map((x) => ({ value: x.key, label: x.label })),
    [],
  )

  const handleChange = (next: string) => {
    const nextStatus = next as OrderStatusKey
    if (nextStatus === currentValue) return

    const params = new URLSearchParams(searchParams.toString())
    if (nextStatus === "all") params.delete("status")
    else params.set("status", nextStatus)

    // reset cursor on status change
    params.delete("cursor")

    router.replace(`/admin/orders?${params.toString()}`, { scroll: false })
    onStatusChange?.()
  }

  return (
    <div className="w-full min-w-0">
      <AdminFilterMenu
        menuId="orderStatus"
        ariaLabel="Order status"
        value={currentValue}
        options={options}
        onChange={handleChange}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
      />
    </div>
  )
}

