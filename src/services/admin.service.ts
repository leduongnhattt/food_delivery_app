/**
 * HTTP helpers for the admin UI.
 *
 * Most calls target the Nest API base from {@link getServerApiBase} (`NEXT_PUBLIC_API_URL`).
 * Food categories now call the Nest API directly.
 */

import { buildAuthHeader, refreshAccessToken } from '@/lib/auth-helpers'
import {
  buildQueryString,
  getServerApiBase,
  requestJson,
} from '@/lib/http'
import type {
  AdminAuditLogsListResponse,
  AdminAuditLogsOptionsResponse,
  AdminCustomersListResponse,
  AdminEnterprisesListResponse,
  AdminEnterpriseDetailResponse,
  AdminEnterpriseInvitationDetailResponse,
  AdminDashboardSummaryResponse,
  AdminProfileResponse,
  CreateAdminVoucherPayload,
  CreateAdminVoucherResponse,
  UpdateAdminVoucherPayload,
  UpdateAdminVoucherResponse,
  CreateEnterpriseApiResponse,
  AdminVouchersListResponse,
  AdminVoucherDetailResponse,
  AdminCommissionFeesGlobalResponse,
  AdminCommissionFeeGlobalRuleItem,
  AdminCommissionFeeGlobalRulesListResponse,
  AdminCommissionFeeCategoryRuleItem,
  AdminCommissionFeeCategoryRulesListResponse,
  FoodCategoriesListResponse,
  AdminTransactionFeesGlobalResponse,
  AdminTransactionFeeGlobalRuleItem,
  AdminTransactionFeeGlobalRulesListResponse,
  AdminTransactionFeeChannelRuleItem,
  AdminTransactionFeeChannelRulesListResponse,
} from '@/types/admin-api.types'

/** Body for `POST` enterprise onboarding on Nest. */
export type CreateEnterprisePayload = {
  username: string
  email: string
  password: string
  enterpriseName: string
  phoneNumber: string
  address: string
  latitude: number
  longitude: number
  openHours: string
  closeHours: string
  description?: string
}

/** Body for creating a category via the Next.js API route. */
export type CreateCategoryPayload = {
  categoryName: string
  description?: string
}

export type ListAdminCustomersParams = {
  status?: string
  search?: string
  limit?: number
  cursor?: string
}

export type ListAdminEnterprisesParams = {
  status?: string
  search?: string
}

export type InviteEnterprisePayload = {
  email: string
  phoneNumber: string
  enterpriseNameDraft?: string
}

export type AdminEnterpriseInvitationListItem = {
  InvitationID: string
  AccountID: string
  Email: string
  PhoneNumber: string
  EnterpriseNameDraft: string | null
  ExpiresAt: string
  Status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked'
  AcceptedAt: string | null
  CreatedAt: string
  hasActivationLinkClick?: boolean
}

export type AdminEnterpriseInvitationsListResponse = {
  items: AdminEnterpriseInvitationListItem[]
}

export type AdminInvitationTemplateValue = {
  subject: string
  html: string
  text?: string
}

type LockSuccessResponse = { success: boolean }

function nestApiBase(): string {
  return getServerApiBase().replace(/\/$/, '')
}

function urlAdminCustomers(): string {
  return `${nestApiBase()}/admin/customers`
}

function urlAdminEnterprises(): string {
  return `${nestApiBase()}/admin/enterprises`
}

function urlAdminEnterpriseInvitations(): string {
  return `${nestApiBase()}/admin/enterprise-invitations`
}

function urlAdminVouchers(): string {
  return `${nestApiBase()}/admin/vouchers`
}

function urlAdminDashboardSummary(): string {
  return `${nestApiBase()}/admin/dashboard/summary`
}

function urlAdminAuditLogs(): string {
  return `${nestApiBase()}/admin/audit-logs`
}

function urlAdminCommissionFees(): string {
  return `${nestApiBase()}/admin/finance/commission-fees`
}

function urlAdminTransactionFees(): string {
  return `${nestApiBase()}/admin/finance/transaction-fees`
}

/** Normalizes `HeadersInit` so `buildAuthHeader` can merge Bearer tokens. */
function toHeaderRecord(h: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!h) return out
  if (h instanceof Headers) {
    h.forEach((v, k) => {
      out[k] = v
    })
    return out
  }
  if (Array.isArray(h)) {
    for (const [k, v] of h) out[k] = v
    return out
  }
  return { ...out, ...h }
}

