"use client"

import { useCallback, useRef, useState, useEffect, type RefObject } from "react"
import { PasswordService } from "@/services/password.service"
import { changePassword } from "@/services/change-password.service"

export function usePasswordToggle() {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return { showPassword, togglePasswordVisibility }
}

export interface PasswordChangeState {
  isCodeModalOpen: boolean
  isChangePwdModalOpen: boolean
  canEditPassword: boolean
  code: string
  codeError: string | null
  sending: boolean
  /** true once a reset code was successfully sent for the current flow */
  codeSent: boolean
  resendIn: number
  currentPassword: string
  newPassword: string
  confirmPassword: string
  pwdError: string | null
  showCurrent: boolean
  showNew: boolean
  showConfirm: boolean
  resetTokenId: string | null
  isEmailSelectionModalOpen: boolean
  isForgotPasswordNewPwdModalOpen: boolean
  selectedEmail: string | null
  forgotPasswordEmail: string | null
}

export function usePasswordChange(email: string) {
  const [state, setState] = useState<PasswordChangeState>({
    isCodeModalOpen: false,
    isChangePwdModalOpen: false,
    canEditPassword: false,
    code: "",
    codeError: null,
    sending: false,
    codeSent: false,
    resendIn: 0,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    pwdError: null,
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    resetTokenId: null,
    isEmailSelectionModalOpen: false,
    isForgotPasswordNewPwdModalOpen: false,
    selectedEmail: null,
    forgotPasswordEmail: null,
  })

  useEffect(() => {
    if (!state.isCodeModalOpen) return
    if (state.resendIn <= 0) return
    const timer = setInterval(() => {
      setState((prev) => ({ ...prev, resendIn: prev.resendIn > 0 ? prev.resendIn - 1 : 0 }))
    }, 1000)

    return () => clearInterval(timer)
  }, [state.isCodeModalOpen, state.resendIn])

  const updateState = (updates: Partial<PasswordChangeState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const startPasswordChange = async () => {
    updateState({
      // Show change password form immediately (no email code in this flow).
      isChangePwdModalOpen: true,
      isCodeModalOpen: false,
      canEditPassword: true,
      code: "",
      codeError: null,
      sending: false,
      resendIn: 0,
      resetTokenId: null,
      forgotPasswordEmail: null,
      selectedEmail: null,
    })
  }

  const handleCodeChange = (value: string) => {
    updateState({ code: value, codeError: null })
  }

  const verifyCode = async () => {
    if (!state.code || state.code.length !== 6) {
      updateState({ codeError: "Invalid code" })
      return false
    }

    try {
      const result = await PasswordService.verifyResetCode(email, state.code)
      if (!result.success) {
        updateState({ codeError: result.error || "Verification failed" })
        return false
      }

      updateState({
        resetTokenId: result.tokenId || null,
        isCodeModalOpen: false,
        canEditPassword: true,
        isChangePwdModalOpen: true,
      })

      return true
    } catch (error) {
      console.error("Verification failed:", error)
      updateState({ codeError: "Verification failed" })
      return false
    }
  }

  const resendCode = async (): Promise<boolean> => {
    updateState({ sending: true })
    try {
      const emailToUse = state.forgotPasswordEmail || email
      const result = state.codeSent
        ? await PasswordService.resendResetCode(emailToUse)
        : await PasswordService.sendResetCode(emailToUse)
      if (result.success) {
        updateState({ resendIn: 60, codeSent: true, codeError: null })
        return true
      } else {
        throw new Error(result.error || "Failed to resend code")
      }
    } catch (error) {
      console.error("Failed to resend code:", error)
      return false
    } finally {
      updateState({ sending: false })
    }
  }

  const updatePassword = async () => {
    updateState({ pwdError: null })

    if (!state.currentPassword || !state.newPassword || !state.confirmPassword) {
      updateState({ pwdError: "Please fill in all fields" })
      return false
    }

    if (state.newPassword.length < 6) {
      updateState({ pwdError: "New password must be at least 6 characters" })
      return false
    }

    if (state.newPassword !== state.confirmPassword) {
      updateState({ pwdError: "New password and confirmation do not match" })
      return false
    }

    try {
      // Forgot password flow uses verification code + reset token.
      if (state.forgotPasswordEmail) {
        if (!state.resetTokenId) {
          updateState({ pwdError: "Verification required" })
          return false
        }

        const result = await PasswordService.resetPassword(state.resetTokenId, state.newPassword)
        if (!result.success) {
          updateState({ pwdError: result.error || "Failed to update password" })
          return false
        }
      } else {
        // Normal change password (authenticated) uses current password verification.
        const result = await changePassword({
          currentPassword: state.currentPassword,
          newPassword: state.newPassword,
        })
        if (!result.success) {
          updateState({ pwdError: result.error?.message || "Failed to change password" })
          return false
        }
      }

      updateState({
        isChangePwdModalOpen: false,
        resetTokenId: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        forgotPasswordEmail: null,
        selectedEmail: null,
      })

      return true
    } catch (error) {
      console.error("Failed to update password:", error)
      updateState({ pwdError: "Failed to update password" })
      return false
    }
  }

  const closeCodeModal = () => {
    updateState({ isCodeModalOpen: false, isChangePwdModalOpen: false, resendIn: 0, codeSent: false })
  }

  const closePasswordModal = () => {
    updateState({ isChangePwdModalOpen: false })
  }

  const startForgotPassword = () => {
    updateState({
      isChangePwdModalOpen: false,
      isEmailSelectionModalOpen: true,
      selectedEmail: email,
      forgotPasswordEmail: null,
      code: "",
      codeError: null,
      codeSent: false,
      resendIn: 0,
      newPassword: "",
      confirmPassword: "",
      pwdError: null,
    })
  }

  const selectEmail = (selectedEmail: string) => {
    updateState({ selectedEmail })
  }

  const sendForgotPasswordCode = async (): Promise<boolean> => {
    if (!state.selectedEmail) {
      return false
    }

    // Security: only allow sending reset codes to emails associated with this session/user.
    // In profile context, allowed list is the user's email(s); at minimum, match the primary email.
    if (state.selectedEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      updateState({ codeError: "Selected email is not associated with your account." })
      return false
    }

    updateState({ sending: true })
    try {
      const result = await PasswordService.sendResetCode(state.selectedEmail)
      if (!result.success) {
        updateState({ codeError: result.error || "Failed to send code", sending: false })
        return false
      }

      updateState({
        isEmailSelectionModalOpen: false,
        isCodeModalOpen: true,
        forgotPasswordEmail: state.selectedEmail,
        code: "",
        codeError: null,
        codeSent: true,
        resendIn: 60,
      })
      return true
    } catch (error) {
      console.error("Failed to send reset code:", error)
      updateState({ codeError: "Failed to send code. Please try again.", sending: false })
      return false
    } finally {
      updateState({ sending: false })
    }
  }

  const verifyForgotPasswordCode = async () => {
    if (!state.code || state.code.length !== 6) {
      updateState({ codeError: "Invalid code" })
      return false
    }

    if (!state.forgotPasswordEmail) {
      updateState({ codeError: "Email not selected" })
      return false
    }

    try {
      const result = await PasswordService.verifyResetCode(state.forgotPasswordEmail, state.code)
      if (!result.success) {
        updateState({ codeError: result.error || "Verification failed" })
        return false
      }

      updateState({
        resetTokenId: result.tokenId || null,
        isCodeModalOpen: false,
        isForgotPasswordNewPwdModalOpen: true,
        code: "",
        codeError: null,
        newPassword: "",
        confirmPassword: "",
        showNew: false,
        showConfirm: false,
        resendIn: 0,
      })

      return true
    } catch (error) {
      console.error("Verification failed:", error)
      updateState({ codeError: "Verification failed" })
      return false
    }
  }

  const updateForgotPassword = async () => {
    updateState({ pwdError: null })

    if (!state.newPassword || !state.confirmPassword) {
      updateState({ pwdError: "Please fill in all fields" })
      return false
    }

    if (state.newPassword.length < 6) {
      updateState({ pwdError: "New password must be at least 6 characters" })
      return false
    }

    if (state.newPassword !== state.confirmPassword) {
      updateState({ pwdError: "New password and confirmation do not match" })
      return false
    }

    if (!state.resetTokenId) {
      updateState({ pwdError: "Verification required" })
      return false
    }

    try {
      const result = await PasswordService.resetPassword(state.resetTokenId, state.newPassword)
      if (!result.success) {
        updateState({ pwdError: result.error || "Failed to update password" })
        return false
      }

      updateState({
        isForgotPasswordNewPwdModalOpen: false,
        resetTokenId: null,
        newPassword: "",
        confirmPassword: "",
        forgotPasswordEmail: null,
        selectedEmail: null,
      })

      return true
    } catch (error) {
      console.error("Failed to update password:", error)
      updateState({ pwdError: "Failed to update password" })
      return false
    }
  }

  const closeForgotPasswordModals = () => {
    updateState({
      isEmailSelectionModalOpen: false,
      isForgotPasswordNewPwdModalOpen: false,
      isCodeModalOpen: false,
      selectedEmail: null,
      forgotPasswordEmail: null,
      code: "",
      codeError: null,
      codeSent: false,
      resendIn: 0,
      newPassword: "",
      confirmPassword: "",
      showNew: false,
      showConfirm: false,
      pwdError: null,
      resetTokenId: null,
    })
  }

  const toggleCurrentVisibility = () => {
    updateState({ showCurrent: !state.showCurrent })
  }

  const toggleNewVisibility = () => {
    updateState({ showNew: !state.showNew })
  }

  const toggleConfirmVisibility = () => {
    updateState({ showConfirm: !state.showConfirm })
  }

  return {
    state,
    startPasswordChange,
    handleCodeChange,
    verifyCode,
    resendCode,
    updatePassword,
    closeCodeModal,
    closePasswordModal,
    toggleCurrentVisibility,
    toggleNewVisibility,
    toggleConfirmVisibility,
    updateState,
    startForgotPassword,
    selectEmail,
    sendForgotPasswordCode,
    verifyForgotPasswordCode,
    updateForgotPassword,
    closeForgotPasswordModals,
  }
}

export function useTimeHhmm(initial: string = "00:00") {
  const initBuf = (initial || "00:00").replace(/\D/g, "").padEnd(4, "0").slice(0, 4)
  const [buf, setBuf] = useState<string>(initBuf)

  const formatBuf = useCallback((b: string) => `${b.slice(0, 2)}:${b.slice(2, 4)}`, [])

  const apply = useCallback((next: string) => {
    setBuf(next.padStart(4, "0").slice(0, 4))
  }, [])

  const handleDigit = useCallback(
    (digitChar: string) => {
      if (!/^[0-9]$/.test(digitChar)) return
      const next = (buf.slice(1) + digitChar).slice(0, 4)
      apply(next)
    },
    [buf, apply],
  )

  const handleBackspace = useCallback(() => {
    const next = ("0" + buf.slice(0, 3)).slice(0, 4)
    apply(next)
  }, [buf, apply])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key
      if (key === "Tab" || key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End") return
      if (key === "Backspace" || key === "Delete") {
        e.preventDefault()
        handleBackspace()
        return
      }
      if (/^[0-9]$/.test(key)) {
        e.preventDefault()
        handleDigit(key)
        return
      }
      if (key.length === 1) e.preventDefault()
    },
    [handleBackspace, handleDigit],
  )

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "")
      let next = buf
      for (const ch of digits) {
        if (!/[0-9]/.test(ch)) continue
        next = (next.slice(1) + ch).slice(0, 4)
      }
      apply(next)
    },
    [buf, apply],
  )

  const setFromString = useCallback((hhmm: string) => {
    const d = (hhmm || "").replace(/\D/g, "").padEnd(4, "0").slice(0, 4)
    setBuf(d)
  }, [])

  return { value: formatBuf(buf), buf, setFromString, onKeyDown, onPaste }
}

