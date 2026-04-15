"use client"

import { Input } from "@/components/ui/input"
import { PasswordStrength } from "@/components/ui/password-strength"

type PasswordToggle = {
  showPassword: boolean
  togglePasswordVisibility: () => void
}

type Step1State = {
  enterpriseName: string
  password: string
  confirmPassword: string
}

type EnterpriseActivateStep1FormProps = {
  step1: Step1State
  setStep1: React.Dispatch<React.SetStateAction<Step1State>>
  passwordToggle: PasswordToggle
  confirmPasswordToggle: PasswordToggle
  step1CanContinue: boolean
  isPending: boolean
  onSubmit: () => void
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
      />
    </svg>
  )
}

export function EnterpriseActivateStep1Form({
  step1,
  setStep1,
  passwordToggle,
  confirmPasswordToggle,
  step1CanContinue,
  isPending,
  onSubmit,
}: EnterpriseActivateStep1FormProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[22px] leading-7 font-semibold text-slate-900">Complete Account Info</div>
        <div className="mt-2 text-[13px] leading-[18px] font-medium text-slate-500">
          Set your Enterprise Username and password
        </div>
      </div>

      <div>
        <label className="block text-[13px] leading-[18px] font-semibold text-slate-900 mb-2">
          Enterprise Username <span className="text-rose-600">*</span>
        </label>
        <Input
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all text-sm sm:text-base shadow-sm"
          value={step1.enterpriseName}
          onChange={(e) => setStep1((p) => ({ ...p, enterpriseName: e.target.value }))}
          placeholder="Enter your Enterprise Username"
        />
      </div>
      <div>
        <label className="block text-[13px] leading-[18px] font-semibold text-slate-900 mb-2">
          Set Password <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
          <Input
            type={passwordToggle.showPassword ? "text" : "password"}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all pr-10 sm:pr-12 text-sm sm:text-base shadow-sm"
            value={step1.password}
            onChange={(e) => setStep1((p) => ({ ...p, password: e.target.value }))}
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={passwordToggle.togglePasswordVisibility}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <EyeIcon open={passwordToggle.showPassword} />
          </button>
        </div>
        <PasswordStrength password={step1.password} className="mt-3" />
      </div>
      <div>
        <label className="block text-[13px] leading-[18px] font-semibold text-slate-900 mb-2">
          Confirm Password <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
          <Input
            type={confirmPasswordToggle.showPassword ? "text" : "password"}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 transition-all pr-10 sm:pr-12 text-sm sm:text-base shadow-sm"
            value={step1.confirmPassword}
            onChange={(e) => setStep1((p) => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="Re-enter password"
          />
          <button
            type="button"
            onClick={confirmPasswordToggle.togglePasswordVisibility}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <EyeIcon open={confirmPasswordToggle.showPassword} />
          </button>
        </div>
      </div>
      <button
        type="button"
        disabled={isPending || !step1CanContinue}
        onClick={() => void onSubmit()}
        className="mt-2 w-full h-11 rounded-lg bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving…" : "Next: Verify OTP"}
      </button>
    </div>
  )
}
