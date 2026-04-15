"use client"

import { useEnterpriseActivation } from "@/hooks/use-enterprise-activation"
import { EnterpriseActivateInviteError } from "@/app/enterprise/activate/components/EnterpriseActivateInviteError"
import { EnterpriseActivateInviteLanding } from "@/app/enterprise/activate/components/EnterpriseActivateInviteLanding"
import { EnterpriseActivateShell } from "@/app/enterprise/activate/components/EnterpriseActivateShell"
import { EnterpriseActivateStep1Form } from "@/app/enterprise/activate/components/EnterpriseActivateStep1Form"
import { EnterpriseActivateStep2Otp } from "@/app/enterprise/activate/components/EnterpriseActivateStep2Otp"
import { EnterpriseActivateStep3Profile } from "@/app/enterprise/activate/components/EnterpriseActivateStep3Profile"
import { EnterpriseActivateStepIndicator } from "@/app/enterprise/activate/components/EnterpriseActivateStepIndicator"
import { EnterpriseActivateWizardIntro } from "@/app/enterprise/activate/components/EnterpriseActivateWizardIntro"

export default function EnterpriseActivateClient() {
  const activation = useEnterpriseActivation()

  if (activation.loading) {
    return <div className="p-8 text-center text-slate-500">Loading…</div>
  }

  if (!activation.invitation) {
    return (
      <EnterpriseActivateInviteError onGoSignIn={() => activation.router.replace("/signin")} />
    )
  }

  if (!activation.started) {
    return (
      <EnterpriseActivateInviteLanding
        email={activation.invitation.email}
        onActivate={() => activation.setStarted(true)}
      />
    )
  }

  if (!activation.wizardStarted) {
    return <EnterpriseActivateWizardIntro onStartNow={activation.startWizard} />
  }

  return (
    <EnterpriseActivateShell>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <EnterpriseActivateStepIndicator step={activation.step} />

            <div className="mt-8">
              {activation.step === 1 && (
                <EnterpriseActivateStep1Form
                  step1={activation.step1}
                  setStep1={activation.setStep1}
                  passwordToggle={activation.passwordToggle}
                  confirmPasswordToggle={activation.confirmPasswordToggle}
                  step1CanContinue={activation.step1CanContinue}
                  isPending={activation.isPending}
                  onSubmit={activation.submitStep1}
                />
              )}
              {activation.step === 2 && (
                <EnterpriseActivateStep2Otp
                  otp={activation.otp}
                  setOtp={activation.setOtp}
                  otpRefs={activation.otpRefs}
                  hasSentOtp={activation.hasSentOtp}
                  resendIn={activation.resendIn}
                  step2CanContinue={activation.step2CanContinue}
                  isPending={activation.isPending}
                  pendingAction={activation.pendingAction}
                  onSendOtp={activation.sendOtp}
                  onVerifyOtp={activation.verifyOtp}
                  onBack={() => activation.setStep(1)}
                />
              )}
              {activation.step === 3 && (
                <EnterpriseActivateStep3Profile
                  step3={activation.step3}
                  setStep3={activation.setStep3}
                  openTime={activation.openTime}
                  closeTime={activation.closeTime}
                  step3CanFinish={activation.step3CanFinish}
                  isPending={activation.isPending}
                  onBack={() => activation.setStep(2)}
                  onFinish={activation.finishActivation}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </EnterpriseActivateShell>
  )
}
