export const MODULE_OPTIONS = ["All Modules", "commission_fee", "service_fee", "orders", "customers"] as const
export const ACTION_OPTIONS = ["All Actions", "CREATE", "UPDATE", "DELETE"] as const
export const ROW_STATUS_OPTIONS = ["All Statuses", "Success", "Failed", "Pending"] as const
export const USER_OPTIONS = ["All Users", "admin@medusa-test.com", "system"] as const
export const ROLE_OPTIONS = ["All Roles", "admin", "system"] as const

export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const

export const RANGE_FILTER_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last 1 year" },
] as const

