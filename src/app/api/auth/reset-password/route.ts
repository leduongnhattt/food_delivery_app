import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/services/auth.service';
import { sendPasswordResetSuccess } from '@/services/email.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tokenId, newPassword } = body;

        // Validate inputs
        if (!tokenId || !newPassword) {
            return NextResponse.json(
                { error: 'Token ID and new password are required' },
                { status: 400 }
            );
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Find valid reset token
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                TokenID: tokenId,
                IsUsed: false,
                ExpiresAt: {
                    gt: new Date()
                }
            },
            include: {
                account: {
                    include: {
                        role: true
                    }
                }
            }
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        // Check if user is customer
        if (resetToken.account.role?.RoleName !== 'Customer') {
            return NextResponse.json(
                { error: 'Invalid reset token' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Start transaction
        await prisma.$transaction(async (tx) => {
            // Update password
            await tx.account.update({
                where: { AccountID: resetToken.AccountID },
                data: { PasswordHash: hashedPassword }
            });

            // Mark reset token as used
            await tx.passwordResetToken.update({
                where: { TokenID: tokenId },
                data: { IsUsed: true }
            });

            // Invalidate all existing auth tokens for security
            await tx.authToken.updateMany({
                where: {
                    AccountID: resetToken.AccountID,
                    IsValid: true
                },
                data: {
                    IsValid: false,
                    RevokedAt: new Date()
                }
            });
        });

        // Send success email
        try {
            await sendPasswordResetSuccess(
                resetToken.account.Email,
                resetToken.account.Username
            );
        } catch (emailError) {
            console.error('Failed to send password reset success email:', emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
