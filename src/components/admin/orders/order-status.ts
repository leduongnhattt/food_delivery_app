export const ORDER_STATUS_OPTIONS = [
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

export type OrderStatusKey = (typeof ORDER_STATUS_OPTIONS)[number]["key"]