function urlCategories(): string {
  return `${nestApiBase()}/categories`
}

/**
 * @param params Optional `status` (`all` | `active` | `locked`), search, pagination.
 */
export async function listAdminCustomers(
  params: ListAdminCustomersParams,
): Promise<AdminCustomersListResponse> {
  const qs = buildQueryString({
    status: params.status,
    search: params.search,
    limit: params.limit,
    cursor: params.cursor,
  })
  const url = qs ? `${urlAdminCustomers()}?${qs}` : urlAdminCustomers()
  return requestJson<AdminCustomersListResponse>(url, { method: 'GET' })
}

/** @param customerId `CustomerID` from the list payload. */
export async function lockAdminCustomer(
  customerId: string,
): Promise<LockSuccessResponse> {
  return requestJson<LockSuccessResponse>(
    `${urlAdminCustomers()}/${encodeURIComponent(customerId)}/lock`,
    { method: 'POST' },
  )
}

/** @param customerId `CustomerID` from the list payload. */
export async function unlockAdminCustomer(
  customerId: string,
): Promise<LockSuccessResponse> {
  return requestJson<LockSuccessResponse>(
    `${urlAdminCustomers()}/${encodeURIComponent(customerId)}/unlock`,
    { method: 'POST' },
  )
}

/**
 * @param params Optional `status` (`all` | `active` | `locked`) and search string.
 */
export async function listAdminEnterprises(
  params: ListAdminEnterprisesParams,
): Promise<AdminEnterprisesListResponse> {
  const qs = buildQueryString({
    status: params.status,
    search: params.search,
  })
  const url = qs ? `${urlAdminEnterprises()}?${qs}` : urlAdminEnterprises()
  return requestJson<AdminEnterprisesListResponse>(url, { method: 'GET' })
}

export async function getAdminEnterpriseDetail(
  enterpriseId: string,
): Promise<AdminEnterpriseDetailResponse> {
  return requestJson<AdminEnterpriseDetailResponse>(
    `${urlAdminEnterprises()}/${encodeURIComponent(enterpriseId)}`,
    { method: 'GET' },
  )
}

/** PATCH `/admin/enterprises/:enterpriseId` — basic profile fields admin may edit. */
export type UpdateAdminEnterprisePayload = {
  enterpriseName: string
  phoneNumber: string
  address: string
  contactEmail: string
  accountStatus: 'Active' | 'Inactive'
}

export async function updateAdminEnterprise(
  enterpriseId: string,
  payload: UpdateAdminEnterprisePayload,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminEnterprises()}/${encodeURIComponent(enterpriseId)}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export async function createEnterprise(
  payload: CreateEnterprisePayload,
): Promise<CreateEnterpriseApiResponse> {
  return requestJson<CreateEnterpriseApiResponse>(urlAdminEnterprises(), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * @param accountId `AccountID` on the enterprise’s linked account (not `EnterpriseID`).
 */
export async function lockAdminEnterpriseAccount(
  accountId: string,
): Promise<LockSuccessResponse> {
  return requestJson<LockSuccessResponse>(
    `${urlAdminEnterprises()}/${encodeURIComponent(accountId)}/lock`,
    { method: 'POST' },
  )
}

/**
 * @param accountId `AccountID` on the enterprise’s linked account (not `EnterpriseID`).
 */
export async function unlockAdminEnterpriseAccount(
  accountId: string,
): Promise<LockSuccessResponse> {
  return requestJson<LockSuccessResponse>(
    `${urlAdminEnterprises()}/${encodeURIComponent(accountId)}/unlock`,
    { method: 'POST' },
  )
}

/** DELETE `/admin/enterprises/:enterpriseId` — soft delete (`DeletedAt`, deactivate account). */
export async function softDeleteAdminEnterprise(
  enterpriseId: string,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminEnterprises()}/${encodeURIComponent(enterpriseId)}`,
    { method: 'DELETE' },
  )
}

export async function listAdminEnterpriseInvitations(params: {
  status?: string
  search?: string
}): Promise<AdminEnterpriseInvitationsListResponse> {
  const qs = buildQueryString({ status: params.status, search: params.search })
  const url = qs
    ? `${urlAdminEnterpriseInvitations()}?${qs}`
    : urlAdminEnterpriseInvitations()
  return requestJson<AdminEnterpriseInvitationsListResponse>(url, { method: 'GET' })
}

export async function getAdminEnterpriseInvitationDetail(
  invitationId: string,
): Promise<AdminEnterpriseInvitationDetailResponse> {
  return requestJson<AdminEnterpriseInvitationDetailResponse>(
    `${urlAdminEnterpriseInvitations()}/${encodeURIComponent(invitationId)}`,
    { method: 'GET' },
  )
}

export async function inviteEnterprise(
  payload: InviteEnterprisePayload,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(urlAdminEnterpriseInvitations(), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function resendEnterpriseInvitation(
  invitationId: string,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminEnterpriseInvitations()}/${encodeURIComponent(invitationId)}/resend`,
    { method: 'POST' },
  )
}

