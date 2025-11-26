import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { X, Eye, EyeOff, Mail, Check } from 'lucide-react'

/**
 * Modal for selecting email to send reset code
 * In authenticated context, user can select from their available emails
 */
interface EmailSelectionModalProps {
  isOpen: boolean
  emails: string[]
  selectedEmail: string | null
  sending: boolean
  onSelectEmail: (email: string) => void
  onSendCode: () => void
  onClose: () => void
}

export function EmailSelectionModal({
  isOpen,
  emails,
  selectedEmail,
  sending,
  onSelectEmail,
  onSendCode,
  onClose
}: EmailSelectionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Select Email</h3>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Choose the email address where you want to receive the verification code.
          </p>
          
          <div className="space-y-2">
            {emails.map((email) => (
              <button
                key={email}
                type="button"
                onClick={() => onSelectEmail(email)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedEmail === email
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{email}</span>
                  </div>
                  {selectedEmail === email && (
                    <Check className="w-5 h-5 text-orange-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <Button
            className="bg-orange-600 hover:bg-orange-700 text-white w-full"
            disabled={!selectedEmail || sending}
            onClick={onSendCode}
          >
            {sending ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </div>
            ) : (
              'Send Verification Code'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal for entering new password in forgot password flow
 * This modal does not require current password
 */
interface ForgotPasswordNewPasswordModalProps {
  isOpen: boolean
  newPassword: string
  confirmPassword: string
  showNew: boolean
  showConfirm: boolean
  pwdError: string | null
  isLoading: boolean
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onToggleNewVisibility: () => void
  onToggleConfirmVisibility: () => void
  onUpdatePassword: () => void
  onClose: () => void
}

export function ForgotPasswordNewPasswordModal({
  isOpen,
  newPassword,
  confirmPassword,
  showNew,
  showConfirm,
  pwdError,
  isLoading,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewVisibility,
  onToggleConfirmVisibility,
  onUpdatePassword,
  onClose
}: ForgotPasswordNewPasswordModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Set New Password</h3>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Please enter your new password below.
          </p>

          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-700">New Password</label>
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              className="border-gray-300 focus:border-orange-600 focus:ring-orange-600 h-11 rounded-lg pr-10"
              placeholder="Enter new password"
            />
            <button
              type="button"
              className="absolute right-3 top-[38px] text-gray-500"
              onClick={onToggleNewVisibility}
            >
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
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className="border-gray-300 focus:border-orange-600 focus:ring-orange-600 h-11 rounded-lg pr-10"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              className="absolute right-3 top-[38px] text-gray-500"
              onClick={onToggleConfirmVisibility}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {pwdError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 text-red-500 mr-2">⚠️</div>
                <span className="text-red-700 text-sm">{pwdError}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              onClick={onUpdatePassword}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

