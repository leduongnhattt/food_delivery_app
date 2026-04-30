"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import { ArrowLeft, Percent, Send, Tag } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import { createAdminVoucher } from "@/services/admin.service"
import { DateTimePickerField } from "@/components/ui/date-time-picker"
import { ADMIN_FIELD_BASE_CLASS } from "@/components/admin/shared/admin-field-classes"

export default function VoucherCreateAdminPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [touched, setTouched] = useState({
    code: false,
    discountPercent: false,
    discountAmount: false,
    minOrderValue: false,
    maxUsage: false,
    expiry: false,
  })

  const todayMin = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "amount",
    discountPercent: "",
    discountAmount: "",
    minOrderValue: "",
    maxUsage: "",
    expiryDateTime: "",
  })

  // Debounce preview inputs a bit for smooth rendering.
  const [previewForm, setPreviewForm] = useState(form)
  useEffect(() => {
    const t = window.setTimeout(() => setPreviewForm(form), 150)
    return () => window.clearTimeout(t)
  }, [form])

  const errors = useMemo(() => {
    const e = {
      code: "",
      discountPercent: "",
      discountAmount: "",
      minOrderValue: "",
      maxUsage: "",
      expiry: "",
    }

    const c = form.code.trim()
    if (!c) e.code = "Voucher code is required"
    else if (c.length < 3) e.code = "Voucher code must be at least 3 characters"
    else if (c.length > 20) e.code = "Voucher code must be less than 20 characters"
    else if (!/^[A-Za-z0-9_-]+$/.test(c))
      e.code = "Voucher code can only contain letters, numbers, hyphens, and underscores"

    if (!form.expiryDateTime.trim()) e.expiry = "Expiry date is required"
    else {
      const dt = new Date(form.expiryDateTime)
      if (Number.isNaN(dt.getTime())) e.expiry = "Expiry date is invalid"
      else if (dt.getTime() <= Date.now()) e.expiry = "Expiry date must be in the future"
    }

    if (form.discountType === "percent") {
      if (!form.discountPercent.trim()) e.discountPercent = "Discount percent is required"
      else {
        const n = Number(form.discountPercent)
        if (!Number.isFinite(n)) e.discountPercent = "Discount percent must be a valid number"
        else if (n <= 0 || n > 100) e.discountPercent = "Discount percent must be between 1 and 100"
      }
    } else {
      if (!form.discountAmount.trim()) e.discountAmount = "Discount amount is required"
      else {
        const n = Number(form.discountAmount)
        if (!Number.isFinite(n)) e.discountAmount = "Discount amount must be a valid number"
        else if (n <= 0) e.discountAmount = "Discount amount must be greater than 0"
      }
    }

    if (form.minOrderValue.trim()) {
      const n = Number(form.minOrderValue)
      if (!Number.isFinite(n)) e.minOrderValue = "Min order value must be a valid number"
      else if (n < 0) e.minOrderValue = "Min order value must be 0 or greater"
    }
    if (form.maxUsage.trim()) {
      const n = Number(form.maxUsage)
      if (!Number.isFinite(n) || !Number.isInteger(n)) e.maxUsage = "Max usage must be an integer"
      else if (n < 1) e.maxUsage = "Max usage must be 1 or greater"
    }

    return e
  }, [form])

  const canSubmit = useMemo(() => Object.values(errors).every((v) => !v), [errors])

  function shouldShowError(key: keyof typeof errors) {
    if (submitAttempted) return true
    if (key === "code") return touched.code
    if (key === "discountPercent") return touched.discountPercent
    if (key === "discountAmount") return touched.discountAmount
    if (key === "minOrderValue") return touched.minOrderValue
    if (key === "maxUsage") return touched.maxUsage
    if (key === "expiry") return touched.expiry
    return false
  }

  const previewText = useMemo(() => {
    const code = previewForm.code.trim() || "WELCOME10"
    const discount =
      previewForm.discountType === "percent"
        ? `${previewForm.discountPercent.trim() || "10"}% off`
        : `$${previewForm.discountAmount.trim() || "5.00"} off`

    const minOrder = previewForm.minOrderValue.trim()
      ? `Min order: $${previewForm.minOrderValue.trim()}`
      : "Min order: —"
    const maxUsage = previewForm.maxUsage.trim()
      ? `Max usage: ${previewForm.maxUsage.trim()}`
      : "Max usage: Unlimited"

    const expiry = previewForm.expiryDateTime.trim() ? previewForm.expiryDateTime.trim() : "—"

    return [
      `Code: ${code}`,
      `Discount: ${discount}`,
      minOrder,
      maxUsage,
      `Expiry: ${expiry}`,
    ].join("\n")
  }, [previewForm])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitAttempted(true)
    if (!canSubmit) {
      showToast("Please check your inputs", "error", 3500)
      return
    }
    startTransition(async () => {
      try {
        const payload: {
          Code: string
          ExpiryDate: string
          DiscountPercent?: number
          DiscountAmount?: number
          MinOrderValue?: number
          MaxUsage?: number
        } = {
          Code: form.code.trim(),
          ExpiryDate: form.expiryDateTime.trim(),
        }

        if (form.discountType === "percent") payload.DiscountPercent = Number(form.discountPercent)
        else payload.DiscountAmount = Number(form.discountAmount)

        if (form.minOrderValue.trim()) payload.MinOrderValue = Number(form.minOrderValue)
        if (form.maxUsage.trim()) payload.MaxUsage = Number(form.maxUsage)

        await createAdminVoucher(payload)
        showToast("Voucher created successfully", "success", 2500)
        router.push("/admin/vouchers")
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create voucher"
        showToast(message, "error", 5000)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/vouchers"
          className="inline-flex items-center gap-2 text-[13px] leading-[18px] font-semibold text-[oklch(0.21_0.034_264.665)] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vouchers
        </Link>
      </div>

      <div>
        <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
          Create voucher
        </h1>
        <p className="mt-1 text-[12px] leading-4 font-normal text-[oklch(0.551_0.027_264.364)]">
          Create a new voucher for enterprises.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)] mb-3">
                Voucher Details
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Coupon Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                    placeholder="e.g., SAVE20, WELCOME10"
                    value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, code: true }))}
                  />
                  {shouldShowError("code") && errors.code ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.code}</p>
                  ) : null}
                </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Discount Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, discountType: "percent" }))}
                    className={`flex-1 rounded-lg border px-4 py-3 text-[13px] leading-4 font-medium ${
                      form.discountType === "percent"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Percent className="mr-2 inline h-4 w-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, discountType: "amount" }))}
                    className={`flex-1 rounded-lg border px-4 py-3 text-[13px] leading-4 font-medium ${
                      form.discountType === "amount"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Tag className="mr-2 inline h-4 w-4" />
                    Fixed Amount
                  </button>
                </div>
              </div>

              {form.discountType === "percent" ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Discount Percentage <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.discountPercent}
                      onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, discountPercent: true }))}
                      className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] pr-9"
                      placeholder="10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                      %
                    </div>
                  </div>
                  {shouldShowError("discountPercent") && errors.discountPercent ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.discountPercent}</p>
                  ) : null}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Discount Amount <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      $
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountAmount}
                      onChange={(e) => setForm((p) => ({ ...p, discountAmount: e.target.value }))}
                      onBlur={() => setTouched((t) => ({ ...t, discountAmount: true }))}
                      className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] pl-8"
                      placeholder="5.00"
                    />
                  </div>
                  {shouldShowError("discountAmount") && errors.discountAmount ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.discountAmount}</p>
                  ) : null}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Minimum Order Value <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    $
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderValue}
                    onChange={(e) => setForm((p) => ({ ...p, minOrderValue: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, minOrderValue: true }))}
                    className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] pl-8"
                    placeholder="0.00"
                  />
                </div>
                {shouldShowError("minOrderValue") && errors.minOrderValue ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.minOrderValue}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Max Usage <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsage}
                  onChange={(e) => setForm((p) => ({ ...p, maxUsage: e.target.value }))}
                  onBlur={() => setTouched((t) => ({ ...t, maxUsage: true }))}
                  className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                  placeholder="Unlimited"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Maximum number of times this voucher can be used. Leave empty for unlimited usage.
                </p>
                {shouldShowError("maxUsage") && errors.maxUsage ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.maxUsage}</p>
                ) : null}
              </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Expiry Date <span className="text-rose-600">*</span>
                  </label>
                  <DateTimePickerField
                    value={form.expiryDateTime}
                    onChange={(v) => setForm((p) => ({ ...p, expiryDateTime: v }))}
                    mode="datetime"
                    min={todayMin}
                    disableFlip
                    triggerClassName={`${ADMIN_FIELD_BASE_CLASS} h-10 min-h-10`}
                    align="start"
                  />
                  <div
                    onBlurCapture={() => setTouched((t) => ({ ...t, expiry: true }))}
                    tabIndex={-1}
                  />
                  {shouldShowError("expiry") && errors.expiry ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.expiry}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Link
                href="/admin/vouchers"
                className="inline-flex min-w-[140px] items-center justify-center h-9 px-4 rounded-lg border border-slate-200 bg-white text-[12px] leading-4 font-medium text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isPending || !canSubmit}
                className="inline-flex min-w-[140px] items-center justify-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-[12px] leading-4 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPending ? "Creating…" : "Create Voucher"}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)] mb-3">
              Voucher Preview
            </div>

            <div className="space-y-3">
              <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
                <div className="p-4">
                  <div className="text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                    Voucher Summary
                  </div>
                  <div className="mt-3 h-px bg-slate-200" />
                  <div className="mt-3 whitespace-pre-wrap text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]">
                    {previewText || "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                Note: This preview shows how the voucher will appear in admin lists and detail pages.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

