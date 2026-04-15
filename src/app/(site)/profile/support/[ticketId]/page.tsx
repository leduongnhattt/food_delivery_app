"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import UserSupportDetail from "@/components/support/UserSupportDetail"
import { SupportRoleGuard } from "@/components/support/support-role-guard"

export default function ProfileSupportDetailPage() {
  return (
    <AuthGuard>
      <SupportRoleGuard variant="customer">
        <div className="min-h-screen bg-gray-50">
          <div className="container max-w-5xl mx-auto py-8 px-4">
            <UserSupportDetail basePath="/profile/support" />
          </div>
        </div>
      </SupportRoleGuard>
    </AuthGuard>
  )
}
