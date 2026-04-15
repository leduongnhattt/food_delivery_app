"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import UserSupportList from "@/components/support/UserSupportList"
import { SupportRoleGuard } from "@/components/support/support-role-guard"

export default function ProfileSupportPage() {
  return (
    <AuthGuard>
      <SupportRoleGuard variant="customer">
        <div className="min-h-screen bg-gray-50">
          <div className="container max-w-5xl mx-auto py-8 px-4">
            <UserSupportList
              basePath="/profile/support"
              title="Help & support"
              subtitle="Questions about orders, payments, or your account? Open a ticket — we reply by email."
            />
          </div>
        </div>
      </SupportRoleGuard>
    </AuthGuard>
  )
}
