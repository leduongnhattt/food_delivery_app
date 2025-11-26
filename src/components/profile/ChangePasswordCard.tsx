import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentUserFromToken } from '@/lib/auth-helpers'
import { useState, useEffect } from 'react'

interface ChangePasswordCardProps {
  onChangePassword: () => void
}

export function ChangePasswordCard({ onChangePassword }: ChangePasswordCardProps) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUserFromToken()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  // Check if user is Google user
  const isGoogleUser = user?.provider === 'google'

  if (isLoading) {
    return (
      <Card className="mt-6 shadow-sm border border-gray-200 bg-white rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-gray-900">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6 shadow-sm border border-gray-200 bg-white rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-gray-900">Change Password</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 flex-wrap">
        {isGoogleUser ? (
          <>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                You signed in with Google. Password changes are managed through your Google account.
              </p>
              <p className="text-xs text-gray-500">
                To change your password, please visit your Google account settings.
              </p>
            </div>
            <Button
              disabled
              className="bg-gray-400 text-white cursor-not-allowed"
            >
              Not Available
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Change your password securely. We will send a verification code to your email first.
            </p>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={onChangePassword}
            >
              Change Password
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