export async function revokeEnterpriseInvitation(
  invitationId: string,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminEnterpriseInvitations()}/${encodeURIComponent(invitationId)}/revoke`,
    { method: 'POST' },
  )
}

export async function getEnterpriseInvitationTemplate(): Promise<{ template: AdminInvitationTemplateValue }> {
  return requestJson<{ template: AdminInvitationTemplateValue }>(
    `${urlAdminEnterpriseInvitations()}/template`,
    { method: 'GET' },
  )
}

export async function listAdminAuditLogs(params: {
  search?: string
  user?: string
  role?: string
  module?: string
  action?: string
  status?: string
  range?: string
  from?: string
  to?: string
  page?: number
  limit?: number
  order?: 'asc' | 'desc'
}): Promise<AdminAuditLogsListResponse> {
  const qs = buildQueryString({
    search: params.search,
    user: params.user,
    role: params.role,
    module: params.module,
    action: params.action,
    status: params.status,
    range: params.range,
    from: params.from,
    to: params.to,
    page: params.page,
    limit: params.limit,
    order: params.order,
  })
  const url = qs ? `${urlAdminAuditLogs()}?${qs}` : urlAdminAuditLogs()
  return requestJson<AdminAuditLogsListResponse>(url, { method: 'GET' })
}

export async function getAdminAuditLogsOptions(): Promise<AdminAuditLogsOptionsResponse> {
  return requestJson<AdminAuditLogsOptionsResponse>(`${urlAdminAuditLogs()}/options`, {
    method: 'GET',
  })
}

export async function exportAdminAuditLogsCsv(params: {
  search?: string
  user?: string
  role?: string
  module?: string
  action?: string
  status?: string
  range?: string
  from?: string
  to?: string
  order?: 'asc' | 'desc'
}): Promise<Blob> {
  const qs = buildQueryString({
    search: params.search,
    user: params.user,
    role: params.role,
    module: params.module,
    action: params.action,
    status: params.status,
    range: params.range,
    from: params.from,
    to: params.to,
    order: params.order,
  })
  const url = qs ? `${urlAdminAuditLogs()}/export?${qs}` : `${urlAdminAuditLogs()}/export`

  const build = (): RequestInit => {
    const headers = {
      ...toHeaderRecord(undefined),
      ...buildAuthHeader(),
      Accept: 'text/csv',
    }
    return { method: 'GET', headers, credentials: 'include' }
  }

  let res = await fetch(url, build())
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      res = await fetch(url, build())
    }
  }
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const data = await res.json()
      if (typeof data?.message === 'string' && data.message.trim()) message = data.message
    } catch {}
    throw new Error(message)
  }
  return res.blob()
}

export async function updateEnterpriseInvitationTemplate(
  template: AdminInvitationTemplateValue,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminEnterpriseInvitations()}/template`,
    { method: 'PUT', body: JSON.stringify(template) },
  )
}

/** Current admin’s profile (requires JWT with Admin role). */
export async function fetchAdminProfile(): Promise<AdminProfileResponse> {
  return requestJson<AdminProfileResponse>(
    `${nestApiBase()}/admin/profile`,
    { method: 'GET' },
  )
}

