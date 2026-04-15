'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

function normalizeRole(role: string | undefined): string {
  return (role || '').trim().toLowerCase()
}

/**
 * After AuthGuard: send customers to profile support, enterprises to enterprise support,
 * admins to admin inbox so POST /api/support/tickets always runs with an allowed role.
 */
export function SupportRoleGuard({
  variant,
  children,
}: {
  variant: 'customer' | 'enterprise'
  children: ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.role) return

    const r = normalizeRole(user.role)
    if (variant === 'customer') {
      if (r === 'enterprise') {
        router.replace('/enterprise/support')
        return
      }
      if (r === 'admin') {
        router.replace('/admin/support')
        return
      }
      return
    }

    // enterprise
    if (r === 'customer') {
      router.replace('/profile/support')
      return
    }
    if (r === 'admin') {
      router.replace('/admin/support')
      return
    }
  }, [isLoading, isAuthenticated, user, variant, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (!user?.role) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  const r = normalizeRole(user.role)
  if (variant === 'customer' && (r === 'enterprise' || r === 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }
  if (variant === 'enterprise' && (r === 'customer' || r === 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return <>{children}</>
}
