interface SendCodeResponse {
    success: boolean
    error?: string
}

interface VerifyCodeResponse {
    success: boolean
    tokenId?: string
    error?: string
}

interface ResetPasswordResponse {
    success: boolean
    error?: string
}

export class PasswordService {
    static async sendResetCode(email: string): Promise<SendCodeResponse> {
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Failed to send code' }))
                return { success: false, error: err.error }
            }

            return { success: true }
        } catch {
            return { success: false, error: 'Failed to send code' }
        }
    }

    static async resendResetCode(email: string): Promise<SendCodeResponse> {
        try {
            const res = await fetch('/api/auth/resend-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Failed to resend code' }))
                return { success: false, error: err.error }
            }

            return { success: true }
        } catch {
            return { success: false, error: 'Failed to resend code' }
        }
    }

    static async verifyResetCode(email: string, code: string): Promise<VerifyCodeResponse> {
        try {
            const res = await fetch('/api/auth/verify-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            })

            const data = await res.json()

            if (!res.ok || !data.success) {
                return { success: false, error: data.error || 'Invalid or expired code' }
            }

            return { success: true, tokenId: data.tokenId }
        } catch {
            return { success: false, error: 'Verification failed' }
        }
    }

    static async resetPassword(tokenId: string, newPassword: string): Promise<ResetPasswordResponse> {
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokenId, newPassword })
            })

            const data = await res.json()

            if (!res.ok || !data.success) {
                return { success: false, error: data.error || 'Failed to update password' }
            }

            return { success: true }
        } catch {
            return { success: false, error: 'Failed to update password' }
        }
    }
}
