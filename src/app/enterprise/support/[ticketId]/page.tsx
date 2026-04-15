"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import UserSupportDetail from "@/components/support/UserSupportDetail"
import { SupportRoleGuard } from "@/components/support/support-role-guard"

export default function EnterpriseSupportDetailPage() {
  return (
    <AuthGuard redirectTo="/signin">
      <SupportRoleGuard variant="enterprise">
        <UserSupportDetail basePath="/enterprise/support" />
      </SupportRoleGuard>
    </AuthGuard>
  )
}
