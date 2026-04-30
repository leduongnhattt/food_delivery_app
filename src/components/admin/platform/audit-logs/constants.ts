export const MODULE_OPTIONS = ["All Modules"] as const
export const ACTION_OPTIONS = ["All Actions"] as const
export const ROW_STATUS_OPTIONS = ["All Statuses", "Success", "Failure"] as const
export const USER_OPTIONS = ["All Users"] as const
export const ROLE_OPTIONS = ["All Roles"] as const

export const PAGE_SIZE_OPTIONS = [12, 20, 50] as const

export const RANGE_FILTER_OPTIONS = [
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "today", label: "Today" },
  { value: "custom", label: "Custom" },
] as const

