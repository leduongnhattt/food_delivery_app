import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { hashPassword, verifyPassword } from '@/services/auth.service'

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const auth = getAuthenticatedUser(request)
        if (!auth.success) {
            return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
        }
        const userId = auth.user!.id

        const body = await request.json()
        const { currentPassword, newPassword } = body

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'New password must be at least 6 characters long' },
                { status: 400 }
            )
        }

        // Check if new password is same as current password
        if (currentPassword === newPassword) {
            return NextResponse.json(
                { error: 'New password must be different from current password' },
                { status: 400 }
            )
        }

        // Get user account with password hash
        const account = await prisma.account.findUnique({
            where: { AccountID: userId },
            select: {
                AccountID: true,
                PasswordHash: true,
                Email: true,
                Username: true
            }
        })

        if (!account) {
            return NextResponse.json(
                { error: 'User account not found' },
                { status: 404 }
            )
        }

        // Verify current password
        if (!account.PasswordHash) {
            return NextResponse.json(
                { error: 'User account has no password set' },
                { status: 400 }
            )
        }

        const isCurrentPasswordValid = await verifyPassword(currentPassword, account.PasswordHash)
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword)

        // Start transaction to update password and invalidate existing tokens
        await prisma.$transaction(async (tx) => {
            // Update password
            await tx.account.update({
                where: { AccountID: userId },
                data: { PasswordHash: hashedNewPassword }
            })

            // Invalidate all existing auth tokens for security
            await tx.authToken.updateMany({
                where: {
                    AccountID: userId,
                    IsValid: true
                },
                data: {
                    IsValid: false,
                    RevokedAt: new Date()
                }
            })
        })

        return NextResponse.json({
            success: true,
            message: 'Password has been changed successfully. Please log in again.'
        })

    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        )
    }
}
