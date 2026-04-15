/**
 * Customer / Enterprise support tickets — Nest `/support/*`.
 */
import { buildQueryString, getServerApiBase, requestJson } from '@/lib/http-client'
import type {
  UserSupportTicketDetailResponse,
  UserSupportTicketsResponse,
} from '@/types/support-api.types'

function base(): string {
  return getServerApiBase().replace(/\/$/, '')
}

function ticketsUrl(): string {
  return `${base()}/support/tickets`
}

export async function fetchUserSupportTickets(params?: {
  status?: string
}): Promise<UserSupportTicketsResponse> {
  const qs = buildQueryString({ status: params?.status })
  const url = qs ? `${ticketsUrl()}?${qs}` : ticketsUrl()
  return requestJson<UserSupportTicketsResponse>(url, { method: 'GET' })
}

export async function fetchUserSupportTicket(
  ticketId: string,
): Promise<UserSupportTicketDetailResponse> {
  return requestJson<UserSupportTicketDetailResponse>(
    `${ticketsUrl()}/${encodeURIComponent(ticketId)}`,
    { method: 'GET' },
  )
}

export async function createUserSupportTicket(body: {
  subject: string
  description: string
  category?: string
}): Promise<{ ticketId: string }> {
  return requestJson<{ ticketId: string }>(ticketsUrl(), {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function patchUserSupportTicket(
  ticketId: string,
  body: { subject?: string; description?: string; category?: string },
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${ticketsUrl()}/${encodeURIComponent(ticketId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export async function deleteUserSupportTicket(
  ticketId: string,
): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(
    `${ticketsUrl()}/${encodeURIComponent(ticketId)}`,
    { method: 'DELETE' },
  )
}
