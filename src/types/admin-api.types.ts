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
  account: {
    AccountID: string
    Email: string
    Status: AdminAccountStatus
  }
}

export type AdminEnterprisesListResponse = {
  items: AdminEnterpriseListItem[]
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
