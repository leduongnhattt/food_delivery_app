/** Admin list item from GET /admin/support/tickets */
export type AdminSupportTicketListItem = {
  id: string
  subject: string
  status: string
  category: string
  sentAt: string
  requesterEmail: string
  requesterUsername: string
  assignedTo: string | null
  hasReply: boolean
}

export type AdminSupportTicketsResponse = {
  tickets: AdminSupportTicketListItem[]
}

export type AdminSupportTicketDetail = {
  id: string
  subject: string
  description: string | null
  status: string
  category: string
  sentAt: string
  replyMessage: string | null
  requesterEmail: string
  requesterUsername: string
  assignedTo: string | null
  assignedAdminId: string | null
  updatedAt: string | null
  messages?: {
    id: string
    sender: string
    body: string
    createdAt: string
  }[]
}

export type AdminSupportTicketDetailResponse = {
  ticket: AdminSupportTicketDetail
}

/** User (customer / enterprise) ticket summary */
export type UserSupportTicketSummary = {
  id: string
  subject: string
  status: string
  category: string
  sentAt: string
  hasReply: boolean
  assignedTo: string | null
}

export type UserSupportTicketsResponse = {
  tickets: UserSupportTicketSummary[]
}

export type UserSupportTicketDetail = {
  id: string
  subject: string
  description: string | null
  status: string
  category: string
  sentAt: string
  replyMessage: string | null
  assignedTo: string | null
  updatedAt: string | null
  messages?: {
    id: string
    sender: string
    body: string
    createdAt: string
  }[]
}

export type UserSupportTicketDetailResponse = {
  ticket: UserSupportTicketDetail
}
