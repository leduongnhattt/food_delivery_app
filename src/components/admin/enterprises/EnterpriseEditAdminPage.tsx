"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAdminEnterpriseDetail, updateAdminEnterprise } from "@/services/admin.service"
import type { AdminEnterpriseDetailResponse } from "@/types/admin-api.types"
import { useToast } from "@/contexts/toast-context"

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h2 className="text-base font-semibold tracking-tight text-slate-900 mb-6">{title}</h2>
      {children}
    </div>
  )
}

/**
 * Compact CMS-style control (~32px tall): slim border, subtle inset gradient, small radius — matches
 * typical admin “small” input density (not the tall h-11 mobile-first default).
 */
const cmsInputClassName = cn(
  "block h-8 w-full rounded border border-slate-300 bg-gradient-to-b from-slate-100/35 to-white px-2.5 text-[13px] leading-8 text-slate-900",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
  "placeholder:text-slate-400",
  "transition-[box-shadow,border-color] duration-150",
  "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/35",
  "disabled:cursor-not-allowed disabled:opacity-50"
)

/**
 * Same trigger as Enterprise List status filter: fixed h-8 to match list toolbar + form text inputs.
 */
const statusDropdownTriggerClass =
  "relative group inline-flex h-8 min-h-8 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] px-3 py-0 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200 w-full"

export default function EnterpriseEditAdminPage({ enterpriseId }: { enterpriseId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<AdminEnterpriseDetailResponse | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

  const [enterpriseName, setEnterpriseName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [accountStatus, setAccountStatus] = useState<"Active" | "Inactive">("Active")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminEnterpriseDetail(enterpriseId)
      setDetail(res)
      const e = res.enterprise
      setEnterpriseName(e.EnterpriseName)
      setContactEmail(e.account.Email)
      setPhoneNumber(e.PhoneNumber)
      setAddress(e.Address)
      setAccountStatus(e.account.Status === "Active" ? "Active" : "Inactive")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load", "error", 5000)
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [enterpriseId, showToast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as HTMLElement | null
      if (openStatusMenu && statusMenuRef.current && target) {
        if (!statusMenuRef.current.contains(target)) setOpenStatusMenu(false)
        return
      }
      setOpenStatusMenu(false)
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [openStatusMenu])

  const onSubmit = async () => {
    const name = enterpriseName.trim()
    if (!name) {
      showToast("Enterprise name is required", "error", 3000)
      return
    }
    const addr = address.trim()
    if (!addr) {
      showToast("Store address is required", "error", 3000)
      return
    }
    setSaving(true)
    try {
      await updateAdminEnterprise(enterpriseId, {
        enterpriseName: name,
        phoneNumber: phoneNumber.trim(),
        address: addr,
        contactEmail: contactEmail.trim(),
        accountStatus,
      })
      showToast("Enterprise updated", "success", 3000)
      router.push(`/admin/enterprises/${encodeURIComponent(enterpriseId)}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", "error", 5000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[14px] text-slate-500">
        Loading…
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="space-y-4 px-1">
        <Link
          href="/admin/enterprises/list"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to enterprise list
        </Link>
        <p className="text-sm text-slate-600">Enterprise not found.</p>
      </div>
    )
  }

  return (
    <div className="w-full pb-10">
      <div className="w-full space-y-6">
        <div className="space-y-3">
          <Link
            href={`/admin/enterprises/${encodeURIComponent(enterpriseId)}`}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-[18px] leading-6 font-bold text-slate-900">Edit Enterprise</h1>
            <p className="mt-1 text-[13px] leading-[18px] text-slate-600">
              Update enterprise information and settings.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Basic Information">
            <div className="grid grid-cols-1 gap-x-10 gap-y-4 lg:grid-cols-2">
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Enterprise Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={cmsInputClassName}
                  value={enterpriseName}
                  onChange={(e) => setEnterpriseName(e.target.value)}
                  autoComplete="organization"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  className={cmsInputClassName}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  className={cmsInputClassName}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div className="hidden lg:block" aria-hidden />
              <div className="lg:col-span-2">
                <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                  Store Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={cmsInputClassName}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  autoComplete="street-address"
                />
                <p className="mt-1.5 text-[12px] leading-snug text-slate-500">
                  Map and precise location are configured by the enterprise in their account.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Status">
            <div className="max-w-md">
              <label className="block text-[13px] font-semibold text-slate-800 mb-1.5">
                Enterprise Status
              </label>
              <div ref={statusMenuRef} className="relative">
                <button
                  type="button"
                  onMouseDown={(ev) => {
                    ev.stopPropagation()
                  }}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setOpenStatusMenu((v) => !v)
                  }}
                  className={statusDropdownTriggerClass}
                >
                  <span className="truncate">
                    {accountStatus === "Active" ? "Active" : "Suspended"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                      openStatusMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openStatusMenu && (
                  <div
                    onClick={(ev) => ev.stopPropagation()}
                    className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setAccountStatus("Active")
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Active</span>
                      {accountStatus === "Active" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setAccountStatus("Inactive")
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Suspended</span>
                      {accountStatus === "Inactive" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200/80 pt-8">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                router.push(`/admin/enterprises/${encodeURIComponent(enterpriseId)}`)
              }
              className="inline-flex h-9 min-w-[100px] items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSubmit()}
              className="inline-flex h-9 min-w-[120px] items-center justify-center rounded-md bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
