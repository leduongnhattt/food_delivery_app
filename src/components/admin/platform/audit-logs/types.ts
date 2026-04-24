export type AuditLogStatus = "Success" | "Failed" | "Pending"

export type AuditLogRow = {
  id: string
  timestamp: string
  user: string
  role: string
  module: string
  action: string
  stage: string
  status: AuditLogStatus
  description: string
  entityId: string
  ipAddress: string
}