interface UseHorizontalScrollOptions {
  momentumMultiplier?: number
  velocityThreshold?: number
  dragMultiplier?: number
}

export const useHorizontalScroll = (options: UseHorizontalScrollOptions = {}) => {
  const { momentumMultiplier = 300, velocityThreshold = 0.5, dragMultiplier = 1.5 } = options

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [velocity, setVelocity] = useState(0)
  const [lastMoveTime, setLastMoveTime] = useState(0)
  const [lastMoveX, setLastMoveX] = useState(0)

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
    setVelocity(0)
    setLastMoveTime(Date.now())
    setLastMoveX(e.pageX)
    scrollContainerRef.current.style.cursor = "grabbing"
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()

    const currentTime = Date.now()
    const currentX = e.pageX
    const deltaTime = currentTime - lastMoveTime
    const deltaX = currentX - lastMoveX

    if (deltaTime > 0) {
      const newVelocity = deltaX / deltaTime
      setVelocity(newVelocity)
    }

    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * dragMultiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk

    setLastMoveTime(currentTime)
    setLastMoveX(currentX)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab"
      if (Math.abs(velocity) > velocityThreshold) {
        const momentum = velocity * momentumMultiplier
        const currentScroll = scrollContainerRef.current.scrollLeft
        const targetScroll = currentScroll - momentum
        scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: "smooth" })
      }
    }
    setVelocity(0)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab"
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
    setVelocity(0)
    setLastMoveTime(Date.now())
    setLastMoveX(e.touches[0].pageX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()

    const currentTime = Date.now()
    const currentX = e.touches[0].pageX
    const deltaTime = currentTime - lastMoveTime
    const deltaX = currentX - lastMoveX

    if (deltaTime > 0) {
      const newVelocity = deltaX / deltaTime
      setVelocity(newVelocity)
    }

    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * dragMultiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk

    setLastMoveTime(currentTime)
    setLastMoveX(currentX)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (scrollContainerRef.current && Math.abs(velocity) > velocityThreshold) {
      const momentum = velocity * momentumMultiplier
      const currentScroll = scrollContainerRef.current.scrollLeft
      const targetScroll = currentScroll - momentum
      scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: "smooth" })
    }
    setVelocity(0)
  }

  const scroll = (direction: "left" | "right"): void => {
    if (scrollContainerRef.current) {
      const isMobile = window.innerWidth < 640
      const isTablet = window.innerWidth < 768
      const isDesktop = window.innerWidth < 1024

      let scrollAmount
      if (isMobile) scrollAmount = 260
      else if (isTablet) scrollAmount = 300
      else if (isDesktop) scrollAmount = 320
      else scrollAmount = 340

      const currentScroll = scrollContainerRef.current.scrollLeft
      const targetScroll = direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount
      scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: "smooth" })
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollPosition)
      checkScrollPosition()
      return () => container.removeEventListener("scroll", checkScrollPosition)
    }
  }, [])

  return {
    scrollContainerRef,
    isDragging,
    showLeftArrow,
    showRightArrow,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    scroll,
  }
}

