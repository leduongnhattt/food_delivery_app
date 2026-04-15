"use client"

import { EnterpriseActivateShell } from "@/app/enterprise/activate/components/EnterpriseActivateShell"

type EnterpriseActivateInviteErrorProps = {
  onGoSignIn: () => void
}

export function EnterpriseActivateInviteError({ onGoSignIn }: EnterpriseActivateInviteErrorProps) {
  return (
    <EnterpriseActivateShell contentClassName="pt-14 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[18px] leading-6 font-semibold text-slate-900">Activation error</div>
        <p className="mt-2 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
          This invitation is invalid or expired. Please contact your admin for a new invitation.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={onGoSignIn}
            className="h-10 w-full rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700"
          >
            Go to sign in
          </button>
        </div>
      </div>
    </EnterpriseActivateShell>
  )
}
