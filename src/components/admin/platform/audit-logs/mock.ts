import type { AuditLogRow } from "@/components/admin/platform/audit-logs/types"

export function mockAuditLogs(): AuditLogRow[] {
  const rows: AuditLogRow[] = [
    {
      id: "1",
      timestamp: "2026-04-20T20:16:13.000Z",
      user: "admin@medusa-test.com",
      role: "admin",
      module: "commission_fee",
      action: "UPDATE",
      status: "Success",
      description: "Commission fee 'Anhnh test exclude' deactivated",
      ipAddress: "42.118.128.117",
    },
    {
      id: "2",
      timestamp: "2026-04-20T21:04:12.000Z",
      user: "admin@medusa-test.com",
      role: "admin",
      module: "commission_fee",
      action: "CREATE",
      status: "Success",
      description: "Commission fee 'Anhnh test exclude' created",
      ipAddress: "42.118.128.137",
    },
    {
      id: "3",
      timestamp: "2026-04-18T08:36:58.000Z",
      user: "admin@medusa-test.com",
      role: "admin",
      module: "commission_fee",
      action: "UPDATE",
      status: "Success",
      description: "Commission fee 'Sig Comm - Include' updated",
      ipAddress: "38.187.36.103",
    },
    {
      id: "4",
      timestamp: "2026-04-17T23:00:02.000Z",
      user: "system",
      role: "system",
      module: "service_fee",
      action: "UPDATE",
      status: "Success",
      description: "Service fee 'Platform service fee' deactivated",
      ipAddress: "135.185.57.28",
    },
  ]

  const more = Array.from({ length: 8 }).map((_, idx) => ({
    ...rows[idx % rows.length],
    id: `m-${idx + 1}`,
    timestamp: new Date(Date.now() - (idx + 1) * 36e5).toISOString(),
  }))

  return [...rows, ...more].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

