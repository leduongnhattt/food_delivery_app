import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface VerifyCodeModalProps {
  isOpen: boolean
  email: string
  code: string
  codeError: string | null
  sending: boolean
  resendIn: number
  onClose: () => void
  onCodeChange: (code: string) => void
  onVerify: () => void
  onResend: () => void
}

export function VerifyCodeModal({
  isOpen,
  email,
  code,
  codeError,
  sending,
  resendIn,
  onClose,
  onCodeChange,
  onVerify,
  onResend
}: VerifyCodeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Verify Code</h3>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">We sent a 6-digit code to {email}. Enter it below to continue.</p>
          <Input
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            className="border-gray-300 focus:border-orange-600 focus:ring-orange-600 h-11 rounded-lg"
          />
          {codeError && <div className="text-sm text-red-600">{codeError}</div>}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50"
              disabled={resendIn > 0}
              onClick={onResend}
            >
              {sending ? 'Sending…' : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend Code'}
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={onVerify}
            >
              Verify
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

