"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  getEnterpriseInvitationTemplate,
  updateEnterpriseInvitationTemplate,
  type AdminInvitationTemplateValue,
} from "@/services/admin.service"
import { useToast } from "@/contexts/toast-context"
import { Eye, Save } from "lucide-react"

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function textToHtml(text: string): string {
  const safe = escapeHtml(text || "")
  const body = safe.replace(/\n/g, "<br/>")
  return `<!doctype html><html><head><meta charset="utf-8"/></head><body style="font-family:Inter,Arial,sans-serif;white-space:normal;">${body}</body></html>`
}

export default function EnterprisesInvitationTemplateAdminPage() {
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [openPreview, setOpenPreview] = useState(false)
  const [template, setTemplate] = useState<AdminInvitationTemplateValue>({
    subject: "",
    html: "",
    text: "",
  })

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

  const sampleParams = useMemo(
    () => ({
      appName: "HanalaFood",
      enterpriseEmail: "enterprise@example.com",
      sellerName: "Enterprise Name",
      seller_name: "Enterprise Name",
      enterpriseName: "Enterprise Name",
      enterprise_name: "Enterprise Name",
      inviteLink: "https://localhost:3000/enterprise/activate?token=sample",
      invite_link: "https://localhost:3000/enterprise/activate?token=sample",
      expiresInDays: "7",
      supportEmail: "support@example.com",
    }),
    [],
  )

  const previewText = useMemo(() => {
    const base = (template.text || "").trim() ? template.text || "" : htmlToText(template.html || "")
    return renderPreview(base, sampleParams)
  }, [template.text, template.html, sampleParams])

  async function onSave() {
    const subject = template.subject.trim()
    const text = (template.text || "").trim()
    const html = template.html.trim() || (text ? textToHtml(text) : "")
    if (!subject || !html) {
      showToast("subject is required", "error", 4000)
      return
    }
    startTransition(async () => {
      try {
        await updateEnterpriseInvitationTemplate({
          subject,
          html,
          text: text ? template.text : undefined,
        })
        showToast("Template saved", "success", 3000)
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Save failed", "error", 5000)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Enterprise Invitation Template
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Customize the email template for enterprise invitations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenPreview(true)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[12px] leading-4 font-medium text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isPending}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-blue-600 text-[12px] leading-4 font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-900">
        Use <code className="font-mono">{"{{enterprise_name}}"}</code>,{" "}
        <code className="font-mono">{"{{invite_link}}"}</code>,{" "}
        <code className="font-mono">{"{{expiresInDays}}"}</code> as placeholders. Changes apply to
        new invitations.
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="px-4 py-3 border-b border-slate-200 bg-[#f9fbfc]">
                <div className="text-[11px] font-semibold tracking-wide text-slate-600">
                  EMAIL SUBJECT
                </div>
              </div>
              <div className="p-4">
                <input
                  className="w-full border border-slate-200 rounded-md h-10 px-3 focus:ring-2 focus:ring-sky-200 bg-white text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                  value={template.subject}
                  onChange={(e) => setTemplate((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Subject line for invitation emails"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="px-4 py-3 border-b border-slate-200 bg-[#f9fbfc]">
                <div className="text-[11px] font-semibold tracking-wide text-slate-600">
                  EMAIL BODY
                </div>
              </div>
              <div className="p-4">
                <textarea
                  className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-200 bg-white font-mono text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]"
                  rows={12}
                  value={template.text || ""}
                  onChange={(e) => setTemplate((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Use placeholders for dynamic content"
                />
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="text-[12px] leading-4 font-medium text-slate-900 mb-3">
                Available Placeholders
              </div>
              <div className="space-y-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)]">
                <div className="flex items-center gap-3">
                  <code className="rounded bg-white/70 px-2 py-1 border border-amber-200 font-mono">
                    {"{{enterprise_name}}"}
                  </code>
                  <div>Enterprise name</div>
                </div>
                <div className="flex items-center gap-3">
                  <code className="rounded bg-white/70 px-2 py-1 border border-amber-200 font-mono">
                    {"{{invite_link}}"}
                  </code>
                  <div>Unique registration URL</div>
                </div>
                <div className="flex items-center gap-3">
                  <code className="rounded bg-white/70 px-2 py-1 border border-amber-200 font-mono">
                    {"{{expiresInDays}}"}
                  </code>
                  <div>Days until link expires</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Note: Template changes apply immediately to new invitations. Existing invitations are
              not affected.
            </div>
          </div>
        )}
      </div>

      {/* Preview dialog */}
      {openPreview && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenPreview(false)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-[#f9fbfc]">
              <div className="text-[12px] leading-4 font-medium text-slate-900">Preview</div>
              <button
                type="button"
                onClick={() => setOpenPreview(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
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
        </div>
      )}
    </div>
  )
}

