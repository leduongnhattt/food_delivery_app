import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, code } = body;

        // Validate inputs
        if (!email || !code) {
            return NextResponse.json(
                { error: 'Email and reset code are required' },
                { status: 400 }
            );
        }

        if (typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
            return NextResponse.json(
                { error: 'Invalid reset code format' },
                { status: 400 }
            );
        }

        // Find account by email
        const account = await prisma.account.findFirst({
            where: {
                Email: email.toLowerCase(),
                Status: 'Active'
            },
            include: {
                role: true
            }
        });

        if (!account) {
            return NextResponse.json(
                { error: 'Invalid email or reset code' },
                { status: 400 }
            );
        }

        // Check if user is customer
        if (account.role?.RoleName !== 'Customer') {
            return NextResponse.json(
                { error: 'Invalid email or reset code' },
                { status: 400 }
            );
        }

        // Find valid reset token
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                AccountID: account.AccountID,
                ResetCode: code,
                IsUsed: false,
                ExpiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: 'Invalid or expired reset code' },
                { status: 400 }
            );
        }

        // Return success with token ID for password reset
        return NextResponse.json({
            success: true,
            message: 'Reset code verified successfully',
            tokenId: resetToken.TokenID
        });

    } catch (error) {
        console.error('Verify reset code error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
