/**
 * Admin support tickets API (Nest `/admin/support/*`).
 */
import { buildQueryString, getServerApiBase, requestJson } from '@/lib/http-client'
import type {
  AdminSupportTicketDetailResponse,
  AdminSupportTicketsResponse,
} from '@/types/support-api.types'

function nestBase(): string {
  return getServerApiBase().replace(/\/$/, '')
}

function urlAdminSupportTickets(): string {
  return `${nestBase()}/admin/support/tickets`
}

export async function fetchAdminSupportTickets(params?: {
  status?: string
  category?: string
  from?: string
  to?: string
}): Promise<AdminSupportTicketsResponse> {
  const qs = buildQueryString({
    status: params?.status,
    category: params?.category,
    from: params?.from,
    to: params?.to,
  })
  const url = qs
    ? `${urlAdminSupportTickets()}?${qs}`
    : urlAdminSupportTickets()
  return requestJson<AdminSupportTicketsResponse>(url, { method: 'GET' })
}

export async function fetchAdminSupportTicket(
  ticketId: string,
): Promise<AdminSupportTicketDetailResponse> {
  return requestJson<AdminSupportTicketDetailResponse>(
    `${urlAdminSupportTickets()}/${encodeURIComponent(ticketId)}`,
    { method: 'GET' },
  )
}

export async function claimAdminSupportTicket(
  ticketId: string,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminSupportTickets()}/${encodeURIComponent(ticketId)}/claim`,
    { method: 'POST' },
  )
}

export async function replyAdminSupportTicket(
  ticketId: string,
  message: string,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminSupportTickets()}/${encodeURIComponent(ticketId)}/reply`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
  )
}

export async function patchAdminSupportTicketStatus(
  ticketId: string,
  status: string,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${urlAdminSupportTickets()}/${encodeURIComponent(ticketId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  )
}
