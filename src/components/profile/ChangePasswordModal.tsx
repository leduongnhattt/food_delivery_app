import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { X, Eye, EyeOff } from 'lucide-react'
import { useAuthValidation } from '@/hooks/use-auth-validation'
import { useToast } from '@/contexts/toast-context'
import { changePassword } from '@/services/change-password.service'
import { useState } from 'react'

interface ChangePasswordModalProps {
  isOpen: boolean
  canEditPassword: boolean
  currentPassword: string
  newPassword: string
  confirmPassword: string
  showCurrent: boolean
  showNew: boolean
  showConfirm: boolean
  pwdError: string | null
  onClose: () => void
  onCurrentPasswordChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onToggleCurrentVisibility: () => void
  onToggleNewVisibility: () => void
  onToggleConfirmVisibility: () => void
  onUpdatePassword?: () => Promise<void>
  onForgotPasswordClick?: () => void
}

export function ChangePasswordModal({
  isOpen,
  canEditPassword,
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrent,
  showNew,
  showConfirm,
  pwdError,
  onClose,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleCurrentVisibility,
  onToggleNewVisibility,
  onToggleConfirmVisibility,
  onUpdatePassword,
  onForgotPasswordClick
}: ChangePasswordModalProps) {
  const { showToast } = useToast()
  const { validatePassword, validatePasswordMatch } = useAuthValidation()
  const [isLoading, setIsLoading] = useState(false)

  // Validate new password strength
  const handleNewPasswordChange = (value: string) => {
    onNewPasswordChange(value)
    
    // Check if new password is same as current password (real-time validation)
    if (value && currentPassword && value === currentPassword) {
      showToast("New password must be different from current password", "error")
    }
  }

  // Validate password confirmation
  const handleConfirmPasswordChange = (value: string) => {
    onConfirmPasswordChange(value)
  }

  // Check if new password is same as current password
  const isNewPasswordSameAsCurrent = () => {
    return newPassword && currentPassword && newPassword === currentPassword
  }

  // Validate all fields before updating password
  const handleUpdatePassword = async () => {
    // Check if new password is same as current password
    if (isNewPasswordSameAsCurrent()) {
      showToast("New password must be different from current password", "error")
      onNewPasswordChange("")
      onConfirmPasswordChange("")
      return
    }

    // Validate new password strength
    if (!validatePassword(newPassword, onNewPasswordChange)) {
      return
    }

    // Validate password confirmation
    if (!validatePasswordMatch(newPassword, confirmPassword, onNewPasswordChange, onConfirmPasswordChange)) {
      return
    }

    // If all validations pass, call API to change password
    try {
      setIsLoading(true)

      if (onUpdatePassword) {
        await onUpdatePassword()
        return
      }

      const result = await changePassword({
        currentPassword,
        newPassword
      })

      if (result.success) {
        showToast("Password changed successfully!", "success")
        onClose() // Close modal
        // Optionally redirect to login or refresh the page
        window.location.reload()
      } else {
        showToast(result.error?.message || "Failed to change password", "error")
      }
    } catch (error) {
      console.error('Failed to change password:', error)
      showToast("An unexpected error occurred", "error")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Change Password</h3>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-700">Current Password</label>
            <Input
              disabled={!canEditPassword}
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              className="border-gray-300 focus:border-orange-600 focus:ring-orange-600 h-11 rounded-lg disabled:bg-gray-100 pr-10"
            />
            <button type="button" className="absolute right-3 top-[38px] text-gray-500" onClick={onToggleCurrentVisibility}>
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-700">New Password</label>
            <Input
              disabled={!canEditPassword}
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              className="border-gray-300 focus:border-orange-600 focus:ring-orange-600 h-11 rounded-lg disabled:bg-gray-100 pr-10"
            />
            <button type="button" className="absolute right-3 top-[38px] text-gray-500" onClick={onToggleNewVisibility}>
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {newPassword && (
            <PasswordStrength password={newPassword} className="mt-2" />
          )}
          
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-700">Confirm New Password</label>
            <Input
              disabled={!canEditPassword}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className="border-gray-300 focus:border-orange-600 focus:ring-orange-600 h-11 rounded-lg disabled:bg-gray-100 pr-10"
            />
            <button type="button" className="absolute right-3 top-[38px] text-gray-500" onClick={onToggleConfirmVisibility}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 justify-start">
            <button
              type="button"
              className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 focus:outline-none"
              onClick={onForgotPasswordClick}
              disabled={!onForgotPasswordClick}
            >
              <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20h.01M4 4h16v16H4V4z" />
              </svg>
              Forgot Password?
            </button>
          </div>
          {pwdError && <div className="text-sm text-red-600">{pwdError}</div>}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={!canEditPassword || isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              onClick={handleUpdatePassword}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


