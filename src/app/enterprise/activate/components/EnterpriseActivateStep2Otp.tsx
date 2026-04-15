"use client"

import type { MutableRefObject } from "react"

type EnterpriseActivateStep2OtpProps = {
  otp: string
  setOtp: (v: string) => void
  otpRefs: MutableRefObject<Array<HTMLInputElement | null>>
  hasSentOtp: boolean
  resendIn: number
  step2CanContinue: boolean
  isPending: boolean
  pendingAction: "sendOtp" | "verifyOtp" | null
  onSendOtp: () => void
  onVerifyOtp: () => void
  onBack: () => void
}

export function EnterpriseActivateStep2Otp({
  otp,
  setOtp,
  otpRefs,
  hasSentOtp,
  resendIn,
  step2CanContinue,
  isPending,
  pendingAction,
  onSendOtp,
  onVerifyOtp,
  onBack,
}: EnterpriseActivateStep2OtpProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[22px] leading-7 font-semibold text-slate-900">Verify OTP</div>
        <div className="mt-2 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
          Enter the 6-digit code sent to your email
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: 6 }).map((_, idx) => {
          const v = otp[idx] ?? ""
          return (
            <input
              key={idx}
              ref={(el) => {
                otpRefs.current[idx] = el
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={v}
              onChange={(e) => {
                const digit = e.target.value.replace(/[^\d]/g, "").slice(0, 1)
                const next = otp.split("")
                while (next.length < 6) next.push("")
                next[idx] = digit
                const joined = next.join("").slice(0, 6)
                setOtp(joined)
                if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  const cur = otp[idx] ?? ""
                  if (!cur && idx > 0) {
                    otpRefs.current[idx - 1]?.focus()
                  }
                }
                if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus()
                if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus()
              }}
              onPaste={(e) => {
                e.preventDefault()
                const text = e.clipboardData.getData("text").replace(/[^\d]/g, "").slice(0, 6)
                if (!text) return
                setOtp(text)
                const pos = Math.min(5, text.length)
                window.setTimeout(() => otpRefs.current[pos]?.focus(), 0)
              }}
              className="h-14 w-12 rounded-lg border border-slate-200 bg-slate-50 text-center text-[18px] font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          )
        })}
      </div>

      {!hasSentOtp ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={isPending}
            onClick={() => void onSendOtp()}
            className="inline-flex items-center justify-center bg-transparent p-0 text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
          >
            {isPending && pendingAction === "sendOtp" ? "Sending…" : "Send OTP"}
          </button>
        </div>
      ) : null}

      {hasSentOtp && resendIn > 0 ? (
        <div className="text-center text-[13px] leading-[18px] font-medium text-slate-500">
          Resend code in {resendIn}s
        </div>
      ) : null}

      {hasSentOtp && resendIn === 0 ? (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={isPending}
            onClick={() => void onSendOtp()}
            className="inline-flex items-center justify-center bg-transparent p-0 text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
          >
            Resend
          </button>
        </div>
      ) : null}

      <button
        type="button"
        disabled={isPending || !step2CanContinue}
        onClick={() => void onVerifyOtp()}
        className="w-full h-11 rounded-lg bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending && pendingAction === "verifyOtp" ? "Verifying…" : "Verify Code"}
      </button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={isPending}
          onClick={onBack}
          className="text-[12px] leading-4 font-semibold text-slate-700 hover:opacity-80 disabled:opacity-40"
        >
          Back
        </button>
        <span />
      </div>
    </div>
  )
}
