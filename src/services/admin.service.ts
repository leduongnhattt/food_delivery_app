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
} from '@/lib/http-client'
import type {
  AdminCustomersListResponse,
  AdminEnterprisesListResponse,
  AdminEnterpriseDetailResponse,
  AdminEnterpriseInvitationDetailResponse,
  AdminDashboardSummaryResponse,
  AdminProfileResponse,
  CreateAdminVoucherPayload,
  CreateAdminVoucherResponse,
  CreateEnterpriseApiResponse,
  AdminVouchersListResponse,
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

export async function listAdminVouchers(params: {
  status?: 'all' | 'pending' | 'approved'
  q?: string
  limit?: number
}): Promise<AdminVouchersListResponse> {
  const qs = buildQueryString({
    status: params.status,
    q: params.q,
    limit: params.limit,
  })
  const url = qs ? `${urlAdminVouchers()}?${qs}` : urlAdminVouchers()
  return requestJson<AdminVouchersListResponse>(url, { method: 'GET' })
}

export async function approveAdminVoucher(voucherId: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminVouchers()}/${encodeURIComponent(voucherId)}/approve`,
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
