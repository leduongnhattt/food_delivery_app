"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import { getAdminVoucherDetail, updateAdminVoucher } from "@/services/admin.service"
import type { AdminVoucherListItem, UpdateAdminVoucherPayload } from "@/types/admin-api.types"
import { DateTimePickerField } from "@/components/ui/date-time-picker"
import { ADMIN_FIELD_BASE_CLASS } from "@/components/admin/shared/admin-field-classes"

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">{children}</div>
}

const inputClass =
  "w-full h-8 rounded border border-slate-200 bg-white px-3 text-[13px] leading-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"

export default function VoucherEditAdminPage({ voucherId }: { voucherId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [voucher, setVoucher] = useState<AdminVoucherListItem | null>(null)

  const todayMin = new Date().toISOString().slice(0, 10)

  const [code, setCode] = useState("")
  const [expiryDateTime, setExpiryDateTime] = useState("") // yyyy-mm-ddThh:mm
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent")
  const [discountPercent, setDiscountPercent] = useState("")
  const [discountAmount, setDiscountAmount] = useState("")
  const [minOrderValue, setMinOrderValue] = useState("")
  const [maxUsage, setMaxUsage] = useState("")
  const [errors, setErrors] = useState({
    code: "",
    expiry: "",
    discountPercent: "",
    discountAmount: "",
    minOrderValue: "",
    maxUsage: "",
  })

  const canSave = useMemo(() => {
    if (!code.trim()) return false
    if (!expiryDateTime.trim()) return false
    if (discountType === "percent") return !!discountPercent.trim()
    return !!discountAmount.trim()
  }, [code, expiryDateTime, discountType, discountPercent, discountAmount])

  function toLocalDateTimeInputValue(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function validate(): boolean {
    const e = {
      code: "",
      expiry: "",
      discountPercent: "",
      discountAmount: "",
      minOrderValue: "",
      maxUsage: "",
    }

    const c = code.trim()
    if (!c) e.code = "Voucher code is required"
    else if (c.length < 3) e.code = "Voucher code must be at least 3 characters"
    else if (c.length > 20) e.code = "Voucher code must be less than 20 characters"
    else if (!/^[A-Za-z0-9_-]+$/.test(c))
      e.code = "Voucher code can only contain letters, numbers, hyphens, and underscores"

    if (!expiryDateTime.trim()) e.expiry = "Expiry date is required"
    else {
      const selected = new Date(expiryDateTime)
      if (Number.isNaN(selected.getTime())) e.expiry = "Expiry date is invalid"
      else if (selected.getTime() <= Date.now()) e.expiry = "Expiry date must be in the future"
    }

    if (discountType === "percent") {
      if (!discountPercent.trim()) e.discountPercent = "Discount percent is required"
      else {
        const n = Number(discountPercent)
        if (!Number.isFinite(n)) e.discountPercent = "Discount percent must be a valid number"
        else if (n <= 0 || n > 100) e.discountPercent = "Discount percent must be between 1 and 100"
      }
    } else {
      if (!discountAmount.trim()) e.discountAmount = "Discount amount is required"
      else {
        const n = Number(discountAmount)
        if (!Number.isFinite(n)) e.discountAmount = "Discount amount must be a valid number"
        else if (n <= 0) e.discountAmount = "Discount amount must be greater than 0"
      }
    }

    if (minOrderValue.trim()) {
      const n = Number(minOrderValue)
      if (!Number.isFinite(n)) e.minOrderValue = "Min order value must be a valid number"
      else if (n < 0) e.minOrderValue = "Min order value must be 0 or greater"
    }
    if (maxUsage.trim()) {
      const n = Number(maxUsage)
      if (!Number.isFinite(n) || !Number.isInteger(n)) e.maxUsage = "Max usage must be an integer"
      else if (n < 1) e.maxUsage = "Max usage must be 1 or greater"
    }

    setErrors(e)
    return Object.values(e).every((v) => v === "")
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminVoucherDetail(voucherId)
      setVoucher(res.voucher)

      setCode(res.voucher.code || "")
      setExpiryDateTime(res.voucher.expiryDate ? toLocalDateTimeInputValue(res.voucher.expiryDate) : "")
      if (res.voucher.discountPercent != null) {
        setDiscountType("percent")
        setDiscountPercent(String(res.voucher.discountPercent))
        setDiscountAmount("")
      } else if (res.voucher.discountAmount != null) {
        setDiscountType("amount")
        setDiscountAmount(String(res.voucher.discountAmount))
        setDiscountPercent("")
      } else {
        setDiscountType("percent")
        setDiscountPercent("")
        setDiscountAmount("")
      }
      setMinOrderValue(res.voucher.minOrderValue != null ? String(res.voucher.minOrderValue) : "")
      setMaxUsage(res.voucher.maxUsage != null ? String(res.voucher.maxUsage) : "")
      setErrors({
        code: "",
        expiry: "",
        discountPercent: "",
        discountAmount: "",
        minOrderValue: "",
        maxUsage: "",
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load voucher"
      showToast(message, "error", 4000)
      setVoucher(null)
    } finally {
      setLoading(false)
    }
  }, [showToast, voucherId])

  useEffect(() => {
    void load()
  }, [load])

  async function onSave() {
    if (!validate()) {
      showToast("Please check your inputs", "error", 3500)
      return
    }
    setSaving(true)
    try {
      const payload: UpdateAdminVoucherPayload = {
        Code: code.trim(),
        ExpiryDate: expiryDateTime,
      }
      if (discountType === "percent") {
        payload.DiscountPercent = parseFloat(discountPercent)
        payload.DiscountAmount = null
      } else {
        payload.DiscountAmount = parseFloat(discountAmount)
        payload.DiscountPercent = null
      }
      payload.MinOrderValue = minOrderValue.trim() ? parseFloat(minOrderValue) : null
      payload.MaxUsage = maxUsage.trim() ? parseInt(maxUsage, 10) : null

      await updateAdminVoucher(voucherId, payload)
      showToast("Voucher updated", "success", 2500)
      router.push(`/admin/vouchers/${encodeURIComponent(voucherId)}`)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update voucher"
      showToast(message, "error", 4000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/vouchers/${encodeURIComponent(voucherId)}`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs leading-4 font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
          <h1 className="mt-2 text-[14px] leading-[18px] font-semibold text-[oklch(0.21_0.034_264.665)]">
            Edit voucher
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Update voucher information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={!canSave || saving || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-[13px] leading-4 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-[13px] leading-4 text-slate-500">
          Loading…
        </div>
      ) : !voucher ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-[13px] leading-4 text-slate-500">
          Voucher not found.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Code *</FieldLabel>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={inputClass}
                placeholder="e.g., WELCOME10"
              />
              {errors.code ? (
                <div className="mt-2 text-[12px] leading-4 font-normal text-rose-600">{errors.code}</div>
              ) : null}
            </div>

            <div>
              <FieldLabel>Expiry Date *</FieldLabel>
              <DateTimePickerField
                value={expiryDateTime}
                onChange={setExpiryDateTime}
                mode="datetime"
                min={todayMin}
                triggerClassName={ADMIN_FIELD_BASE_CLASS}
                align="start"
              />
              {errors.expiry ? (
                <div className="mt-2 text-[12px] leading-4 font-normal text-rose-600">{errors.expiry}</div>
              ) : null}
            </div>

            <div>
              <FieldLabel>Discount Type</FieldLabel>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType("percent")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-[13px] leading-4 font-medium ${
                    discountType === "percent"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("amount")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-[13px] leading-4 font-medium ${
                    discountType === "amount"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Fixed amount
                </button>
              </div>
            </div>

            {discountType === "percent" ? (
              <div>
                <FieldLabel>Discount Percent *</FieldLabel>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className={inputClass}
                  placeholder="10"
                />
                {errors.discountPercent ? (
                  <div className="mt-2 text-[12px] leading-4 font-normal text-rose-600">
                    {errors.discountPercent}
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                <FieldLabel>Discount Amount *</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className={inputClass}
                  placeholder="5.00"
                />
                {errors.discountAmount ? (
                  <div className="mt-2 text-[12px] leading-4 font-normal text-rose-600">
                    {errors.discountAmount}
                  </div>
                ) : null}
              </div>
            )}

            <div>
              <FieldLabel>Min Order Value</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
              {errors.minOrderValue ? (
                <div className="mt-2 text-[12px] leading-4 font-normal text-rose-600">
                  {errors.minOrderValue}
                </div>
              ) : null}
            </div>

            <div>
              <FieldLabel>Max Usage</FieldLabel>
              <input
                type="number"
                min="1"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
                className={inputClass}
                placeholder="Unlimited"
              />
              {errors.maxUsage ? (
                <div className="mt-2 text-[12px] leading-4 font-normal text-rose-600">{errors.maxUsage}</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

