import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetCode } from '@/services/email.service';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Generate 6-digit random code
 */
function generateResetCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check rate limit for email
 */
function checkRateLimit(email: string): boolean {
    const now = Date.now();
    const key = `resend_reset_${email}`;
    const limit = rateLimitStore.get(key);

    if (!limit) {
        rateLimitStore.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
        return true;
    }

    if (now > limit.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + 60000 });
        return true;
    }

    if (limit.count >= 3) {
        return false; // Max 3 attempts per minute
    }

    limit.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check rate limit
        if (!checkRateLimit(email)) {
            return NextResponse.json(
                { error: 'Too many resend attempts. Please wait a moment.' },
                { status: 429 }
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
                { error: 'Account not found' },
                { status: 404 }
            );
        }

        // Check if user is customer
        if (account.role?.RoleName !== 'Customer') {
            return NextResponse.json(
                { error: 'Account not found' },
                { status: 404 }
            );
        }

        // Generate new reset code
        const resetCode = generateResetCode();
        const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

        // Invalidate any existing reset tokens for this account
        await prisma.passwordResetToken.updateMany({
            where: {
                AccountID: account.AccountID,
                IsUsed: false
            },
            data: {
                IsUsed: true
            }
        });

        // Create new reset token
        await prisma.passwordResetToken.create({
            data: {
                AccountID: account.AccountID,
                ResetCode: resetCode,
                ExpiresAt: expiresAt,
                IsUsed: false
            }
        });

        // Send email
        const emailSent = await sendPasswordResetCode(
            account.Email,
            resetCode,
            account.Username
        );

        if (!emailSent) {
            console.error('Failed to send password reset email to:', account.Email);
            return NextResponse.json(
                { error: 'Failed to send reset code. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'New reset code has been sent to your email'
        });

    } catch (error) {
        console.error('Resend reset code error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}

