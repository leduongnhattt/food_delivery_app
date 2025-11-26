"use client"

import { Button } from '@/components/ui/button'

interface ConfirmCancelModalProps {
  open: boolean
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmCancelModal({ open, submitting, onClose, onConfirm }: ConfirmCancelModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirm cancellation</h3>
        </div>
        <div className="p-6 text-gray-700">
          Are you sure you want to cancel this order? This action cannot be undone.
        </div>
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <Button variant="outline" onClick={() => { if (!submitting) onClose() }} disabled={submitting}>Close</Button>
          <Button className="bg-red-600 text-white" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        </div>
      </div>
    </div>
  )
}


