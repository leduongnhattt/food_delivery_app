import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

interface NotificationToastProps {
  notification: { type: 'success' | 'error'; message: string } | null
  onClose: () => void
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  if (!notification) return null

  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl max-w-sm ${
      notification.type === 'success'
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-red-50 border border-red-200 text-red-800'
    }`}>
      {notification.type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600" />
      )}
      <span className="text-sm font-medium">{notification.message}</span>
      <Button
        variant="ghost"
        size="sm"
        className="w-6 h-6 p-0 ml-auto"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

