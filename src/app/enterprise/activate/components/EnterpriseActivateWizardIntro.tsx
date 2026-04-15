"use client"

import { ENTERPRISE_WIZARD_INTRO_STEPS } from "@/app/enterprise/activate/enterprise-activate.constants"
import { EnterpriseActivateShell } from "@/app/enterprise/activate/components/EnterpriseActivateShell"

type EnterpriseActivateWizardIntroProps = {
  onStartNow: () => void
}

export function EnterpriseActivateWizardIntro({ onStartNow }: EnterpriseActivateWizardIntroProps) {
  return (
    <EnterpriseActivateShell>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8">
            <div className="text-center">
              <div className="text-[22px] leading-7 font-semibold text-slate-900">
                Activate Your HanalaFood Account
              </div>
              <div className="mt-2 text-[14px] leading-[18px] font-medium text-slate-500">
                Should activate your account in under 2 minutes
              </div>
            </div>

            <div className="mt-6 text-[14px] leading-[18px] font-medium text-slate-600">
              Simply complete following 3 steps:
            </div>

            <div className="mt-4 space-y-4">
              {ENTERPRISE_WIZARD_INTRO_STEPS.map((it, idx) => (
                <div key={it.title} className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-blue-600 text-white text-[13px] font-semibold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-[14px] leading-[18px] font-semibold text-slate-900">
                      {it.title}
                    </div>
                    <div className="mt-0.5 text-[13px] leading-[18px] font-medium text-slate-500">
                      {it.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onStartNow}
              className="mt-7 w-full h-11 rounded-lg bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700"
            >
              Start Now
            </button>
          </div>
        </div>
      </div>
    </EnterpriseActivateShell>
  )
}
