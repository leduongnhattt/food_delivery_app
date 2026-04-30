export type AuditLogStatus = "Success" | "Failure"

export type AuditLogRow = {
  id: string
  timestamp: string
  user: string
  role: string
  module: string
  action: string
  status: AuditLogStatus
  description: string
  ipAddress: string
}

