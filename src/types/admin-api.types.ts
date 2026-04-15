/** Shapes returned by Nest `/api/admin/*` (JSON). */

export type AdminAccountStatus = 'Active' | 'Inactive'

export type AdminCustomerListItem = {
  CustomerID: string
  FullName: string
  PhoneNumber: string
  account: {
    AccountID: string
    Email: string
    Status: AdminAccountStatus
    CreatedAt: string
  }
}

export type AdminCustomersListResponse = {
  items: AdminCustomerListItem[]
  nextCursor: string | null
}

export type AdminEnterpriseListItem = {
  EnterpriseID: string
  EnterpriseName: string
  PhoneNumber: string
  Address: string
  OpenHours: string
  CloseHours: string
  CreatedAt: string
  /** True when account is inactive and a pending invitation exists (onboarding). */
  hasPendingInvitation: boolean
  account: {
    AccountID: string
    Email: string
    Status: AdminAccountStatus
  }
}

export type AdminEnterprisesListResponse = {
  items: AdminEnterpriseListItem[]
}

export type AdminEnterpriseDetailLinkedProduct = {
  FoodID: string
  DishName: string
  Price: number | string
  IsAvailable: boolean
  ImageURL: string | null
  CategoryName: string | null
}

export type AdminEnterpriseDetailResponse = {
  enterprise: {
    EnterpriseID: string
    EnterpriseName: string
    PhoneNumber: string
    Address: string
    OpenHours: string
    CloseHours: string
    Description: string | null
    Latitude: unknown
    Longitude: unknown
    CreatedAt: string
    account: {
      AccountID: string
      Email: string
      Username: string
      Status: AdminAccountStatus
      CreatedAt: string
    }
  }
  business: {
    bankAccountMasked: string
    payoutMethod: string
  }
  stats: {
    totalProducts: number
    totalRevenue: number | string
    totalOrders: number
    totalReturns: number
    cancellationRatePercent: number
    satisfactionRatingAvg: number | null
    reviewCount: number
  }
  linkedProducts: AdminEnterpriseDetailLinkedProduct[]
  primaryCategoryName: string | null
  /** True when a pending enterprise invitation still exists for this account. */
  hasPendingInvitation: boolean
}

export type AdminEnterpriseInvitationStatus =
  | 'Pending'
  | 'Accepted'
  | 'Expired'
  | 'Revoked'

export type AdminEnterpriseInvitationDetailRow = {
  InvitationID: string
  AccountID: string
  Email: string
  PhoneNumber: string
  EnterpriseNameDraft: string | null
  ExpiresAt: string
  Status: AdminEnterpriseInvitationStatus
  AcceptedAt: string | null
  CreatedAt: string
}

export type AdminEnterpriseInvitationDetailTimelineItem = {
  title: string
  at: string
  by: string
}

export type AdminEnterpriseInvitationDetailResponse = {
  invitation: AdminEnterpriseInvitationDetailRow
  inviteLinkMasked: string
  sentByLabel: string
  timeline: AdminEnterpriseInvitationDetailTimelineItem[]
  quickStats: {
    emailOpens: number
    linkClicks: number
    daysSinceSent: number
    /** Calendar days from invitation sent time to first email-open pixel (null if never opened). */
    daysFromSentToFirstEmailOpen: number | null
  }
}

export type AdminProfileResponse = {
  username: string
  email: string
  avatar: string | null
}

export type CreateAdminVoucherPayload = {
  Code: string
  ExpiryDate: string
  DiscountPercent?: number | null
  DiscountAmount?: number | null
  MinOrderValue?: number | null
  MaxUsage?: number | null
}

export type CreateAdminVoucherResponse = {
  success: boolean
  voucher: Record<string, unknown>
}

export type CreateEnterpriseApiResponse = {
  success: boolean
  enterprise: Record<string, unknown>
}

export type AdminVoucherListItem = {
  id: string
  code: string
  discountPercent: number | null
  discountAmount: number | null
  status: string
  expiryDate: string | null
  maxUsage: number | null
  usedCount: number
  createdAt: string
  enterpriseName: string | null
}

export type AdminVouchersListResponse = {
  items: AdminVoucherListItem[]
}

export type AdminDashboardSummaryResponse = {
  activeEnterpriseCount: number
  customerCount: number
  categoriesCount: number
  pendingVouchersCount: number
  revenueInRange: number
  ordersCount: number
  revenueOrders: Array<{ orderDate: string; totalAmount: number }>
  pendingVouchersTop: AdminVoucherListItem[]
}

/** UI row model for the admin reviews table (mapped from Nest admin reviews API). */
export type AdminReviewRowModel = {
  ReviewID: string
  Rating: number | null
  Comment: string | null
  CreatedAt: Date
  UpdatedAt: Date | null
  Images: unknown
  IsHidden: boolean
  customer: {
    account: {
      Username: string | null
      Email: string | null
    } | null
  } | null
  enterprise: {
    EnterpriseID: string
    EnterpriseName: string
  } | null
}
