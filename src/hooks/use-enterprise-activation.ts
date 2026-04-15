"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/contexts/toast-context"
import { useTimeHhmm } from "@/hooks/use-time-hhmm"
import { useAuthValidation } from "@/hooks/use-auth-validation"
import { usePasswordToggle } from "@/hooks/use-password-toggle"
import {
  enterpriseActivationSendOtp,
  enterpriseActivationStep1,
  enterpriseActivationStep3,
  enterpriseActivationVerifyOtp,
  verifyEnterpriseInvite,
} from "@/services/enterprise-activation.service"

export type EnterpriseActivationStep = 1 | 2 | 3

export type EnterpriseInvitationPreview = {
  email: string
  phoneNumber: string
  enterpriseName: string | null
  expiresAt: string
}

export function useEnterpriseActivation() {
  const router = useRouter()
  const sp = useSearchParams()
  const token = sp.get("token") || ""
  const { showToast } = useToast()
  const { validatePassword, validatePasswordMatch } = useAuthValidation()

  const [step, setStep] = useState<EnterpriseActivationStep>(1)
  const [started, setStarted] = useState(false)
  const [wizardStarted, setWizardStarted] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    "sendOtp" | "verifyOtp" | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [invitation, setInvitation] = useState<EnterpriseInvitationPreview | null>(null)

  const [step1, setStep1] = useState({
    enterpriseName: "",
    password: "",
    confirmPassword: "",
  })
  const passwordToggle = usePasswordToggle()
  const confirmPasswordToggle = usePasswordToggle()

  const [otp, setOtp] = useState("")
  const [hasSentOtp, setHasSentOtp] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const [step3, setStep3] = useState({
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    openHours: "00:00",
    closeHours: "00:00",
    description: "",
  })

  const openTime = useTimeHhmm("00:00")
  const closeTime = useTimeHhmm("00:00")

  useEffect(() => {
    const run = async () => {
      try {
        const res = await verifyEnterpriseInvite(token)
        setInvitation(res.invitation)
        setStep1((p) => ({
          ...p,
          enterpriseName: res.invitation.enterpriseName || "",
        }))
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "Invalid or expired invitation",
          "error",
          6000,
        )
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [token, showToast])

  useEffect(() => {
    setStep3((p) => ({ ...p, openHours: openTime.value }))
  }, [openTime.value])

  useEffect(() => {
    setStep3((p) => ({ ...p, closeHours: closeTime.value }))
  }, [closeTime.value])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = window.setInterval(() => setResendIn((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(t)
  }, [resendIn])

  const step1CanContinue = useMemo(() => {
    const name = step1.enterpriseName.trim()
    const pw = step1.password
    const cpw = step1.confirmPassword
    return name.length > 0 && pw.length > 0 && cpw.length > 0 && pw === cpw
  }, [step1.enterpriseName, step1.password, step1.confirmPassword])

  const step2CanContinue = useMemo(() => /^\d{6}$/.test(otp.trim()), [otp])

  const step3CanFinish = useMemo(() => {
    const addressOk = step3.address.trim().length > 0
    const locOk = step3.latitude !== null && step3.longitude !== null
    const timeOk =
      /^\d{2}:\d{2}$/.test(step3.openHours) && /^\d{2}:\d{2}$/.test(step3.closeHours)
    return addressOk && locOk && timeOk
  }, [step3.address, step3.latitude, step3.longitude, step3.openHours, step3.closeHours])

  function startWizard() {
    setStep(1)
    setWizardStarted(true)
  }

  function submitStep1() {
    if (!step1CanContinue) return
    if (!validatePassword(step1.password, (v) => setStep1((p) => ({ ...p, password: v })))) return
    if (
      !validatePasswordMatch(
        step1.password,
        step1.confirmPassword,
        (v) => setStep1((p) => ({ ...p, password: v })),
        (v) => setStep1((p) => ({ ...p, confirmPassword: v })),
      )
    )
      return
    startTransition(async () => {
      try {
        await enterpriseActivationStep1({
          token,
          enterpriseName: step1.enterpriseName.trim(),
          password: step1.password,
          locale:
            typeof navigator !== "undefined" ? navigator.language : undefined,
        })
        showToast("Step 1 saved", "success", 2500)
        setStep(2)
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Step 1 failed", "error", 5000)
      }
    })
  }

  function sendOtp() {
    setPendingAction("sendOtp")
    startTransition(async () => {
      try {
        await enterpriseActivationSendOtp({ token })
        showToast("OTP sent to your email", "success", 3000)
        setOtp("")
        setHasSentOtp(true)
        setResendIn(60)
        window.setTimeout(() => otpRefs.current[0]?.focus(), 50)
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Failed to send OTP", "error", 5000)
      } finally {
        setPendingAction((cur) => (cur === "sendOtp" ? null : cur))
      }
    })
  }

  function verifyOtp() {
    if (!step2CanContinue) return
    setPendingAction("verifyOtp")
    startTransition(async () => {
      try {
        await enterpriseActivationVerifyOtp({ token, otp: otp.trim() })
        showToast("OTP verified", "success", 2500)
        setStep(3)
      } catch (e) {
        showToast(e instanceof Error ? e.message : "OTP verify failed", "error", 5000)
      } finally {
        setPendingAction((cur) => (cur === "verifyOtp" ? null : cur))
      }
    })
  }

  function finishActivation() {
    if (!step3CanFinish) return
    if (step3.latitude === null || step3.longitude === null) return
    const latitude = step3.latitude
    const longitude = step3.longitude
    startTransition(async () => {
      try {
        await enterpriseActivationStep3({
          token,
          address: step3.address.trim(),
          latitude,
          longitude,
          openHours: step3.openHours,
          closeHours: step3.closeHours,
          description: step3.description?.trim() ? step3.description.trim() : undefined,
        })
        showToast("Account activated. Please sign in.", "success", 4000)
        router.replace("/signin")
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Activation failed", "error", 6000)
      }
    })
  }

  return {
    token,
    router,
    loading,
    invitation,
    step,
    setStep,
    started,
    setStarted,
    wizardStarted,
    startWizard,
    isPending,
    pendingAction,
    step1,
    setStep1,
    passwordToggle,
    confirmPasswordToggle,
    step1CanContinue,
    submitStep1,
    otp,
    setOtp,
    hasSentOtp,
    resendIn,
    otpRefs,
    step2CanContinue,
    sendOtp,
    verifyOtp,
    step3,
    setStep3,
    openTime,
    closeTime,
    step3CanFinish,
    finishActivation,
  }
}
