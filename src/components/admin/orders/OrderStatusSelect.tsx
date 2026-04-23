"use client"

import React, { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminFilterMenu, type AdminFilterOption } from "@/components/admin/shared/AdminFilterMenu"

const ORDER_STATUSES = [
  { key: "all", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Preparing", label: "Preparing" },
  { key: "ReadyForPickup", label: "Ready" },
  { key: "OutForDelivery", label: "Delivering" },
  { key: "Delivered", label: "Delivered" },
  { key: "Completed", label: "Completed" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "Refunded", label: "Refunded" },
] as const

type OrderStatusKey = (typeof ORDER_STATUSES)[number]["key"]

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
    const found = ORDER_STATUSES.some((x) => x.key === current)
    return (found ? current : "all") as OrderStatusKey
  }, [current])

  const options = useMemo<AdminFilterOption[]>(
    () => ORDER_STATUSES.map((x) => ({ value: x.key, label: x.label })),
    [],
  )

  const handleChange = (next: string) => {
    const nextStatus = next as OrderStatusKey
    if (nextStatus === currentValue) return

    const p = new URLSearchParams(searchParams.toString())
    if (nextStatus === "all") p.delete("status")
    else p.set("status", nextStatus)

    // reset cursor on status change
    p.delete("cursor")

    router.replace(`/admin/orders?${p.toString()}`, { scroll: false })
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

