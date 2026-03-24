'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileSummary } from '@/components/profile/ProfileSummary'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard'
import { VerifyCodeModal } from '@/components/profile/VerifyCodeModal'
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal'
import { EmailSelectionModal, ForgotPasswordNewPasswordModal } from '@/components/profile/ForgotPasswordModals'
import { NotificationToast } from '@/components/profile/NotificationToast'
import { useProfileData } from '@/hooks/use-profile-data'
import { usePasswordChange } from '@/hooks/use-password-change'
import { useToast } from '@/contexts/toast-context'

export default function ProfilePage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  // Custom hooks for state management
  const {
    profileData,
    isEditing,
    notification,
    setIsEditing,
    updateField,
    saveProfile,
    clearNotification,
    resetProfileChanges
  } = useProfileData()

  const {
    state: passwordState,
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
    // Forgot password flow
    startForgotPassword,
    selectEmail,
    sendForgotPasswordCode,
    verifyForgotPasswordCode,
    updateForgotPassword,
    closeForgotPasswordModals
  } = usePasswordChange(profileData.email)

  // Handler functions using hooks
  const handleFieldChange = (field: string, value: string) => {
    updateField(field as keyof typeof profileData, value)
  }

  const handleSaveProfile = async () => {
    await saveProfile()
  }

  const handleChangePassword = async () => {
    await startPasswordChange()
  }

  const handleVerifyCode = async () => {
    // Check if this is forgot password flow
    if (passwordState.forgotPasswordEmail) {
      await handleVerifyForgotPasswordCode()
    } else {
      await verifyCode()
    }
  }

  const handleResendCode = async () => {
    await resendCode()
  }

  const handleUpdatePassword = async () => {
    const success = await updatePassword()
    if (success) {
      showToast('Password changed successfully! Please log in again.', 'success')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  // Forgot password flow handlers
  const handleForgotPasswordClick = () => {
    startForgotPassword()
  }

  const handleSelectEmail = (email: string) => {
    selectEmail(email)
  }

  const handleSendForgotPasswordCode = async () => {
    await sendForgotPasswordCode()
  }

  const handleVerifyForgotPasswordCode = async () => {
    const success = await verifyForgotPasswordCode()
    if (!success) {
      // Error is already handled in hook
      return
    }
  }

  const handleUpdateForgotPassword = async () => {
    const success = await updateForgotPassword()
    if (success) {
      showToast('Password changed successfully! Please log in again.', 'success')
      closeForgotPasswordModals()
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  // Get available emails (currently only user's email, but can be extended)
  const availableEmails = [profileData.email]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="max-w-5xl mx-auto">
            <NotificationToast 
              notification={notification} 
              onClose={clearNotification} 
            />
            
            <ProfileHeader onBack={() => router.back()} />

            {/* Profile content */}
            <Card className="shadow-sm border border-gray-200 bg-white rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-gray-900">Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <ProfileSummary 
                  fullName={profileData.fullName}
                  email={profileData.email}
                  isEditing={isEditing}
                  onEdit={() => setIsEditing(true)}
                  avatarUrl={profileData.avatar}
                />

                <ProfileForm 
                  profileData={profileData}
                  isEditing={isEditing}
                  onFieldChange={handleFieldChange}
                  onSave={handleSaveProfile}
                  onCancel={resetProfileChanges}
                />
              </CardContent>
            </Card>

            <ChangePasswordCard 
              onChangePassword={handleChangePassword}
            />

            {/* Code verification modal (used for both normal and forgot password flow) */}
            <VerifyCodeModal
              isOpen={passwordState.isCodeModalOpen}
              email={passwordState.forgotPasswordEmail || profileData.email}
              code={passwordState.code}
              codeError={passwordState.codeError}
              sending={passwordState.sending}
              resendIn={passwordState.resendIn}
              onClose={passwordState.forgotPasswordEmail ? closeForgotPasswordModals : closeCodeModal}
              onCodeChange={handleCodeChange}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
            />

            <ChangePasswordModal
              isOpen={passwordState.isChangePwdModalOpen}
              canEditPassword={passwordState.canEditPassword}
              currentPassword={passwordState.currentPassword}
              newPassword={passwordState.newPassword}
              confirmPassword={passwordState.confirmPassword}
              showCurrent={passwordState.showCurrent}
              showNew={passwordState.showNew}
              showConfirm={passwordState.showConfirm}
              pwdError={passwordState.pwdError}
              onClose={closePasswordModal}
              onCurrentPasswordChange={(value) => updateState({ currentPassword: value })}
              onNewPasswordChange={(value) => updateState({ newPassword: value })}
              onConfirmPasswordChange={(value) => updateState({ confirmPassword: value })}
              onToggleCurrentVisibility={toggleCurrentVisibility}
              onToggleNewVisibility={toggleNewVisibility}
              onToggleConfirmVisibility={toggleConfirmVisibility}
              onUpdatePassword={handleUpdatePassword}
              onForgotPasswordClick={handleForgotPasswordClick}
            />

            {/* Forgot password flow modals */}
            <EmailSelectionModal
              isOpen={passwordState.isEmailSelectionModalOpen}
              emails={availableEmails}
              selectedEmail={passwordState.selectedEmail}
              sending={passwordState.sending}
              onSelectEmail={handleSelectEmail}
              onSendCode={handleSendForgotPasswordCode}
              onClose={closeForgotPasswordModals}
            />

            <ForgotPasswordNewPasswordModal
              isOpen={passwordState.isForgotPasswordNewPwdModalOpen}
              newPassword={passwordState.newPassword}
              confirmPassword={passwordState.confirmPassword}
              showNew={passwordState.showNew}
              showConfirm={passwordState.showConfirm}
              pwdError={passwordState.pwdError}
              isLoading={false}
              onNewPasswordChange={(value) => updateState({ newPassword: value })}
              onConfirmPasswordChange={(value) => updateState({ confirmPassword: value })}
              onToggleNewVisibility={toggleNewVisibility}
              onToggleConfirmVisibility={toggleConfirmVisibility}
              onUpdatePassword={handleUpdateForgotPassword}
              onClose={closeForgotPasswordModals}
            />
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
