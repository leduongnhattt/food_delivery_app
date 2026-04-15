import type { EnterpriseActivationStep } from "@/hooks/use-enterprise-activation"

type EnterpriseActivateStepIndicatorProps = {
  step: EnterpriseActivationStep
}

export function EnterpriseActivateStepIndicator({ step }: EnterpriseActivateStepIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-semibold ${
          step === 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
        }`}
      >
        1
      </div>
      <div
        className={`text-[13px] font-semibold ${step === 1 ? "text-slate-900" : "text-slate-500"}`}
      >
        Account Info
      </div>
      <div className="flex-1 h-px bg-slate-200" />
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-semibold ${
          step === 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
        }`}
      >
        2
      </div>
      <div
        className={`text-[13px] font-semibold ${step === 2 ? "text-slate-900" : "text-slate-500"}`}
      >
        Verify OTP
      </div>
      <div className="flex-1 h-px bg-slate-200" />
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-semibold ${
          step === 3 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
        }`}
      >
        3
      </div>
      <div
        className={`text-[13px] font-semibold ${step === 3 ? "text-slate-900" : "text-slate-500"}`}
      >
        Complete
      </div>
    </div>
  )
}