interface UseScrollIndicatorsOptions {
  totalItems: number
  itemsPerPage?: number
  isMobile?: boolean
}

export const useScrollIndicators = ({ totalItems, itemsPerPage = 2, isMobile = true }: UseScrollIndicatorsOptions) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const pages = Math.ceil(totalItems / itemsPerPage)
    setTotalPages(pages)
  }, [totalItems, itemsPerPage])

  const updateCurrentPage = (scrollLeft: number, containerWidth: number) => {
    const pageWidth = containerWidth
    const newPage = Math.round(scrollLeft / pageWidth)
    setCurrentPage(Math.min(newPage, totalPages - 1))
  }

  const generateDots = () => {
    return Array.from({ length: totalPages }).map((_, index) => ({ index, isActive: index === currentPage }))
  }

  return { currentPage, totalPages, updateCurrentPage, generateDots, shouldShowIndicators: isMobile && totalPages > 1 }
}

interface CardSizeConfig {
  mobile: string
  small: string
  medium: string
  large: string
  xl: string
}

interface ScrollAmountConfig {
  mobile: number
  tablet: number
  desktop: number
  large: number
}

export const useResponsiveCardSizes = () => {
  const cardSizes: CardSizeConfig = {
    mobile: "w-[220px]",
    small: "xs:w-[240px]",
    medium: "sm:w-[260px]",
    large: "md:w-[280px]",
    xl: "lg:w-[300px]",
  }

  const scrollAmounts: ScrollAmountConfig = {
    mobile: 240,
    tablet: 280,
    desktop: 300,
    large: 320,
  }

  const getCurrentScrollAmount = (): number => {
    if (typeof window === "undefined") return scrollAmounts.large

    const width = window.innerWidth
    if (width < 640) return scrollAmounts.mobile
    if (width < 768) return scrollAmounts.tablet
    if (width < 1024) return scrollAmounts.desktop
    return scrollAmounts.large
  }

  const getCardSizeClasses = (): string => {
    return `${cardSizes.mobile} ${cardSizes.small} ${cardSizes.medium} ${cardSizes.large} ${cardSizes.xl}`
  }

  return { cardSizes, scrollAmounts, getCurrentScrollAmount, getCardSizeClasses }
}

export function useDismissablePopover(open: boolean, wrapRef: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return

    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = wrapRef.current
      if (!el) return
      const target = e.target as Node | null
      if (target && el.contains(target)) return
      onClose()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("mousedown", onDown)
    document.addEventListener("touchstart", onDown, { passive: true })
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("touchstart", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [onClose, open, wrapRef])
}

