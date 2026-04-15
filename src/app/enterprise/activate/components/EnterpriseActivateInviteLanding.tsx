"use client"

import { CheckCircle2, Mail } from "lucide-react"
import { ENTERPRISE_ACTIVATE_BENEFITS } from "@/app/enterprise/activate/enterprise-activate.constants"
import { EnterpriseActivateShell } from "@/app/enterprise/activate/components/EnterpriseActivateShell"

type EnterpriseActivateInviteLandingProps = {
  email: string
  onActivate: () => void
}

export function EnterpriseActivateInviteLanding({
  email,
  onActivate,
}: EnterpriseActivateInviteLandingProps) {
  return (
    <EnterpriseActivateShell>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] leading-[18px] font-semibold text-slate-900">
                    HanalaFood Team
                  </div>
                  <div className="text-[13px] leading-[18px] font-medium text-slate-500">
                    hanala.helpcenter@gmail.com
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[13px] leading-[18px] font-medium text-slate-500">
                <span className="font-semibold text-slate-900">To:</span> {email}
              </div>
              <div className="mt-0.5 text-[13px] leading-[18px] font-medium text-slate-500">
                <span className="font-semibold text-slate-900">Subject:</span> You&apos;re invited to join
                HanalaFood as an Enterprise!
              </div>
            </div>

            <div className="px-8 py-8">
              <div className="text-center">
                <div className="text-[38px] leading-none font-extrabold text-[#2563FF]">Hanala</div>
                <div className="mt-3 text-[20px] leading-7 font-semibold text-slate-900">
                  Welcome to HanalaFood Enterprise Center!
                </div>
                <div className="mt-2 text-[14px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
                  You&apos;ve been invited to join our growing community of successful enterprises.
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-[13px] leading-[18px] font-medium text-slate-600">
                We&apos;re excited to have you onboard. Complete your registration to activate your
                enterprise account and start managing products & orders right away.
              </div>

              <div className="mt-7 text-center text-[14px] leading-[18px] font-semibold text-slate-900">
                Why HanalaFood?
              </div>

              <div className="mt-4 space-y-3">
                {ENTERPRISE_ACTIVATE_BENEFITS.map((it) => (
                  <div key={it.title} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-blue-600/10 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] leading-[18px] font-semibold text-slate-900">
                          {it.title}
                        </div>
                        <div className="mt-1 text-[13px] leading-[18px] font-medium text-slate-500">
                          {it.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col items-center">
                <button
                  type="button"
                  onClick={onActivate}
                  className="h-11 px-10 rounded-md bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700"
                >
                  Activate Your Enterprise Account
                </button>
                <div className="mt-3 text-center text-[13px] leading-[18px] font-medium text-slate-500">
                  Click the button above to get started with your enterprise registration
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EnterpriseActivateShell>
  )
}
