"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import UserSupportList from "@/components/support/UserSupportList"
import { SupportRoleGuard } from "@/components/support/support-role-guard"

export default function EnterpriseSupportPage() {
  return (
    <AuthGuard redirectTo="/signin">
      <SupportRoleGuard variant="enterprise">
        <UserSupportList
          basePath="/enterprise/support"
          headerVariant="admin"
          title="Support"
          subtitle="Reach the platform team for help with your shop, menu, orders, or payouts. We notify you by email when we reply."
        />
      </SupportRoleGuard>
    </AuthGuard>
  )
}
