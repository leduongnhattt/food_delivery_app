"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import type { Order, ReturnReasonCode, ReturnRequestedSolution } from "@/services/order.service"
import { OrderService } from "@/services/order.service"
import { useToast } from "@/contexts/toast-context"

type LineState = { selected: boolean; quantity: number }

type EvidenceImage = { file: File; previewUrl: string }

const REASONS: Array<{ code: ReturnReasonCode; label: string }> = [
  { code: "missing_items", label: "Missing item(s)" },
  { code: "wrong_item", label: "Wrong item" },
  { code: "quality_issue", label: "Quality issue" },
  { code: "damaged_spill", label: "Damaged / spill" },
  { code: "late_delivery", label: "Late delivery" },
  { code: "other", label: "Other" },
]

export function ReturnRequestModal({
  open,
  order,
  onClose,
  onSubmitted,
}: {
  open: boolean
  order: Order | null
  onClose: () => void
  onSubmitted: () => Promise<void> | void
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>("missing_items")
  const [reasonText, setReasonText] = useState("")
  const [evidenceImages, setEvidenceImages] = useState<EvidenceImage[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [lineState, setLineState] = useState<Record<string, LineState>>({})

  const lines = useMemo(() => order?.items ?? [], [order?.items])

  const initialState = useMemo(() => {
    const next: Record<string, LineState> = {}
    for (const it of lines) {
      next[it.id] = { selected: false, quantity: Math.min(1, it.quantity) }
    }
    return next
  }, [lines])

  // Reset state when opening a new order.
  useEffect(() => {
    if (!open) return
    setLineState(initialState)
    setEvidenceImages((prev) => {
      for (const x of prev) URL.revokeObjectURL(x.previewUrl)
      return []
    })
  }, [open, order?.id, initialState])

  useEffect(() => {
    return () => {
      for (const x of evidenceImages) URL.revokeObjectURL(x.previewUrl)
    }
  }, [evidenceImages])

  if (!open) return null

  const requestedSolution: ReturnRequestedSolution = "RefundOnly"

  const selectedItems = lines
    .filter((it) => lineState[it.id]?.selected)
    .map((it) => ({
      orderDetailId: it.id,
      quantity: Math.min(lineState[it.id]?.quantity ?? 1, it.quantity),
    }))

  const canSubmit = !!order?.id && selectedItems.length > 0 && !submitting

  const toggle = (id: string, v: boolean) => {
    setLineState((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { selected: false, quantity: 1 }), selected: v } }))
  }

  const setQty = (id: string, qty: number, max: number) => {
    const next = Math.max(1, Math.min(max, Math.floor(qty)))
    setLineState((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { selected: false, quantity: 1 }), quantity: next } }))
  }

  const validateEvidenceFile = (file: File): string | null => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return "File size too large. Maximum size is 5MB"
    }
    return null
  }

  const addEvidenceFiles = (files: File[]) => {
    if (files.length === 0) return
    setEvidenceImages((prev) => {
      const remaining = Math.max(0, 3 - prev.length)
      if (remaining <= 0) {
        showToast("You can upload up to 3 evidence images.", "error", 3500)
        return prev
      }
      const next: EvidenceImage[] = [...prev]
      for (const f of files.slice(0, remaining)) {
        const err = validateEvidenceFile(f)
        if (err) {
          showToast(err, "error", 4000)
          continue
        }
        next.push({ file: f, previewUrl: URL.createObjectURL(f) })
      }
      return next
    })
  }

  const removeEvidenceAt = (idx: number) => {
    setEvidenceImages((prev) => {
      const it = prev[idx]
      if (it) URL.revokeObjectURL(it.previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const submit = async () => {
    if (!order?.id) return
    if (selectedItems.length === 0) return
    try {
      setSubmitting(true)
      await OrderService.createReturnRequest(order.id, {
        items: selectedItems,
        reasonCode,
        reasonText: reasonText.trim() || null,
        requestedSolution,
        evidenceImages: evidenceImages.map((x) => ({ file: x.file })),
      })
      await onSubmitted()
      onClose()
    } catch (error: any) {
      console.error("Failed to submit return request", error)
      const message = error instanceof Error ? error.message : "Failed to submit return request"
      const status = typeof error?.status === "number" ? error.status : undefined
      if (status === 401 || message.toLowerCase().includes("unauthorized")) {
        showToast("Your session has expired. Please sign in again.", "error", 4000)
        router.push("/signin")
        return
      }
      showToast(message, "error", 4500)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-orange-600 px-5 py-4 text-white">
          <div className="text-sm font-semibold">Return / Refund request</div>
          <div className="text-xs text-white/90 truncate">
            Order {order ? `#${order.id.slice(-8)}` : "—"}
          </div>
        </div>

        <div className="p-4 overflow-auto space-y-3">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Select item(s)</div>
              <div className="text-xs text-gray-500">Choose items and quantities to return.</div>
            </div>
            <div className="divide-y divide-gray-100">
              {lines.map((it) => {
                const st = lineState[it.id] ?? { selected: false, quantity: 1 }
                return (
                  <div key={it.id} className="px-4 py-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={st.selected}
                      onChange={(e) => toggle(it.id, e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-300"
                    />
                    <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden">
                      {it.imageUrl ? (
                        <Image src={it.imageUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{it.foodName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatPrice(it.price)}</div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <div className="text-[11px] text-gray-500">Qty</div>
                      <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(it.id, (st.quantity ?? 1) - 1, it.quantity)}
                        className="h-8 w-8 rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <input
                        value={String(st.quantity ?? 1)}
                        onChange={(e) => setQty(it.id, Number(e.target.value), it.quantity)}
                        className="h-8 w-14 rounded border border-gray-300 bg-white px-2 text-sm text-gray-900 text-center"
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(it.id, (st.quantity ?? 1) + 1, it.quantity)}
                        className="h-8 w-8 rounded border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Reason</div>
              <div className="text-xs text-gray-500">Tell us what went wrong (optional details help).</div>
            </div>
            <div className="px-4 py-3 space-y-2">
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
                className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-900"
              >
                {REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                rows={3}
                placeholder="Optional details"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Evidence images (optional)</div>
              <div className="text-xs text-gray-500">Upload up to 3 photos to support your request.</div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-600">
                  {evidenceImages.length}/3 selected
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs bg-white"
                    disabled={submitting || evidenceImages.length >= 3}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Add photos
                  </Button>
                  {evidenceImages.length > 0 ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                      onClick={() => {
                        setEvidenceImages((prev) => {
                          for (const x of prev) URL.revokeObjectURL(x.previewUrl)
                          return []
                        })
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                      disabled={submitting}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addEvidenceFiles(Array.from(e.target.files ?? []))}
                disabled={submitting}
              />

              {evidenceImages.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {evidenceImages.map((x, idx) => (
                    <div
                      key={`${x.file.name}-${x.file.size}-${idx}`}
                      className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                      title={x.file.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={x.previewUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeEvidenceAt(idx)}
                        className="absolute right-1 top-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-black/70"
                        aria-label="Remove image"
                        disabled={submitting}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Requested solution</div>
              <div className="text-xs text-gray-500">We’ll review and update you in the app.</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-sm font-medium text-gray-900">Refund only</div>
              <div className="mt-1 text-xs text-gray-600">
                Refund processing is tracked only (payment integration will be implemented later).
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="h-8 px-4 text-sm bg-white">
            Close
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="h-8 px-4 text-sm bg-orange-600 hover:bg-orange-700"
          >
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </div>
    </div>
  )
}

