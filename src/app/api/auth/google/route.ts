import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateGoogleUser, verifyGoogleToken } from '@/services/oauth.service'
import { issueTokens } from '@/services/auth.service'

// Note: OAuth2 client moved to oauth.service.ts

function setRefreshCookie(res: NextResponse, token: string, expires: Date) {
  res.cookies.set('refresh_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential } = body

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      )
    }

    // Verify the Google token and get user info
    const googleUser = await verifyGoogleToken(credential)

    // Create or find the user account based on Google info
    let user;
    try {
      user = await findOrCreateGoogleUser(googleUser)
    } catch (error) {
      console.error('Google user creation error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create user account' },
        { status: 400 }
      )
    }

    // Check if user is a customer (optional)
    if (!user.role || user.role.RoleName !== 'Customer') {
      console.error('User role check failed:', {
        userId: user.AccountID,
        role: user.role,
        roleName: user.role?.RoleName
      });
      return NextResponse.json(
        { error: 'Access denied. This login is for customers only.' },
        { status: 403 }
      )
    }

    // Issue tokens
    const { accessToken, refreshToken, expiredAt } = await issueTokens(
      user.AccountID,
      user.role?.RoleName || 'customer',
      'google' // Provider for Google OAuth login
    )

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.AccountID,
        username: user.Username,
        email: user.Email,
        role: user.role?.RoleName || 'Customer',
        status: user.Status
      },
      accessToken
    })

    // Set refresh token cookie
    setRefreshCookie(response, refreshToken, expiredAt)

    return response
  } catch (error) {
    console.error('Google login error:', error)
    return NextResponse.json(
      { error: 'Google authentication failed' },
      { status: 500 }
    )
  }
}