export async function createAdminVoucher(
  payload: CreateAdminVoucherPayload,
): Promise<CreateAdminVoucherResponse> {
  return requestJson<CreateAdminVoucherResponse>(
    `${nestApiBase()}/admin/voucher`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export async function updateAdminVoucher(
  voucherId: string,
  payload: UpdateAdminVoucherPayload,
): Promise<UpdateAdminVoucherResponse> {
  return requestJson<UpdateAdminVoucherResponse>(
    `${urlAdminVouchers()}/${encodeURIComponent(voucherId)}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export async function listAdminVouchers(params: {
  status?: 'all' | 'pending' | 'approved' | 'rejected' | 'expired'
  q?: string
  page?: number
  limit?: number
  range?: string
}): Promise<AdminVouchersListResponse> {
  const qs = buildQueryString({
    status: params.status,
    q: params.q,
    page: params.page,
    limit: params.limit,
    range: params.range,
  })
  const url = qs ? `${urlAdminVouchers()}?${qs}` : urlAdminVouchers()
  return requestJson<AdminVouchersListResponse>(url, { method: 'GET' })
}

export async function getAdminVoucherDetail(voucherId: string): Promise<AdminVoucherDetailResponse> {
  return requestJson<AdminVoucherDetailResponse>(
    `${urlAdminVouchers()}/${encodeURIComponent(voucherId)}`,
    { method: 'GET' },
  )
}

export async function approveAdminVoucher(voucherId: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminVouchers()}/${encodeURIComponent(voucherId)}/approve`,
    { method: 'PATCH' },
  )
}

export async function rejectAdminVoucher(voucherId: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminVouchers()}/${encodeURIComponent(voucherId)}/reject`,
    { method: 'PATCH' },
  )
}

export async function fetchAdminDashboardSummary(params: {
  range?: string
}): Promise<AdminDashboardSummaryResponse> {
  const qs = buildQueryString({ range: params.range })
  const url = qs ? `${urlAdminDashboardSummary()}?${qs}` : urlAdminDashboardSummary()
  return requestJson<AdminDashboardSummaryResponse>(url, { method: 'GET' })
}

export async function getCommissionFeesGlobal(): Promise<AdminCommissionFeesGlobalResponse> {
  return requestJson<AdminCommissionFeesGlobalResponse>(
    `${urlAdminCommissionFees()}/global`,
    { method: 'GET' },
  )
}

export async function listCommissionFeeGlobalRules(): Promise<AdminCommissionFeeGlobalRulesListResponse> {
  return requestJson<AdminCommissionFeeGlobalRulesListResponse>(
    `${urlAdminCommissionFees()}/global-rules`,
    { method: 'GET' },
  )
}

export async function getCommissionFeeGlobalRule(ruleId: string): Promise<{
  success: boolean
  item: AdminCommissionFeeGlobalRuleItem
}> {
  return requestJson<{ success: boolean; item: AdminCommissionFeeGlobalRuleItem }>(
    `${urlAdminCommissionFees()}/global-rules/${encodeURIComponent(ruleId)}`,
    { method: 'GET' },
  )
}

export async function activateCommissionFeeGlobalRule(
  ruleId: string,
): Promise<{ success: boolean; item: AdminCommissionFeeGlobalRuleItem }> {
  return requestJson<{ success: boolean; item: AdminCommissionFeeGlobalRuleItem }>(
    `${urlAdminCommissionFees()}/global-rules/${encodeURIComponent(ruleId)}/activate`,
    { method: 'PATCH' },
  )
}

export async function updateCommissionFeeGlobalRule(
  ruleId: string,
  payload: {
    ruleName?: string | null
    commissionPercent?: number
    isActive?: boolean
    effectiveFrom?: string
    effectiveTo?: string | null
  },
): Promise<{ success: boolean; item: AdminCommissionFeeGlobalRuleItem }> {
  return requestJson<{ success: boolean; item: AdminCommissionFeeGlobalRuleItem }>(
    `${urlAdminCommissionFees()}/global-rules/${encodeURIComponent(ruleId)}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export async function updateCommissionFeesGlobal(payload: {
  ruleName?: string | null
  commissionPercent: number
  isActive?: boolean
  effectiveFrom?: string
  effectiveTo?: string | null
}): Promise<{ success: boolean; DefaultID: string; CommissionPercent: number }> {
  return requestJson(`${urlAdminCommissionFees()}/global`, {
    method: 'PATCH',
    body: JSON.stringify({
      ruleName: payload.ruleName ?? undefined,
      commissionPercent: payload.commissionPercent,
      isActive: payload.isActive,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo,
    }),
  })
}

export type ListCommissionFeeCategoryRulesParams = {
  page?: number
  pageSize?: number
  search?: string
  foodCategoryId?: string
  status?: 'Pending' | 'Active' | 'Inactive' | 'Expired'
  isActive?: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

export async function listCommissionFeeCategoryRules(
  params: ListCommissionFeeCategoryRulesParams,
): Promise<AdminCommissionFeeCategoryRulesListResponse> {
  const qs = buildQueryString({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    foodCategoryId: params.foodCategoryId,
    status: params.status,
    isActive:
      params.isActive === undefined
        ? undefined
        : params.isActive
          ? 'true'
          : 'false',
    effectiveFrom: params.effectiveFrom,
    effectiveTo: params.effectiveTo,
  })
  const url = qs
    ? `${urlAdminCommissionFees()}/category-rules?${qs}`
    : `${urlAdminCommissionFees()}/category-rules`
  return requestJson<AdminCommissionFeeCategoryRulesListResponse>(url, {
    method: 'GET',
  })
}

export async function getCommissionFeeCategoryRule(
  commissionDefaultId: string,
): Promise<AdminCommissionFeeCategoryRuleItem> {
  return requestJson(
    `${urlAdminCommissionFees()}/category-rules/${encodeURIComponent(commissionDefaultId)}`,
    { method: 'GET' },
  )
}

export async function createCommissionFeeCategoryRule(payload: {
  foodCategoryId: string
  ruleName?: string | null
  commissionPercent: number
  isActive?: boolean
  effectiveFrom: string
  effectiveTo?: string | null
}): Promise<{ success: boolean; item: AdminCommissionFeeCategoryRuleItem }> {
  return requestJson(`${urlAdminCommissionFees()}/category-rules`, {
    method: 'POST',
    body: JSON.stringify({
      foodCategoryId: payload.foodCategoryId,
      ruleName: payload.ruleName ?? undefined,
      commissionPercent: payload.commissionPercent,
      isActive: payload.isActive,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo ?? undefined,
    }),
  })
}

export async function updateCommissionFeeCategoryRule(
  commissionDefaultId: string,
  payload: {
    foodCategoryId?: string
    ruleName?: string | null
    commissionPercent?: number
    isActive?: boolean
    effectiveFrom?: string
    effectiveTo?: string | null
  },
): Promise<{ success: boolean; item: AdminCommissionFeeCategoryRuleItem }> {
  return requestJson(
    `${urlAdminCommissionFees()}/category-rules/${encodeURIComponent(commissionDefaultId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export async function getTransactionFeesGlobal(): Promise<AdminTransactionFeesGlobalResponse> {
  return requestJson<AdminTransactionFeesGlobalResponse>(
    `${urlAdminTransactionFees()}/global`,
    { method: 'GET' },
  )
}

export async function listTransactionFeeGlobalRules(): Promise<AdminTransactionFeeGlobalRulesListResponse> {
  return requestJson<AdminTransactionFeeGlobalRulesListResponse>(
    `${urlAdminTransactionFees()}/global-rules`,
    { method: 'GET' },
  )
}

export async function getTransactionFeeGlobalRule(ruleId: string): Promise<{
  success: boolean
  item: AdminTransactionFeeGlobalRuleItem
}> {
  return requestJson<{ success: boolean; item: AdminTransactionFeeGlobalRuleItem }>(
    `${urlAdminTransactionFees()}/global-rules/${encodeURIComponent(ruleId)}`,
    { method: 'GET' },
  )
}

export async function activateTransactionFeeGlobalRule(
  ruleId: string,
): Promise<{ success: boolean; item: AdminTransactionFeeGlobalRuleItem }> {
  return requestJson<{ success: boolean; item: AdminTransactionFeeGlobalRuleItem }>(
    `${urlAdminTransactionFees()}/global-rules/${encodeURIComponent(ruleId)}/activate`,
    { method: 'PATCH' },
  )
}

export async function updateTransactionFeeGlobalRule(
  ruleId: string,
  payload: {
    ruleName?: string | null
    ratePercent?: number
    isActive?: boolean
    effectiveFrom?: string
    effectiveTo?: string | null
  },
): Promise<{ success: boolean; item: AdminTransactionFeeGlobalRuleItem }> {
  return requestJson<{ success: boolean; item: AdminTransactionFeeGlobalRuleItem }>(
    `${urlAdminTransactionFees()}/global-rules/${encodeURIComponent(ruleId)}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export async function updateTransactionFeesGlobal(payload: {
  ruleName?: string | null
  ratePercent?: number
  isActive?: boolean
  effectiveFrom?: string
  effectiveTo?: string | null
}): Promise<{ success: boolean; DefaultID: string; RatePercent: number }> {
  return requestJson(`${urlAdminTransactionFees()}/global`, {
    method: 'PATCH',
    body: JSON.stringify({
      ruleName: payload.ruleName ?? undefined,
      ratePercent: payload.ratePercent,
      isActive: payload.isActive,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo,
    }),
  })
}

export type ListTransactionFeeChannelRulesParams = {
  page?: number
  pageSize?: number
  search?: string
  /** Cash | CreditCard | Stripe | MoMo | VNPay | BankTransfer */
  paymentChannel?: string
  status?: 'Pending' | 'Active' | 'Inactive' | 'Expired'
  isActive?: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

export async function listTransactionFeeChannelRules(
  params: ListTransactionFeeChannelRulesParams,
): Promise<AdminTransactionFeeChannelRulesListResponse> {
  const qs = buildQueryString({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    paymentChannel: params.paymentChannel,
    status: params.status,
    isActive:
      params.isActive === undefined
        ? undefined
        : params.isActive
          ? 'true'
          : 'false',
    effectiveFrom: params.effectiveFrom,
    effectiveTo: params.effectiveTo,
  })
  const url = qs
    ? `${urlAdminTransactionFees()}/channel-rules?${qs}`
    : `${urlAdminTransactionFees()}/channel-rules`
  return requestJson<AdminTransactionFeeChannelRulesListResponse>(url, {
    method: 'GET',
  })
}

export async function getTransactionFeeChannelRule(
  feeId: string,
): Promise<AdminTransactionFeeChannelRuleItem> {
  return requestJson(
    `${urlAdminTransactionFees()}/channel-rules/${encodeURIComponent(feeId)}`,
    { method: 'GET' },
  )
}

export async function createTransactionFeeChannelRule(payload: {
  paymentChannel: string
  feeName: string
  ratePercent: number
  isActive?: boolean
  effectiveFrom: string
  effectiveTo?: string | null
}): Promise<{ success: boolean; item: AdminTransactionFeeChannelRuleItem }> {
  return requestJson(`${urlAdminTransactionFees()}/channel-rules`, {
    method: 'POST',
    body: JSON.stringify({
      paymentChannel: payload.paymentChannel,
      feeName: payload.feeName,
      ratePercent: payload.ratePercent,
      isActive: payload.isActive,
      effectiveFrom: payload.effectiveFrom,
      effectiveTo: payload.effectiveTo ?? undefined,
    }),
  })
}

export async function updateTransactionFeeChannelRule(
  feeId: string,
  payload: {
    paymentChannel?: string
    feeName?: string
    ratePercent?: number
    isActive?: boolean
    effectiveFrom?: string
    effectiveTo?: string | null
  },
): Promise<{ success: boolean; item: AdminTransactionFeeChannelRuleItem }> {
  return requestJson(
    `${urlAdminTransactionFees()}/channel-rules/${encodeURIComponent(feeId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export async function fetchFoodCategoriesList(): Promise<FoodCategoriesListResponse> {
  return requestJson<FoodCategoriesListResponse>(urlCategories(), {
    method: 'GET',
  })
}

/**
 * @returns Raw `Response`; caller should check `ok` and parse JSON.
 */
export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<Response> {
  const build = (): RequestInit => {
    const headers = toHeaderRecord(undefined)
    return {
      method: 'POST',
      headers: { ...headers, ...buildAuthHeader() },
      credentials: 'include',
      body: JSON.stringify(payload),
    }
  }

  let res = await fetch(urlCategories(), build())
  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      res = await fetch(urlCategories(), build())
    }
  }
  return res
}

/**
 * @returns Raw `Response`; caller should check `ok` and parse JSON.
 */
export async function getAllCategories(): Promise<Response> {
  const headers = { ...toHeaderRecord(undefined), ...buildAuthHeader() }
  return fetch(urlCategories(), {
    method: 'GET',
    headers,
    credentials: 'include',
  })
}
