"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getEnterpriseInvitationTemplate, inviteEnterprise } from "@/services/admin.service"
import type { AdminInvitationTemplateValue } from "@/services/admin.service"
import { useToast } from "@/contexts/toast-context"
import { ChevronLeft, Send } from "lucide-react"

function renderPreview(tpl: string, params: Record<string, string>): string {
  let out = tpl
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v)
  }
  return out
}

function htmlToText(html: string): string {
  if (!html) return ""
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export default function SendEnterpriseInvitationAdminPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<AdminInvitationTemplateValue>({
    subject: "",
    html: "",
    text: "",
  })
  const [form, setForm] = useState({
    email: "",
    enterpriseNameDraft: "",
    phoneNumber: "",
    templateId: "basic",
  })

  // Debounce preview inputs to keep rendering smooth on long templates.
  const [previewInputs, setPreviewInputs] = useState({
    email: "",
    enterpriseNameDraft: "",
  })
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPreviewInputs({
        email: form.email,
        enterpriseNameDraft: form.enterpriseNameDraft,
      })
    }, 150)
    return () => window.clearTimeout(t)
  }, [form.email, form.enterpriseNameDraft])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await getEnterpriseInvitationTemplate()
        setTemplate({
          subject: res.template.subject || "",
          html: res.template.html || "",
          text: res.template.text || "",
        })
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Failed to load template", "error", 5000)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [showToast])

  const canSubmit = useMemo(() => {
    const email = form.email.trim()
    const phone = form.phoneNumber.trim()
    const seller = form.enterpriseNameDraft.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
    if (!seller) return false
    if (!phone || phone.length < 8) return false
    return true
  }, [form.email, form.phoneNumber, form.enterpriseNameDraft])

  const previewParams = useMemo(
    () => ({
      appName: "HanalaFood",
      enterpriseEmail: previewInputs.email.trim() || "enterprise@example.com",
      enterpriseNameDraft: previewInputs.enterpriseNameDraft.trim() || "Enterprise Name",
      sellerName: previewInputs.enterpriseNameDraft.trim() || "Enterprise Name",
      seller_name: previewInputs.enterpriseNameDraft.trim() || "Enterprise Name",
      enterpriseName: previewInputs.enterpriseNameDraft.trim() || "Enterprise Name",
      enterprise_name: previewInputs.enterpriseNameDraft.trim() || "Enterprise Name",
      inviteLink: "https://localhost:3000/enterprise/activate?token=sample",
      invite_link: "https://localhost:3000/enterprise/activate?token=sample",
      expiresInDays: "7",
      supportEmail: "support@example.com",
    }),
    [previewInputs.email, previewInputs.enterpriseNameDraft],
  )

  const previewText = useMemo(() => {
    const base = (template.text || "").trim()
      ? template.text || ""
      : htmlToText(template.html || "")
    return renderPreview(base, previewParams)
  }, [template.text, template.html, previewParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) {
      showToast("Please fill all required fields", "error", 3500)
      return
    }
    startTransition(async () => {
      try {
        await inviteEnterprise({
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          enterpriseNameDraft: form.enterpriseNameDraft.trim(),
        })
        showToast("Invitation sent", "success", 3000)
        router.push("/admin/enterprises/invitations")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send invitation"
        showToast(message, "error", 5000)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/enterprises/invitations"
          className="inline-flex items-center gap-2 text-[13px] leading-[18px] font-semibold text-[oklch(0.21_0.034_264.665)] hover:opacity-80 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Invitations
        </Link>
      </div>

      <div>
        <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
          Send Invitation
        </h1>
        <p className="mt-1 text-[12px] leading-4 font-normal text-[oklch(0.551_0.027_264.364)]">
          Invite a new enterprise to join your platform.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Left: invitation details */}
          <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)] mb-3">
              Invitation Details
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                  placeholder="enterprise@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Enterprise Name <span className="text-rose-600">*</span>
                </label>
                <input
                  className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                  placeholder="Enter enterprise name"
                  value={form.enterpriseNameDraft}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, enterpriseNameDraft: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mobile Number <span className="text-rose-600">*</span>
                </label>
                <input
                  className="border rounded-md h-10 px-3 w-full border-slate-200 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                  placeholder="+84..."
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Used for account verification and notifications.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Invitation Template
                </label>
                <select
                  className="border rounded-md h-10 px-3 w-full border-slate-200 bg-white focus:ring-2 focus:ring-sky-200 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                  value={form.templateId}
                  onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))}
                  disabled
                >
                  <option value="basic">Basic Invitation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: template preview */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)] mb-3">
              Template Preview
            </div>

            {loading ? (
              <div className="text-center text-slate-500 py-10 text-sm">Loading…</div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
                  <div className="p-4">
                    <div className="text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                      Basic Invitation
                    </div>
                    <div className="mt-3 h-px bg-slate-200" />
                    <div className="mt-3 whitespace-pre-wrap text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]">
                      {previewText || "—"}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                  Note: The actual email will include a unique registration link and be personalized with the recipient's information.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Link
            href="/admin/enterprises/invitations"
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-slate-200 bg-white text-[12px] leading-4 font-medium text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-[12px] leading-4 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPending ? "Sending…" : "Send Invitation"}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

